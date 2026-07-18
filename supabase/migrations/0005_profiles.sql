-- Phase 1.3 — Identity (SystemDesign §3).
--
-- profiles is 1:1 with auth.users and is created ONLY by the
-- on_auth_user_created trigger. There is no client INSERT policy and no other
-- write path, which closes legacy remediation #7 (dual profile-creation) and
-- #3 (anon-readable profiles).
--
-- Dependency note: signup_site_id falls back to Jooblie (id = 1), so the
-- signup trigger requires the sites rows seeded by migration 0014 (slice 1.9).
-- Until 0014 lands, an auth signup raises a foreign-key violation; no frontend
-- signs up before 1.9, and supabase/tests/phase_1_3_identity.sql seeds the
-- sites rows it needs inside its own rolled-back transaction.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'job_seeker',
  status public.user_status not null default 'active',
  email text not null,
  full_name text,
  phone text,
  headline text,
  location_province text,
  location_city text,
  skills text[] default '{}',
  default_resume_path text,
  signup_site_id smallint not null references public.sites (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx
  on public.profiles (role);

create index profiles_signup_site_id_idx
  on public.profiles (signup_site_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Signup trigger — the single profile-creation path.
--
-- role: strict whitelist. Only 'job_seeker' and 'recruiter' are accepted from
-- signup metadata. 'admin', any other value, a non-text value, and missing
-- metadata all collapse to 'job_seeker'. Admin is never settable at signup.
--
-- signup_site_id: the metadata site slug is validated against public.sites;
-- an unknown or missing slug falls back to Jooblie (id = 1).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text;
  resolved_role public.user_role;
  resolved_site_id smallint;
begin
  requested_role := new.raw_user_meta_data ->> 'role';

  if requested_role in ('job_seeker', 'recruiter') then
    resolved_role := requested_role::public.user_role;
  else
    resolved_role := 'job_seeker';
  end if;

  select site.id
  into resolved_site_id
  from public.sites as site
  where site.slug = new.raw_user_meta_data ->> 'site';

  insert into public.profiles (id, role, email, signup_site_id)
  values (
    new.id,
    resolved_role,
    new.email,
    coalesce(resolved_site_id, 1)
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Email-sync trigger: auth.users is the source of truth for email; profiles
-- mirrors it. Clients never write profiles.email (no column grant below).
create function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;

  return new;
end;
$$;

create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (new.email is distinct from old.email)
execute function public.sync_profile_email();

alter table public.profiles enable row level security;

-- Column grants are defence in depth (SystemDesign §3.3): RLS decides which
-- rows a client reaches, grants decide which columns it may write. anon gets
-- no privilege of any kind on profiles (remediation #3).
--
-- role, status, email, and signup_site_id are deliberately absent from the
-- GRANT list and are therefore not client-updatable by any role, admin
-- included -- see the DEFERRED note on profiles_admin_update below.
revoke update on table public.profiles from anon, authenticated;

grant select on table public.profiles to authenticated;

grant update (
  full_name,
  phone,
  headline,
  location_province,
  location_city,
  skills,
  default_resume_path
) on table public.profiles to authenticated;

-- RLS: one policy per (table, role, operation), no catch-alls (SystemDesign
-- §6.1). Own-row policies carry the role predicate so the job_seeker and
-- recruiter policies stay disjoint rather than overlapping.
--
-- No INSERT policy exists by design (the trigger is the only writer) and no
-- DELETE policy exists (account deletion is the Edge Function path, §8).
create policy profiles_job_seeker_select
on public.profiles
for select
to authenticated
using (auth.uid() = id and role = 'job_seeker');

create policy profiles_recruiter_select
on public.profiles
for select
to authenticated
using (auth.uid() = id and role = 'recruiter');

create policy profiles_admin_select
on public.profiles
for select
to authenticated
using (public.is_admin());

create policy profiles_job_seeker_update
on public.profiles
for update
to authenticated
using (auth.uid() = id and role = 'job_seeker')
with check (auth.uid() = id and role = 'job_seeker');

create policy profiles_recruiter_update
on public.profiles
for update
to authenticated
using (auth.uid() = id and role = 'recruiter')
with check (auth.uid() = id and role = 'recruiter');

-- DEFERRED (admin/moderation slice, Phases 4.5): this policy gives admin the
-- row scope for profile writes, but the column grant above withholds `status`,
-- so admin suspensions are not reachable from a client today. Granting
-- UPDATE(status) to `authenticated` is not an option -- grants are role-wide,
-- so it would also let a job_seeker clear their own suspension through
-- profiles_job_seeker_update. The admin status-write path must therefore be a
-- SECURITY DEFINER function or a service-role Edge Function, designed in the
-- slice that builds moderation.
create policy profiles_admin_update
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- DEFERRED (slice 1.6): recruiters must additionally SELECT the profiles of
-- applicants who applied to their company's jobs, via an EXISTS join over
-- applications + company_members (SystemDesign §5 remediation #3). Both tables
-- land in later slices (1.4 company_members, 1.6 applications), so the
-- profiles_recruiter_select_applicant policy is created in 0008 rather than
-- here. No placeholder tables are created for it.
