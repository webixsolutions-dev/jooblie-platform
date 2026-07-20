-- Phase 1.4 — Companies (SystemDesign §4).
--
-- Two tables, three triggers, one admin RPC.
--
-- Write-path summary (the security contract of this slice):
--   * companies rows are created by recruiters, but every verification column
--     is withheld from client grants -- see admin_set_company_verification().
--   * company_members rows are created ONLY by the owner trigger. No client
--     INSERT/UPDATE/DELETE policy or grant exists on that table in v1.
--   * anon reads a column-restricted subset of verified companies only.

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text not null,
  registration_number text not null,
  verification_document_path text,
  logo_path text,
  description text,
  verification_status public.company_verification not null default 'pending',
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid references public.profiles (id),
  status public.company_status not null default 'active',
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- A rejection must always carry a reason (SystemDesign §4.4).
  constraint companies_rejection_reason_check
    check (verification_status <> 'rejected' or rejection_reason is not null)
);

-- Duplicate company names blocked case-insensitively, but only among live
-- rows: a soft-deleted name becomes reusable (legacy gap #2).
create unique index companies_lower_name_live_idx
  on public.companies (lower(name))
  where deleted_at is null;

-- Admin verification queue: partial index, pending rows only.
create index companies_pending_verification_idx
  on public.companies (verification_status)
  where verification_status = 'pending';

create index companies_created_by_idx
  on public.companies (created_by);

create table public.company_members (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  role public.company_member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

-- Reverse lookup: is_company_member() drives most company RLS, so user_id is
-- the hot path.
create index company_members_user_id_idx
  on public.company_members (user_id);

create trigger companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

-- Helper: mirrors public.is_admin() from 0003 for the recruiter role.
--
-- NOTE for review: 0003 was described as defining the complete approved helper
-- set. This one is added here because the companies INSERT policy needs a
-- caller-role check, and doing it as an inline EXISTS against public.profiles
-- inside a policy is exactly the cross-table pattern SystemDesign §6.2 says
-- must go through a SECURITY DEFINER helper to avoid recursive RLS.
create function public.is_recruiter()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1
    from public.profiles as profile
    where profile.id = auth.uid()
      and profile.role = 'recruiter'
  );
end;
$$;

-- Owner trigger: the creator becomes the company's owner. This is the only
-- path that writes company_members in v1.
create function public.handle_new_company()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.company_members (company_id, user_id, role)
  values (new.id, new.created_by, 'owner');

  return new;
end;
$$;

create trigger on_company_created
after insert on public.companies
for each row
execute function public.handle_new_company();

-- Resubmit trigger: a rejected company whose owner edits any
-- verification-material column returns to the pending queue and its stale
-- rejection reason is cleared.
--
-- Only the columns an admin actually assesses count as a resubmission;
-- cosmetic edits (logo_path, description) deliberately do not re-open review.
--
-- This trigger writes verification_status and rejection_reason, neither of
-- which is client-updatable. That is intentional and it works: Postgres checks
-- column privileges against the statement's SET list, not against the final
-- tuple, so a BEFORE trigger may set columns the caller cannot.
--
-- DEFERRED (slice 1.7): the activity_log('company.resubmitted') entry, once
-- activity_log exists.
create function public.handle_company_resubmit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.verification_status = 'rejected'
     and (
       new.name is distinct from old.name
       or new.website is distinct from old.website
       or new.registration_number is distinct from old.registration_number
       or new.verification_document_path is distinct from old.verification_document_path
     )
  then
    new.verification_status := 'pending';
    new.rejection_reason := null;
  end if;

  return new;
end;
$$;

create trigger on_company_resubmit
before update on public.companies
for each row
execute function public.handle_company_resubmit();

-- Admin verification RPC — the ONLY write path for verification_status,
-- status, verified_at and verified_by.
--
-- Rationale (this is the companies analogue of the profiles.status problem):
-- column grants are Postgres-role-wide while RLS is row-wide, and admins
-- authenticate as the same `authenticated` role as recruiters. Granting
-- UPDATE(verification_status) would therefore also let a recruiter verify
-- their OWN company through companies_recruiter_update -- and since a verified
-- company auto-activates its pending jobs (slice 1.5), self-verification would
-- unlock job posting entirely. Withholding the grant and routing admin writes
-- through this definer function makes that escalation impossible by absence of
-- privilege rather than by trigger logic.
--
-- DEFERRED (slice 1.5): on transition to 'verified' this function must also
-- flip the company's 'pending_review' jobs to 'active' and stamp their
-- published_at / expires_at (SystemDesign §4.4). The jobs table does not exist
-- until migration 0007, so that block lands there via CREATE OR REPLACE of
-- this function -- a roll-forward migration, not an edit to this file (R1.3).
-- DEFERRED (slice 1.7): activity_log('company.verified') + owner notification.
create function public.admin_set_company_verification(
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
end;
$$;

revoke all on function public.admin_set_company_verification(uuid, public.company_verification, text) from public;
grant execute on function public.admin_set_company_verification(uuid, public.company_verification, text) to authenticated;

-- Admin moderation RPC — the ONLY write path for companies.status, for the
-- same reason as above: a recruiter holding UPDATE(status) could un-suspend
-- their own company.
--
-- DEFERRED (slice 1.7): activity_log entry for the suspension/reinstatement.
create function public.admin_set_company_status(
  _company_id uuid,
  _status public.company_status
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
    raise exception 'only admins may set company status'
      using errcode = '42501';
  end if;

  update public.companies
  set status = _status
  where id = _company_id
    and deleted_at is null;

  get diagnostics affected_rows = row_count;

  if affected_rows = 0 then
    raise exception 'company % not found', _company_id
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_set_company_status(uuid, public.company_status) from public;
grant execute on function public.admin_set_company_status(uuid, public.company_status) to authenticated;

alter table public.companies enable row level security;
alter table public.company_members enable row level security;

-- Column grants (SystemDesign §3.3 discipline, applied to companies).
--
-- anon gets a column-restricted SELECT: public company pages must not expose
-- registration_number, verification_document_path (a path into the private
-- verification-docs bucket), rejection_reason, or the created_by/verified_by
-- profile UUIDs.
grant select (
  id,
  name,
  website,
  logo_path,
  description,
  created_at
) on table public.companies to anon;

-- authenticated keeps a full-table SELECT grant because members must read
-- registration_number and verification_document_path on their own company,
-- and column grants cannot distinguish member from non-member. Rows are still
-- filtered by RLS. Residual gap flagged for review: a logged-in non-member can
-- read those columns on a publicly-visible company; closing that needs a
-- separate public view rather than a grant.
grant select on table public.companies to authenticated;

-- INSERT is column-scoped so a recruiter cannot create a company that is
-- already verified/active: verification_status, status, verified_at,
-- verified_by and deleted_at simply cannot appear in the INSERT column list,
-- so their defaults always apply.
grant insert (
  name,
  website,
  registration_number,
  verification_document_path,
  logo_path,
  description,
  created_by
) on table public.companies to authenticated;

revoke update on table public.companies from anon, authenticated;

grant update (
  name,
  website,
  registration_number,
  verification_document_path,
  logo_path,
  description
) on table public.companies to authenticated;

-- company_members is read-only to clients; the owner trigger is the only
-- writer in v1. anon gets nothing.
grant select on table public.company_members to authenticated;

-- RLS: one policy per (table, role, operation), no catch-alls.
--
-- companies_public_select follows the 0004 `{table}_public_select` precedent
-- for a read that is identical for anon and every authenticated role.
create policy companies_public_select
on public.companies
for select
to anon, authenticated
using (
  verification_status = 'verified'
  and status = 'active'
  and deleted_at is null
);

create policy companies_recruiter_select
on public.companies
for select
to authenticated
using (public.is_company_member(id));

create policy companies_admin_select
on public.companies
for select
to authenticated
using (public.is_admin());

-- is_suspended() covers both 'suspended' and 'deleted' profiles (0003), so a
-- suspended or deleted recruiter cannot stand up a new company (SystemDesign
-- §8: all write helpers block for those statuses).
create policy companies_recruiter_insert
on public.companies
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.is_recruiter()
  and not public.is_suspended()
);

create policy companies_recruiter_update
on public.companies
for update
to authenticated
using (public.is_company_member(id) and deleted_at is null)
with check (public.is_company_member(id) and deleted_at is null);

-- No companies_admin_update policy exists by design: admin verification runs
-- through admin_set_company_verification(). No DELETE policy exists for any
-- role -- company close / soft-delete is not part of this slice.

create policy company_members_recruiter_select
on public.company_members
for select
to authenticated
using (public.is_company_member(company_id));

create policy company_members_admin_select
on public.company_members
for select
to authenticated
using (public.is_admin());

-- No INSERT/UPDATE/DELETE policy on company_members by design: the
-- on_company_created trigger is the only writer in v1. Join-existing-company
-- and ownership transfer are v2 (SystemDesign §11).
