-- Phase 1.7b — Append-only activity log.
--
-- Every row is written by an AFTER trigger on the source table. Clients have
-- no mutation grants or policies, and only admins may read the raw v1 log.

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete no action,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  site_id smallint references public.sites (id) on delete restrict,
  company_id uuid references public.companies (id) on delete set null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index activity_log_created_idx
  on public.activity_log (created_at desc);

create index activity_log_entity_idx
  on public.activity_log (entity_type, entity_id);

create index activity_log_company_created_idx
  on public.activity_log (company_id, created_at desc);

comment on column public.activity_log.action is
  'v1 actions: job.created, job.status_changed, application.submitted, application.status_changed, company.created, company.verified, company.rejected, company.resubmitted, company.suspended, company.unsuspended, user.suspended, user.unsuspended, user.deleted';

alter table public.activity_log enable row level security;

revoke all privileges on table public.activity_log from anon, authenticated;
grant select on table public.activity_log to authenticated;

create policy activity_log_admin_select
on public.activity_log
for select
to authenticated
using (public.is_admin());

-- Single append primitive. auth.uid() is nullable by design so cron/system
-- transitions with no JWT are recorded with actor_id = NULL.
create function public.log_activity(
  _action text,
  _entity_type text,
  _entity_id uuid,
  _site_id smallint,
  _company_id uuid,
  _data jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity_log (
    actor_id,
    action,
    entity_type,
    entity_id,
    site_id,
    company_id,
    data
  )
  values (
    auth.uid(),
    _action,
    _entity_type,
    _entity_id,
    _site_id,
    _company_id,
    coalesce(_data, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.log_activity(
  text,
  text,
  uuid,
  smallint,
  uuid,
  jsonb
) from public;

create function public.log_job_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.log_activity(
    'job.created',
    'job',
    new.id,
    new.origin_site_id,
    new.company_id,
    '{}'::jsonb
  );

  return new;
end;
$$;

revoke all on function public.log_job_created() from public;

create trigger jobs_log_created
after insert on public.jobs
for each row
execute function public.log_job_created();

create function public.log_job_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.log_activity(
    'job.status_changed',
    'job',
    new.id,
    new.origin_site_id,
    new.company_id,
    pg_catalog.jsonb_build_object('old', old.status, 'new', new.status)
  );

  return new;
end;
$$;

revoke all on function public.log_job_status_change() from public;

create trigger jobs_log_status_changed
after update on public.jobs
for each row
when (old.status is distinct from new.status)
execute function public.log_job_status_change();

create function public.log_application_submitted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  application_company_id uuid;
begin
  select job.company_id
  into application_company_id
  from public.jobs as job
  where job.id = new.job_id;

  perform public.log_activity(
    'application.submitted',
    'application',
    new.id,
    new.applied_via_site_id,
    application_company_id,
    '{}'::jsonb
  );

  return new;
end;
$$;

revoke all on function public.log_application_submitted() from public;

create trigger applications_log_submitted
after insert on public.applications
for each row
execute function public.log_application_submitted();

create function public.log_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  application_company_id uuid;
begin
  select job.company_id
  into application_company_id
  from public.jobs as job
  where job.id = new.job_id;

  perform public.log_activity(
    'application.status_changed',
    'application',
    new.id,
    new.applied_via_site_id,
    application_company_id,
    pg_catalog.jsonb_build_object('old', old.status, 'new', new.status)
  );

  return new;
end;
$$;

revoke all on function public.log_application_status_change() from public;

create trigger applications_log_status_changed
after update on public.applications
for each row
when (old.status is distinct from new.status)
execute function public.log_application_status_change();

create function public.log_company_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.log_activity(
    'company.created',
    'company',
    new.id,
    null,
    new.id,
    '{}'::jsonb
  );

  return new;
end;
$$;

revoke all on function public.log_company_created() from public;

-- This sorts before 0006's on_company_created AFTER INSERT trigger. Company
-- creation logging does not depend on the owner membership row existing.
create trigger companies_log_created
after insert on public.companies
for each row
execute function public.log_company_created();

create function public.log_company_verification_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_action text;
  activity_data jsonb;
begin
  if new.verification_status = 'verified' then
    activity_action := 'company.verified';
    activity_data := pg_catalog.jsonb_build_object(
      'old', old.verification_status,
      'new', new.verification_status
    );
  elsif new.verification_status = 'rejected' then
    activity_action := 'company.rejected';
    activity_data := pg_catalog.jsonb_build_object(
      'old', old.verification_status,
      'new', new.verification_status,
      'reason', new.rejection_reason
    );
  elsif old.verification_status = 'rejected'
        and new.verification_status = 'pending'
  then
    activity_action := 'company.resubmitted';
    activity_data := pg_catalog.jsonb_build_object(
      'old', old.verification_status,
      'new', new.verification_status
    );
  else
    return new;
  end if;

  perform public.log_activity(
    activity_action,
    'company',
    new.id,
    null,
    new.id,
    activity_data
  );

  return new;
end;
$$;

revoke all on function public.log_company_verification_change() from public;

create trigger companies_log_verification_changed
after update on public.companies
for each row
when (old.verification_status is distinct from new.verification_status)
execute function public.log_company_verification_change();

create function public.log_company_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_action text;
begin
  if new.status = 'suspended' then
    activity_action := 'company.suspended';
  elsif old.status = 'suspended' and new.status = 'active' then
    activity_action := 'company.unsuspended';
  else
    return new;
  end if;

  perform public.log_activity(
    activity_action,
    'company',
    new.id,
    null,
    new.id,
    pg_catalog.jsonb_build_object('old', old.status, 'new', new.status)
  );

  return new;
end;
$$;

revoke all on function public.log_company_status_change() from public;

create trigger companies_log_status_changed
after update on public.companies
for each row
when (old.status is distinct from new.status)
execute function public.log_company_status_change();

create function public.log_profile_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_action text;
begin
  if new.status = 'suspended' then
    activity_action := 'user.suspended';
  elsif old.status = 'suspended' and new.status = 'active' then
    activity_action := 'user.unsuspended';
  elsif new.status = 'deleted' then
    activity_action := 'user.deleted';
  else
    return new;
  end if;

  perform public.log_activity(
    activity_action,
    'user',
    new.id,
    null,
    null,
    pg_catalog.jsonb_build_object('old', old.status, 'new', new.status)
  );

  return new;
end;
$$;

revoke all on function public.log_profile_status_change() from public;

create trigger profiles_log_status_changed
after update on public.profiles
for each row
when (old.status is distinct from new.status)
execute function public.log_profile_status_change();
