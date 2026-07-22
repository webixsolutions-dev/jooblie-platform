-- Phase 1.7a — In-app notifications.
--
-- Notification rows are pointers to source entities, not content snapshots.
-- Source-table AFTER triggers are the only creation path; clients may only
-- read their rows and mark read_at. Email dispatch lands in slice 2.1.

create type public.notification_type as enum (
  'application_status_changed',
  'job_new_applicant',
  'company_verification_request',
  'company_verified',
  'company_rejected'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  site_id smallint references public.sites (id) on delete restrict,
  entity_type text not null,
  entity_id uuid not null,
  data jsonb not null default '{}',
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

create index notifications_email_pending_created_idx
  on public.notifications (created_at)
  where emailed_at is null;

alter table public.notifications enable row level security;

revoke all privileges on table public.notifications from anon, authenticated;

grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

create policy notifications_user_select
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

create policy notifications_user_update
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy notifications_admin_select
on public.notifications
for select
to authenticated
using (public.is_admin());

-- FIX B: deletion is irreversible, so deleted recipients receive no new rows.
-- Suspended recipients deliberately remain eligible because suspension can be
-- reversed. This guard is the system-wide enforcement point for every writer.
create function public.guard_deleted_notification_recipient()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.profiles as profile
    where profile.id = new.user_id
      and profile.status = 'deleted'
  ) then
    return null;
  end if;

  return new;
end;
$$;

revoke all on function public.guard_deleted_notification_recipient() from public;

create trigger notifications_guard_deleted_recipient
before insert on public.notifications
for each row
execute function public.guard_deleted_notification_recipient();

-- Single notification-write primitive. It intentionally remains ungranted to
-- client roles; source-table triggers execute it as the function owner.
create function public.emit_notification(
  _user_id uuid,
  _type public.notification_type,
  _site_id smallint,
  _entity_type text,
  _entity_id uuid,
  _data jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (
    user_id,
    type,
    site_id,
    entity_type,
    entity_id,
    data
  )
  values (
    _user_id,
    _type,
    _site_id,
    _entity_type,
    _entity_id,
    coalesce(_data, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.emit_notification(
  uuid,
  public.notification_type,
  smallint,
  text,
  uuid,
  jsonb
) from public;

-- FIX 3: every member of the job's company receives one new-applicant row.
-- The guard above silently filters only members whose profile is deleted.
create function public.notify_company_members_of_new_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.emit_notification(
    membership.user_id,
    'job_new_applicant',
    job.origin_site_id,
    'application',
    new.id,
    pg_catalog.jsonb_build_object('job_id', new.job_id)
  )
  from public.jobs as job
  join public.company_members as membership
    on membership.company_id = job.company_id
  where job.id = new.job_id;

  return new;
end;
$$;

revoke all on function public.notify_company_members_of_new_application() from public;

create trigger applications_notify_new_applicant
after insert on public.applications
for each row
execute function public.notify_company_members_of_new_application();

-- Applicant-facing only. A seeker withdrawing their own application is the
-- recipient/actor, so that path deliberately produces no notification.
create function public.notify_applicant_of_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not distinct from new.applicant_id then
    return new;
  end if;

  perform public.emit_notification(
    new.applicant_id,
    'application_status_changed',
    new.applied_via_site_id,
    'application',
    new.id,
    pg_catalog.jsonb_build_object('old', old.status, 'new', new.status)
  );

  return new;
end;
$$;

revoke all on function public.notify_applicant_of_status_change() from public;

create trigger applications_notify_status_changed
after update on public.applications
for each row
when (old.status is distinct from new.status)
execute function public.notify_applicant_of_status_change();

create function public.notify_company_verification_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.verification_status = 'verified' then
    perform public.emit_notification(
      membership.user_id,
      'company_verified',
      null,
      'company',
      new.id,
      '{}'::jsonb
    )
    from public.company_members as membership
    where membership.company_id = new.id
      and membership.role = 'owner';
  elsif new.verification_status = 'rejected' then
    perform public.emit_notification(
      membership.user_id,
      'company_rejected',
      null,
      'company',
      new.id,
      pg_catalog.jsonb_build_object('reason', new.rejection_reason)
    )
    from public.company_members as membership
    where membership.company_id = new.id
      and membership.role = 'owner';
  elsif old.verification_status = 'rejected'
        and new.verification_status = 'pending'
  then
    perform public.emit_notification(
      profile.id,
      'company_verification_request',
      null,
      'company',
      new.id,
      pg_catalog.jsonb_build_object('resubmitted', true)
    )
    from public.profiles as profile
    where profile.role = 'admin';
  end if;

  return new;
end;
$$;

revoke all on function public.notify_company_verification_change() from public;

create trigger companies_notify_verification_changed
after update on public.companies
for each row
when (old.verification_status is distinct from new.verification_status)
execute function public.notify_company_verification_change();

create function public.notify_admins_of_company_verification_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.emit_notification(
    profile.id,
    'company_verification_request',
    null,
    'company',
    new.id,
    pg_catalog.jsonb_build_object('resubmitted', false)
  )
  from public.profiles as profile
  where profile.role = 'admin';

  return new;
end;
$$;

revoke all on function public.notify_admins_of_company_verification_request() from public;

-- This sorts before 0006's on_company_created AFTER INSERT trigger. That is
-- safe: admin fan-out does not depend on the owner membership row existing.
create trigger companies_notify_verification_request
after insert on public.companies
for each row
execute function public.notify_admins_of_company_verification_request();
