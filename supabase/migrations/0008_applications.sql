-- Phase 1.6 — Applications, saved jobs and view tracking.
--
-- This slice completes the seeker job-read boundary from 0007 and adds the
-- recruiter-to-applicant profile boundary. Application rate limiting, anonymous
-- view throttling and private resume storage land in 0011-0013 (slice 1.8).
-- Application activity and notification writes land in 0009-0010 (slice 1.7).

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete restrict,
  applicant_id uuid not null default auth.uid()
    references public.profiles (id) on delete no action,
  resume_path text not null,
  cover_letter text,
  applied_via_site_id smallint not null references public.sites (id) on delete restrict,
  status public.application_status not null default 'submitted',
  status_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint applications_unique_job_applicant unique (job_id, applicant_id)
);

create table public.saved_jobs (
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  saved_via_site_id smallint not null references public.sites (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table public.job_views (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  viewer_id uuid references public.profiles (id) on delete set null,
  viewed_on date not null default current_date,
  site_id smallint not null references public.sites (id) on delete restrict,
  created_at timestamptz not null default now()
);

-- Supports the rolling application-rate query that lands with platform_config
-- in slice 1.8.
create index applications_applicant_created_idx
  on public.applications (applicant_id, created_at desc);

create index saved_jobs_job_id_idx
  on public.saved_jobs (job_id);

create unique index job_views_authenticated_daily_unique_idx
  on public.job_views (job_id, viewer_id, viewed_on)
  where viewer_id is not null;

create index job_views_job_created_idx
  on public.job_views (job_id, created_at desc);

-- A resume path is an application-time snapshot. Column grants already withhold
-- UPDATE(resume_path); this trigger also protects definer/service paths.
create function public.enforce_application_resume_immutability()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.resume_path is distinct from old.resume_path then
    raise exception 'application resume snapshot is immutable'
      using errcode = 'JB008';
  end if;

  return new;
end;
$$;

create trigger applications_enforce_resume_immutability
before update on public.applications
for each row
execute function public.enforce_application_resume_immutability();

-- Actor-aware application state machine.
--
-- Ranked recruiter pipeline:
-- submitted(0) -> viewed(1) -> shortlisted(2) -> interviewing(3) ->
-- offered(4) -> hired(5). Forward skips are legal except that hired is reachable
-- only from offered. Rejected is reachable from any non-terminal state;
-- withdrawn is seeker-only. hired/rejected/withdrawn are terminal.
create function public.validate_application_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  application_company_id uuid;
  old_status_rank smallint;
  new_status_rank smallint;
begin
  select job.company_id
  into application_company_id
  from public.jobs as job
  where job.id = old.job_id;

  if auth.uid() = old.applicant_id then
    if old.status in ('hired', 'rejected', 'withdrawn') then
      raise exception 'cannot withdraw an application from terminal status %', old.status
        using errcode = 'JB008';
    elsif new.status <> 'withdrawn' then
      raise exception 'applicants may only transition their application to withdrawn'
        using errcode = 'JB008';
    end if;
  elsif public.is_company_member(application_company_id) then
    if old.status in ('hired', 'rejected', 'withdrawn') then
      raise exception 'cannot transition an application from terminal status %', old.status
        using errcode = 'JB008';
    elsif new.status = 'withdrawn' then
      raise exception 'recruiters may not withdraw applications'
        using errcode = 'JB008';
    elsif new.status = 'rejected' then
      null;
    elsif new.status = 'hired' then
      if old.status <> 'offered' then
        raise exception 'hired is reachable only from offered'
          using errcode = 'JB008';
      end if;
    else
      old_status_rank := case old.status
        when 'submitted' then 0
        when 'viewed' then 1
        when 'shortlisted' then 2
        when 'interviewing' then 3
        when 'offered' then 4
        when 'hired' then 5
        else null
      end;

      new_status_rank := case new.status
        when 'submitted' then 0
        when 'viewed' then 1
        when 'shortlisted' then 2
        when 'interviewing' then 3
        when 'offered' then 4
        when 'hired' then 5
        else null
      end;

      if old_status_rank is null
         or new_status_rank is null
         or new_status_rank <= old_status_rank
      then
        raise exception 'illegal recruiter application transition: % -> %',
          old.status,
          new.status
          using errcode = 'JB008';
      end if;
    end if;
  else
    raise exception 'actor may not transition this application'
      using errcode = 'JB008';
  end if;

  new.status_updated_at := pg_catalog.now();
  return new;
end;
$$;

create trigger applications_validate_status_transition
before update on public.applications
for each row
when (old.status is distinct from new.status)
execute function public.validate_application_status_transition();

create trigger applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

-- Cross-table RLS helpers are SECURITY DEFINER to avoid recursively evaluating
-- jobs/applications policies while establishing the caller's boundary.
create function public.is_company_member_for_job(_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.jobs as job
    where job.id = _job_id
      and public.is_company_member(job.company_id)
  );
$$;

create function public.job_accepts_applications(_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.jobs as job
    where job.id = _job_id
      and job.status = 'active'
      and job.deleted_at is null
      and not public.company_is_suspended(job.company_id)
  );
$$;

create function public.has_applied(_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications as application
    where application.job_id = _job_id
      and application.applicant_id = auth.uid()
  );
$$;

create function public.has_saved(_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.saved_jobs as saved_job
    where saved_job.job_id = _job_id
      and saved_job.user_id = auth.uid()
  );
$$;

create function public.can_recruiter_view_applicant(_applicant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications as application
    join public.jobs as job on job.id = application.job_id
    where application.applicant_id = _applicant_id
      and public.is_company_member(job.company_id)
  );
$$;

alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.job_views enable row level security;

-- applications.status is intentionally client-writable. The status trigger
-- enforces actor + graph authorization and stamps status_updated_at.
revoke insert, update, delete on table public.applications from anon, authenticated;

grant select on table public.applications to authenticated;

grant insert (
  job_id,
  resume_path,
  cover_letter,
  applied_via_site_id
) on table public.applications to authenticated;

grant update (status) on table public.applications to authenticated;

revoke insert, update, delete on table public.saved_jobs from anon, authenticated;
grant select on table public.saved_jobs to authenticated;
grant insert (job_id, saved_via_site_id) on table public.saved_jobs to authenticated;
grant delete on table public.saved_jobs to authenticated;

revoke insert, update, delete on table public.job_views from anon, authenticated;
grant select on table public.job_views to authenticated;
grant insert (job_id, viewer_id, site_id) on table public.job_views to anon, authenticated;

create policy applications_job_seeker_select
on public.applications
for select
to authenticated
using (applicant_id = auth.uid());

create policy applications_recruiter_select
on public.applications
for select
to authenticated
using (
  public.is_recruiter()
  and public.is_company_member_for_job(job_id)
);

create policy applications_admin_select
on public.applications
for select
to authenticated
using (public.is_admin());

create policy applications_job_seeker_insert
on public.applications
for insert
to authenticated
with check (
  applicant_id = auth.uid()
  and not public.is_recruiter()
  and not public.is_admin()
  and not public.is_suspended()
  and public.job_accepts_applications(job_id)
);

create policy applications_job_seeker_update
on public.applications
for update
to authenticated
using (
  applicant_id = auth.uid()
  and not public.is_recruiter()
  and not public.is_admin()
  and not public.is_suspended()
)
with check (
  applicant_id = auth.uid()
  and not public.is_recruiter()
  and not public.is_admin()
  and not public.is_suspended()
);

create policy applications_recruiter_update
on public.applications
for update
to authenticated
using (
  public.is_recruiter()
  and public.is_company_member_for_job(job_id)
  and not public.is_suspended()
)
with check (
  public.is_recruiter()
  and public.is_company_member_for_job(job_id)
  and not public.is_suspended()
);

create policy saved_jobs_job_seeker_select
on public.saved_jobs
for select
to authenticated
using (user_id = auth.uid());

create policy saved_jobs_job_seeker_insert
on public.saved_jobs
for insert
to authenticated
with check (user_id = auth.uid());

create policy saved_jobs_job_seeker_delete
on public.saved_jobs
for delete
to authenticated
using (user_id = auth.uid());

-- Keep one policy per database role + operation while preserving the combined
-- spoof-guard contract from FIX 2.
create policy job_views_anon_insert
on public.job_views
for insert
to anon
with check (viewer_id is null and auth.uid() is null);

create policy job_views_authenticated_insert
on public.job_views
for insert
to authenticated
with check (viewer_id = auth.uid());

create policy job_views_recruiter_select
on public.job_views
for select
to authenticated
using (
  public.is_recruiter()
  and public.is_company_member_for_job(job_id)
);

create policy job_views_admin_select
on public.job_views
for select
to authenticated
using (public.is_admin());

-- FIX 1 completion: own applied/saved branches intentionally bypass lifecycle,
-- soft-delete and company-suspension filters so seeker dashboards retain context.
drop policy jobs_job_seeker_select on public.jobs;

create policy jobs_job_seeker_select
on public.jobs
for select
to authenticated
using (
  (
    status = 'active'
    and deleted_at is null
    and not public.company_is_suspended(company_id)
  )
  or public.has_applied(id)
  or public.has_saved(id)
);

create policy profiles_recruiter_select_applicant
on public.profiles
for select
to authenticated
using (
  status <> 'deleted'
  and public.is_recruiter()
  and public.can_recruiter_view_applicant(id)
);
