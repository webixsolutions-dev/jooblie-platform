-- Phase 1.5 — Jobs (SystemDesign §§2, 4.1, 4.4, 6).
--
-- Write-path summary:
--   * recruiters may write only the explicitly granted content columns;
--     ownership, origin and lifecycle columns are protected by grants + RLS.
--   * BEFORE INSERT derives lifecycle state from company verification.
--   * AFTER INSERT is the only writer of job_sites and enforces the binding
--     origin + Jooblie visibility contract.
--   * lifecycle changes must follow the caller-agnostic transition graph.

-- The fixed Jooblie site id is centralized here. Migration 0014 must seed the
-- `jooblie` site with id 1 and its registry cross-check must compare the seed
-- against this helper (see AGENTS_GUIDE.md).
create function public.jooblie_site_id()
returns smallint
language sql
immutable
set search_path = ''
as $$
  select 1::smallint;
$$;

-- Public job reads must hide jobs owned by suspended companies. A definer
-- helper avoids recursively evaluating companies RLS from jobs policies.
create function public.company_is_suspended(_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.companies as company
    where company.id = _company_id
      and company.status = 'suspended'
  );
$$;

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete restrict,
  origin_site_id smallint not null references public.sites (id) on delete restrict,
  created_by uuid not null default auth.uid()
    references public.profiles (id) on delete no action,
  category_id smallint not null references public.categories (id) on delete restrict,
  title text not null,
  description text not null,
  province text,
  city text,
  is_remote boolean not null default false,
  salary_min numeric(12, 2),
  salary_max numeric(12, 2),
  salary_currency char(3) not null default 'CAD',
  salary_period public.salary_period,
  employment_type public.employment_type not null,
  skills text[] not null default '{}',
  status public.job_status not null default 'pending_review',
  published_at timestamptz,
  expires_at timestamptz,
  removed_reason text,
  search_vector tsvector generated always as (
    pg_catalog.setweight(
      pg_catalog.to_tsvector(
        'pg_catalog.english'::regconfig,
        coalesce(title, '')
      ),
      'A'
    ) ||
    pg_catalog.setweight(
      pg_catalog.to_tsvector(
        'pg_catalog.english'::regconfig,
        public.immutable_arr_join(skills)
      ),
      'B'
    ) ||
    pg_catalog.setweight(
      pg_catalog.to_tsvector(
        'pg_catalog.english'::regconfig,
        coalesce(description, '')
      ),
      'C'
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint jobs_salary_min_nonnegative_check
    check (salary_min is null or salary_min >= 0),
  constraint jobs_salary_max_nonnegative_check
    check (salary_max is null or salary_max >= 0),
  constraint jobs_salary_range_check
    check (salary_min is null or salary_max is null or salary_min <= salary_max)
);

create table public.job_sites (
  job_id uuid not null references public.jobs (id) on delete cascade,
  site_id smallint not null references public.sites (id) on delete restrict,
  primary key (job_id, site_id)
);

-- Derive status server-side and overwrite any values supplied by a client.
-- Expiry remains hardcoded at 60 days until platform_config lands in slice 1.8.
create function public.derive_job_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  company_verification_status public.company_verification;
begin
  select company.verification_status
  into company_verification_status
  from public.companies as company
  where company.id = new.company_id;

  if company_verification_status = 'verified' then
    new.status := 'active';
    new.published_at := pg_catalog.now();
    new.expires_at := pg_catalog.now() + interval '60 days';
  else
    new.status := 'pending_review';
    new.published_at := null;
    new.expires_at := null;
  end if;

  return new;
end;
$$;

create trigger jobs_derive_status
before insert on public.jobs
for each row
execute function public.derive_job_status();

-- The only job_sites writer: partner origin produces origin + Jooblie rows;
-- Jooblie origin produces one row because the second insert is skipped.
create function public.populate_job_sites()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.job_sites (job_id, site_id)
  values (new.id, new.origin_site_id);

  if new.origin_site_id <> public.jooblie_site_id() then
    insert into public.job_sites (job_id, site_id)
    values (new.id, public.jooblie_site_id());
  end if;

  return new;
end;
$$;

create trigger jobs_populate_job_sites
after insert on public.jobs
for each row
execute function public.populate_job_sites();

-- Actor authorization belongs to RLS and future lifecycle RPCs. This trigger
-- validates only the legal graph and therefore applies equally to every caller.
-- JB007 is the project SQLSTATE for an illegal jobs lifecycle transition.
create function public.validate_job_status_transition()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not (
    (old.status = 'pending_review' and new.status in ('active', 'removed'))
    or (old.status = 'active' and new.status in ('closed', 'expired', 'removed'))
    or (old.status = 'closed' and new.status = 'active')
    or (old.status = 'expired' and new.status = 'active')
    or (old.status = 'removed' and new.status = 'active')
  ) then
    raise exception 'illegal job status transition: % -> %', old.status, new.status
      using errcode = 'JB007';
  end if;

  return new;
end;
$$;

create trigger jobs_validate_status_transition
before update on public.jobs
for each row
when (old.status is distinct from new.status)
execute function public.validate_job_status_transition();

create trigger jobs_set_updated_at
before update on public.jobs
for each row
execute function public.set_updated_at();

-- Public listing, recruiter dashboard and FTS indexes. Expiry scan indexing is
-- deferred to slice 1.8 with the cron implementation.
create index idx_jobs_public
  on public.jobs (published_at desc)
  where status = 'active' and deleted_at is null;

create index idx_jobs_company_created
  on public.jobs (company_id, created_at desc);

create index idx_jobs_category
  on public.jobs (category_id);

create index idx_jobs_origin_site
  on public.jobs (origin_site_id);

create index idx_jobs_created_by
  on public.jobs (created_by);

create index idx_jobs_search
  on public.jobs using gin (search_vector);

create index idx_jobs_skills
  on public.jobs using gin (skills);

create index idx_job_sites_site
  on public.job_sites (site_id, job_id);

alter table public.jobs enable row level security;
alter table public.job_sites enable row level security;

-- Column grants bound client writes to job content. Lifecycle, ownership,
-- provenance, soft-delete and generated/audit columns have no client grant.
revoke insert, update, delete on table public.jobs from anon, authenticated;

grant select on table public.jobs to anon, authenticated;

grant insert (
  company_id,
  origin_site_id,
  title,
  description,
  category_id,
  province,
  city,
  is_remote,
  salary_min,
  salary_max,
  salary_currency,
  salary_period,
  employment_type,
  skills
) on table public.jobs to authenticated;

grant update (
  title,
  description,
  category_id,
  province,
  city,
  is_remote,
  salary_min,
  salary_max,
  salary_currency,
  salary_period,
  employment_type,
  skills
) on table public.jobs to authenticated;

-- Clients may read visibility rows but may never mutate the junction.
revoke insert, update, delete on table public.job_sites from anon, authenticated;
grant select on table public.job_sites to anon, authenticated;

-- Public-active is intentionally repeated inline at each public read boundary.
create policy jobs_anon_select
on public.jobs
for select
to anon
using (
  status = 'active'
  and deleted_at is null
  and not public.company_is_suspended(company_id)
);

-- Slice 0007 exposes only the public-active seeker branch. Applied and saved
-- branches land in 0008 once their backing tables exist.
create policy jobs_job_seeker_select
on public.jobs
for select
to authenticated
using (
  status = 'active'
  and deleted_at is null
  and not public.company_is_suspended(company_id)
);

create policy jobs_recruiter_select
on public.jobs
for select
to authenticated
using (
  public.is_recruiter()
  and public.is_company_member(company_id)
);

create policy jobs_admin_select
on public.jobs
for select
to authenticated
using (public.is_admin());

create policy jobs_recruiter_insert
on public.jobs
for insert
to authenticated
with check (
  public.is_recruiter()
  and public.is_company_member(company_id)
  and not public.is_suspended()
  and created_by = auth.uid()
);

create policy jobs_recruiter_update
on public.jobs
for update
to authenticated
using (
  public.is_recruiter()
  and public.is_company_member(company_id)
  and not public.is_suspended()
  and deleted_at is null
)
with check (public.is_company_member(company_id));

create policy job_sites_anon_select
on public.job_sites
for select
to anon
using (true);

create policy job_sites_authenticated_select
on public.job_sites
for select
to authenticated
using (true);

-- Preserve the 0006 verification RPC signature and behavior, adding only the
-- pending-job activation required when a company becomes verified.
create or replace function public.admin_set_company_verification(
  _company_id uuid,
  _status public.company_verification,
  _reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if not public.is_admin() then
    raise exception 'only admins may set company verification status'
      using errcode = '42501';
  end if;

  if _status = 'rejected' and coalesce(pg_catalog.btrim(_reason), '') = '' then
    raise exception 'a rejection requires a reason'
      using errcode = '23514';
  end if;

  update public.companies
  set verification_status = _status,
      rejection_reason = case when _status = 'rejected' then _reason else null end,
      verified_at = case when _status = 'verified' then pg_catalog.now() else null end,
      verified_by = case when _status = 'verified' then auth.uid() else null end
  where id = _company_id
    and deleted_at is null;

  get diagnostics affected_rows = row_count;

  if affected_rows = 0 then
    raise exception 'company % not found', _company_id
      using errcode = 'P0002';
  end if;

  if _status = 'verified' then
    update public.jobs
    set status = 'active',
        published_at = pg_catalog.now(),
        expires_at = pg_catalog.now() + interval '60 days'
    where company_id = _company_id
      and status = 'pending_review'
      and deleted_at is null;
  end if;
end;
$$;
