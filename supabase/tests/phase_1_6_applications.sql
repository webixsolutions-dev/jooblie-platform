\set ON_ERROR_STOP on

-- Phase 1.6 mutation-proof targets:
--   MA removing the seeker terminal-state guard permits hired -> withdrawn;
--   MB removing the recruiter withdrawn guard permits recruiter withdrawal;
--   MC removing has_applied() hides an expired applied job from its applicant;
--   MD removing can_recruiter_view_applicant() leaks profiles to a non-member.

\echo 'Asserting Phase 1.6 schema, grants, triggers, helpers, and RLS inventory'

do $$
declare
  actual_policies text[];
  actual_triggers text[];
  expected_function text;
begin
  if pg_catalog.to_regclass('public.applications') is null
     or pg_catalog.to_regclass('public.saved_jobs') is null
     or pg_catalog.to_regclass('public.job_views') is null then
    raise exception 'one or more Phase 1.6 tables are missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.applications'::pg_catalog.regclass
      and constraint_definition.conname = 'applications_unique_job_applicant'
      and constraint_definition.contype = 'u'
  ) then
    raise exception 'applications_unique_job_applicant is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.applications'::pg_catalog.regclass
      and constraint_definition.conname = 'applications_applicant_id_fkey'
      and constraint_definition.confdeltype = 'a'
  ) then
    raise exception 'applications.applicant_id must use ON DELETE NO ACTION';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_indexes as index_definition
    where index_definition.schemaname = 'public'
      and index_definition.tablename = 'job_views'
      and index_definition.indexname = 'job_views_authenticated_daily_unique_idx'
      and index_definition.indexdef like 'CREATE UNIQUE INDEX%'
      and index_definition.indexdef like '%(job_id, viewer_id, viewed_on)%'
      and index_definition.indexdef like '%WHERE (viewer_id IS NOT NULL)%'
  ) then
    raise exception 'authenticated daily job-view partial unique index is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_indexes as index_definition
    where index_definition.schemaname = 'public'
      and index_definition.tablename = 'applications'
      and index_definition.indexname = 'applications_applicant_created_idx'
      and index_definition.indexdef like '%(applicant_id, created_at DESC)%'
  ) then
    raise exception 'applications rolling-rate support index is missing';
  end if;

  select array_agg(trigger_definition.tgname order by trigger_definition.tgname)
  into actual_triggers
  from pg_catalog.pg_trigger as trigger_definition
  where trigger_definition.tgrelid = 'public.applications'::pg_catalog.regclass
    and not trigger_definition.tgisinternal;

  if actual_triggers is distinct from array[
    'applications_enforce_resume_immutability',
    'applications_log_status_changed',
    'applications_log_submitted',
    'applications_notify_new_applicant',
    'applications_notify_status_changed',
    'applications_set_updated_at',
    'applications_validate_status_transition'
  ]::text[] then
    raise exception 'applications trigger inventory mismatch: %', actual_triggers;
  end if;

  foreach expected_function in array array[
    'public.is_company_member_for_job(uuid)',
    'public.job_accepts_applications(uuid)',
    'public.has_applied(uuid)',
    'public.has_saved(uuid)',
    'public.can_recruiter_view_applicant(uuid)'
  ]
  loop
    if not exists (
      select 1
      from pg_catalog.pg_proc as function_definition
      where function_definition.oid = expected_function::pg_catalog.regprocedure
        and function_definition.provolatile = 's'
        and function_definition.prosecdef
        and function_definition.proconfig = array['search_path=""']
    ) then
      raise exception '% must be STABLE SECURITY DEFINER with empty search_path',
        expected_function;
    end if;
  end loop;

  select array_agg(policy.policyname order by policy.policyname)
  into actual_policies
  from pg_catalog.pg_policies as policy
  where policy.schemaname = 'public'
    and policy.tablename = 'applications';

  if actual_policies is distinct from array[
    'applications_admin_select',
    'applications_job_seeker_insert',
    'applications_job_seeker_select',
    'applications_job_seeker_update',
    'applications_recruiter_select',
    'applications_recruiter_update'
  ]::text[] then
    raise exception 'applications policy inventory mismatch: %', actual_policies;
  end if;

  select array_agg(policy.policyname order by policy.policyname)
  into actual_policies
  from pg_catalog.pg_policies as policy
  where policy.schemaname = 'public'
    and policy.tablename = 'saved_jobs';

  if actual_policies is distinct from array[
    'saved_jobs_job_seeker_delete',
    'saved_jobs_job_seeker_insert',
    'saved_jobs_job_seeker_select'
  ]::text[] then
    raise exception 'saved_jobs policy inventory mismatch: %', actual_policies;
  end if;

  select array_agg(policy.policyname order by policy.policyname)
  into actual_policies
  from pg_catalog.pg_policies as policy
  where policy.schemaname = 'public'
    and policy.tablename = 'job_views';

  if actual_policies is distinct from array[
    'job_views_admin_select',
    'job_views_anon_insert',
    'job_views_authenticated_insert',
    'job_views_recruiter_select'
  ]::text[] then
    raise exception 'job_views policy inventory mismatch: %', actual_policies;
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'public'
      and policy.tablename = 'jobs'
      and policy.policyname = 'jobs_job_seeker_select'
      and policy.qual like '%has_saved(id)%'
  ) then
    raise exception 'jobs_job_seeker_select replacement is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'public'
      and policy.tablename = 'profiles'
      and policy.policyname = 'profiles_recruiter_select_applicant'
      and policy.qual like '%status <> %deleted%'
  ) then
    raise exception 'profiles recruiter-applicant boundary is missing';
  end if;

  if pg_catalog.has_column_privilege(
       'authenticated', 'public.applications', 'applicant_id', 'INSERT'
     )
     or pg_catalog.has_column_privilege(
       'authenticated', 'public.applications', 'status', 'INSERT'
     ) then
    raise exception 'authenticated can spoof applicant_id or initial status';
  end if;

  if not pg_catalog.has_column_privilege(
       'authenticated', 'public.applications', 'status', 'UPDATE'
     )
     or pg_catalog.has_column_privilege(
       'authenticated', 'public.applications', 'resume_path', 'UPDATE'
     )
     or pg_catalog.has_column_privilege(
       'authenticated', 'public.applications', 'status_updated_at', 'UPDATE'
     ) then
    raise exception 'applications UPDATE column grants are not status-only';
  end if;

  if pg_catalog.has_table_privilege('anon', 'public.applications', 'SELECT')
     or pg_catalog.has_table_privilege('anon', 'public.job_views', 'SELECT') then
    raise exception 'anon unexpectedly holds a private-table SELECT grant';
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from public.applications)
     or exists (select 1 from public.saved_jobs)
     or exists (select 1 from public.job_views) then
    raise exception 'Phase 1.6 migrations must not seed operational data';
  end if;
end;
$$;

\echo 'Creating rolled-back Phase 1.6 fixtures'

begin;

insert into public.sectors (id, slug, name, sort_order)
values (1, 'technology', 'Technology', 1);

insert into public.categories (id, sector_id, slug, name, sort_order)
values (1, 1, 'software', 'Software', 1);

insert into public.sites (id, slug, name, domain, site_type, sector_id)
values
  (1, 'jooblie', 'Jooblie', 'jooblie.phase16.test', 'aggregator', null),
  (2, 'tech-jobs', 'Tech Jobs', 'tech.phase16.test', 'sector', 1);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('16000000-0000-4000-8000-000000000001', 'applicant@phase16.test',
   jsonb_build_object('role', 'job_seeker')),
  ('16000000-0000-4000-8000-000000000002', 'other-seeker@phase16.test',
   jsonb_build_object('role', 'job_seeker')),
  ('16000000-0000-4000-8000-000000000003', 'recruiter-a@phase16.test',
   jsonb_build_object('role', 'recruiter')),
  ('16000000-0000-4000-8000-000000000004', 'recruiter-b@phase16.test',
   jsonb_build_object('role', 'recruiter')),
  ('16000000-0000-4000-8000-000000000005', 'admin@phase16.test',
   jsonb_build_object('role', 'job_seeker')),
  ('16000000-0000-4000-8000-000000000006', 'suspended-seeker@phase16.test',
   jsonb_build_object('role', 'job_seeker')),
  ('16000000-0000-4000-8000-000000000007', 'deleted-applicant@phase16.test',
   jsonb_build_object('role', 'job_seeker')),
  ('16000000-0000-4000-8000-000000000008', 'unrelated-recruiter@phase16.test',
   jsonb_build_object('role', 'recruiter'));

update public.profiles
set role = 'admin'
where id = '16000000-0000-4000-8000-000000000005';

update public.profiles
set status = 'suspended'
where id = '16000000-0000-4000-8000-000000000006';

insert into public.companies (
  id, name, website, registration_number, verification_status,
  verified_at, verified_by, status, created_by
)
values
  (
    '26000000-0000-4000-8000-000000000001',
    'Phase 16 Company A',
    'https://a.phase16.test',
    'P16-A',
    'verified',
    pg_catalog.now(),
    '16000000-0000-4000-8000-000000000005',
    'active',
    '16000000-0000-4000-8000-000000000003'
  ),
  (
    '26000000-0000-4000-8000-000000000002',
    'Phase 16 Company B',
    'https://b.phase16.test',
    'P16-B',
    'verified',
    pg_catalog.now(),
    '16000000-0000-4000-8000-000000000005',
    'active',
    '16000000-0000-4000-8000-000000000004'
  ),
  (
    '26000000-0000-4000-8000-000000000003',
    'Phase 16 Suspended Company',
    'https://suspended.phase16.test',
    'P16-SUSPENDED',
    'verified',
    pg_catalog.now(),
    '16000000-0000-4000-8000-000000000005',
    'suspended',
    '16000000-0000-4000-8000-000000000004'
  ),
  (
    '26000000-0000-4000-8000-000000000004',
    'Phase 16 Pending Company',
    'https://pending.phase16.test',
    'P16-PENDING',
    'pending',
    null,
    null,
    'active',
    '16000000-0000-4000-8000-000000000004'
  );

insert into public.jobs (
  id, company_id, origin_site_id, created_by, category_id,
  title, description, employment_type
)
select
  fixture.id,
  fixture.company_id,
  1,
  fixture.created_by,
  1,
  fixture.title,
  'Phase 1.6 test fixture',
  'full_time'
from (
  values
    ('36000000-0000-4000-8000-000000000001'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Client apply job'),
    ('36000000-0000-4000-8000-000000000002'::uuid, '26000000-0000-4000-8000-000000000002'::uuid, '16000000-0000-4000-8000-000000000004'::uuid, 'Company B active job'),
    ('36000000-0000-4000-8000-000000000003'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Applied expired job'),
    ('36000000-0000-4000-8000-000000000004'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Saved closed job'),
    ('36000000-0000-4000-8000-000000000005'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Applied removed job'),
    ('36000000-0000-4000-8000-000000000006'::uuid, '26000000-0000-4000-8000-000000000003'::uuid, '16000000-0000-4000-8000-000000000004'::uuid, 'Saved suspended-company job'),
    ('36000000-0000-4000-8000-000000000007'::uuid, '26000000-0000-4000-8000-000000000004'::uuid, '16000000-0000-4000-8000-000000000004'::uuid, 'Pending application-gate job'),
    ('36000000-0000-4000-8000-000000000008'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Deleted application-gate job'),
    ('36000000-0000-4000-8000-000000000101'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Seeker withdraw legal'),
    ('36000000-0000-4000-8000-000000000102'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Seeker shortlist illegal'),
    ('36000000-0000-4000-8000-000000000103'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Seeker withdrawn terminal'),
    ('36000000-0000-4000-8000-000000000104'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'MA seeker hired terminal'),
    ('36000000-0000-4000-8000-000000000105'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Recruiter forward skip'),
    ('36000000-0000-4000-8000-000000000106'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Recruiter offered hired'),
    ('36000000-0000-4000-8000-000000000107'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Recruiter submitted hired illegal'),
    ('36000000-0000-4000-8000-000000000108'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Recruiter backward illegal'),
    ('36000000-0000-4000-8000-000000000109'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'MB recruiter withdraw illegal'),
    ('36000000-0000-4000-8000-000000000110'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Recruiter reject legal'),
    ('36000000-0000-4000-8000-000000000111'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Recruiter hired terminal'),
    ('36000000-0000-4000-8000-000000000112'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Recruiter rejected terminal'),
    ('36000000-0000-4000-8000-000000000113'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Unrelated recruiter actor branch'),
    ('36000000-0000-4000-8000-000000000114'::uuid, '26000000-0000-4000-8000-000000000002'::uuid, '16000000-0000-4000-8000-000000000004'::uuid, 'Company B application RLS'),
    ('36000000-0000-4000-8000-000000000115'::uuid, '26000000-0000-4000-8000-000000000001'::uuid, '16000000-0000-4000-8000-000000000003'::uuid, 'Deleted applicant profile boundary')
) as fixture(id, company_id, created_by, title);

-- These applications represent records created while the jobs were active;
-- lifecycle changes below make the jobs hidden without removing seeker context.
insert into public.applications (
  id, job_id, applicant_id, resume_path, applied_via_site_id, status,
  status_updated_at
)
values
  ('46000000-0000-4000-8000-000000000003', '36000000-0000-4000-8000-000000000003', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/expired.pdf', 1, 'submitted', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000005', '36000000-0000-4000-8000-000000000005', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/removed.pdf', 1, 'submitted', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000101', '36000000-0000-4000-8000-000000000101', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/101.pdf', 1, 'interviewing', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000102', '36000000-0000-4000-8000-000000000102', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/102.pdf', 1, 'submitted', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000103', '36000000-0000-4000-8000-000000000103', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/103.pdf', 1, 'withdrawn', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000104', '36000000-0000-4000-8000-000000000104', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/104.pdf', 1, 'hired', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000105', '36000000-0000-4000-8000-000000000105', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/105.pdf', 1, 'submitted', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000106', '36000000-0000-4000-8000-000000000106', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/106.pdf', 1, 'offered', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000107', '36000000-0000-4000-8000-000000000107', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/107.pdf', 1, 'submitted', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000108', '36000000-0000-4000-8000-000000000108', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/108.pdf', 1, 'shortlisted', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000109', '36000000-0000-4000-8000-000000000109', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/109.pdf', 1, 'submitted', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000110', '36000000-0000-4000-8000-000000000110', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/110.pdf', 1, 'interviewing', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000111', '36000000-0000-4000-8000-000000000111', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/111.pdf', 1, 'hired', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000112', '36000000-0000-4000-8000-000000000112', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/112.pdf', 1, 'rejected', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000113', '36000000-0000-4000-8000-000000000113', '16000000-0000-4000-8000-000000000001', 'resumes/applicant/113.pdf', 1, 'submitted', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000114', '36000000-0000-4000-8000-000000000114', '16000000-0000-4000-8000-000000000002', 'resumes/other/114.pdf', 1, 'submitted', pg_catalog.now() - interval '1 day'),
  ('46000000-0000-4000-8000-000000000115', '36000000-0000-4000-8000-000000000115', '16000000-0000-4000-8000-000000000007', 'resumes/deleted/115.pdf', 1, 'submitted', pg_catalog.now() - interval '1 day');

insert into public.saved_jobs (user_id, job_id, saved_via_site_id)
values
  ('16000000-0000-4000-8000-000000000001', '36000000-0000-4000-8000-000000000004', 1),
  ('16000000-0000-4000-8000-000000000001', '36000000-0000-4000-8000-000000000006', 1);

update public.profiles
set status = 'deleted'
where id = '16000000-0000-4000-8000-000000000007';

update public.jobs set status = 'expired'
where id = '36000000-0000-4000-8000-000000000003';

update public.jobs set status = 'closed'
where id = '36000000-0000-4000-8000-000000000004';

update public.jobs set status = 'removed'
where id = '36000000-0000-4000-8000-000000000005';

update public.jobs set deleted_at = pg_catalog.now()
where id = '36000000-0000-4000-8000-000000000008';

-- Rolled-back SECURITY DEFINER probes let authenticated callers exercise the
-- trigger's defence-in-depth branches that normal grants/RLS block first.
create function public.phase_1_6_test_set_application_status(
  _application_id uuid,
  _status public.application_status
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.applications
  set status = _status
  where id = _application_id;
$$;

create function public.phase_1_6_test_set_application_resume(
  _application_id uuid,
  _resume_path text
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.applications
  set resume_path = _resume_path
  where id = _application_id;
$$;

revoke all on function public.phase_1_6_test_set_application_status(
  uuid, public.application_status
) from public;
revoke all on function public.phase_1_6_test_set_application_resume(uuid, text) from public;
grant execute on function public.phase_1_6_test_set_application_status(
  uuid, public.application_status
) to authenticated;
grant execute on function public.phase_1_6_test_set_application_resume(uuid, text)
  to authenticated;

\echo 'Asserting application insert defaults, spoof protection, duplicate block, and resume immutability'

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

insert into public.applications (
  job_id, resume_path, cover_letter, applied_via_site_id
)
values (
  '36000000-0000-4000-8000-000000000001',
  'resumes/applicant/client-apply.pdf',
  'Client-created application',
  1
);

do $$
declare
  duplicate_constraint text;
begin
  if not exists (
    select 1
    from public.applications
    where job_id = '36000000-0000-4000-8000-000000000001'
      and applicant_id = '16000000-0000-4000-8000-000000000001'
      and status = 'submitted'
      and status_updated_at is not null
  ) then
    raise exception 'client application defaults/applicant identity are incorrect';
  end if;

  begin
    insert into public.applications (
      job_id, applicant_id, resume_path, applied_via_site_id
    ) values (
      '36000000-0000-4000-8000-000000000002',
      '16000000-0000-4000-8000-000000000002',
      'resumes/spoofed.pdf',
      1
    );
    raise exception 'applicant_id spoof unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.applications (
      job_id, resume_path, applied_via_site_id
    ) values (
      '36000000-0000-4000-8000-000000000001',
      'resumes/applicant/duplicate.pdf',
      1
    );
    raise exception 'duplicate application unexpectedly succeeded';
  exception
    when unique_violation then
      get stacked diagnostics duplicate_constraint = constraint_name;
  end;

  if duplicate_constraint is distinct from 'applications_unique_job_applicant' then
    raise exception 'duplicate apply hit wrong constraint: %', duplicate_constraint;
  end if;

  begin
    update public.applications
    set resume_path = 'resumes/applicant/client-overwrite.pdf'
    where job_id = '36000000-0000-4000-8000-000000000001';
    raise exception 'client UPDATE(resume_path) unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.phase_1_6_test_set_application_resume(
      (
        select id
        from public.applications
        where job_id = '36000000-0000-4000-8000-000000000001'
      ),
      'resumes/applicant/definer-overwrite.pdf'
    );
    raise exception 'resume immutability definer path unexpectedly succeeded';
  exception
    when sqlstate 'JB008' then null;
  end;
end;
$$;

reset role;

\echo 'Exercising seeker application transitions as the applicant'

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
begin
  update public.applications
  set status = 'withdrawn'
  where id = '46000000-0000-4000-8000-000000000101';

  if not exists (
    select 1
    from public.applications
    where id = '46000000-0000-4000-8000-000000000101'
      and status = 'withdrawn'
      and status_updated_at > pg_catalog.now() - interval '1 hour'
  ) then
    raise exception 'seeker legal withdrawal or status_updated_at stamp failed';
  end if;

  begin
    update public.applications
    set status = 'shortlisted'
    where id = '46000000-0000-4000-8000-000000000102';
    raise exception 'seeker -> shortlisted unexpectedly succeeded';
  exception
    when sqlstate 'JB008' then null;
  end;

  begin
    update public.applications
    set status = 'shortlisted'
    where id = '46000000-0000-4000-8000-000000000103';
    raise exception 'withdrawn terminal application unexpectedly transitioned';
  exception
    when sqlstate 'JB008' then null;
  end;

  begin
    update public.applications
    set status = 'withdrawn'
    where id = '46000000-0000-4000-8000-000000000104';
    raise exception 'MA hired terminal application unexpectedly withdrew';
  exception
    when sqlstate 'JB008' then null;
  end;
end;
$$;

reset role;

\echo 'Exercising recruiter transitions as the applied-to company member'

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;

do $$
begin
  update public.applications
  set status = 'shortlisted'
  where id = '46000000-0000-4000-8000-000000000105';

  update public.applications
  set status = 'hired'
  where id = '46000000-0000-4000-8000-000000000106';

  update public.applications
  set status = 'rejected'
  where id = '46000000-0000-4000-8000-000000000110';

  if not exists (
    select 1 from public.applications
    where id = '46000000-0000-4000-8000-000000000105'
      and status = 'shortlisted'
  ) or not exists (
    select 1 from public.applications
    where id = '46000000-0000-4000-8000-000000000106'
      and status = 'hired'
  ) or not exists (
    select 1 from public.applications
    where id = '46000000-0000-4000-8000-000000000110'
      and status = 'rejected'
  ) then
    raise exception 'one or more legal recruiter transitions failed';
  end if;

  begin
    update public.applications set status = 'hired'
    where id = '46000000-0000-4000-8000-000000000107';
    raise exception 'submitted -> hired unexpectedly succeeded';
  exception
    when sqlstate 'JB008' then null;
  end;

  begin
    update public.applications set status = 'viewed'
    where id = '46000000-0000-4000-8000-000000000108';
    raise exception 'shortlisted -> viewed unexpectedly succeeded';
  exception
    when sqlstate 'JB008' then null;
  end;

  begin
    update public.applications set status = 'withdrawn'
    where id = '46000000-0000-4000-8000-000000000109';
    raise exception 'MB recruiter withdrawal unexpectedly succeeded';
  exception
    when sqlstate 'JB008' then null;
  end;

  begin
    update public.applications set status = 'rejected'
    where id = '46000000-0000-4000-8000-000000000111';
    raise exception 'transition out of hired unexpectedly succeeded';
  exception
    when sqlstate 'JB008' then null;
  end;

  begin
    update public.applications set status = 'shortlisted'
    where id = '46000000-0000-4000-8000-000000000112';
    raise exception 'transition out of rejected unexpectedly succeeded';
  exception
    when sqlstate 'JB008' then null;
  end;
end;
$$;

reset role;

\echo 'Asserting unrelated recruiter RLS and trigger actor branches'

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000008","role":"authenticated"}';
set local role authenticated;

do $$
declare
  affected_rows integer;
begin
  update public.applications
  set status = 'viewed'
  where id = '46000000-0000-4000-8000-000000000113';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'unrelated recruiter crossed application UPDATE RLS';
  end if;

  begin
    perform public.phase_1_6_test_set_application_status(
      '46000000-0000-4000-8000-000000000113',
      'viewed'
    );
    raise exception 'unrelated recruiter trigger actor branch unexpectedly succeeded';
  exception
    when sqlstate 'JB008' then null;
  end;
end;
$$;

reset role;

\echo 'Asserting applications and applicant-profile read boundaries'

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if (select count(*) from public.applications) <> 16 then
    raise exception 'applicant did not see exactly their 16 applications';
  end if;

  if exists (
    select 1 from public.applications
    where applicant_id <> '16000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'applicant saw another user application';
  end if;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if (select count(*) from public.applications) <> 17 then
    raise exception 'company A recruiter did not see exactly 17 own-company applications';
  end if;

  if exists (
    select 1 from public.applications
    where job_id = '36000000-0000-4000-8000-000000000114'
  ) then
    raise exception 'company A recruiter saw company B application';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = '16000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'applied-to recruiter cannot read applicant profile';
  end if;

  if exists (
    select 1 from public.profiles
    where id = '16000000-0000-4000-8000-000000000007'
  ) then
    raise exception 'recruiter saw deleted applicant profile';
  end if;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000008","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if exists (select 1 from public.applications) then
    raise exception 'unrelated recruiter saw applications';
  end if;

  if exists (
    select 1 from public.profiles
    where id = '16000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'MD unrelated recruiter saw applicant profile';
  end if;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000005","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if (select count(*) from public.applications) <> 18 then
    raise exception 'admin cannot see all 18 applications';
  end if;
end;
$$;

reset role;

set local request.jwt.claims = '';
set local role anon;

do $$
declare
  visible_rows integer;
begin
  begin
    execute 'select count(*) from public.applications' into visible_rows;
    if visible_rows <> 0 then
      raise exception 'anon saw % applications', visible_rows;
    end if;
  exception
    when insufficient_privilege then null;
  end;

  begin
    execute 'select count(*) from public.profiles' into visible_rows;
    if visible_rows <> 0 then
      raise exception 'anon saw % profiles', visible_rows;
    end if;
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

-- Account-deletion semantics: application survives, profile is invisible to
-- recruiter applicant reads.
set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if not exists (
    select 1 from public.applications
    where id = '46000000-0000-4000-8000-000000000115'
  ) then
    raise exception 'deleted applicant application was not preserved';
  end if;

  if exists (
    select 1 from public.profiles
    where id = '16000000-0000-4000-8000-000000000007'
  ) then
    raise exception 'deleted applicant profile remained recruiter-visible';
  end if;
end;
$$;

reset role;

\echo 'Asserting FIX 1 applied/saved hidden-job visibility'

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if (
    select count(*)
    from public.jobs
    where id in (
      '36000000-0000-4000-8000-000000000003',
      '36000000-0000-4000-8000-000000000004',
      '36000000-0000-4000-8000-000000000005',
      '36000000-0000-4000-8000-000000000006'
    )
  ) <> 4 then
    raise exception 'MC seeker cannot see all applied/saved hidden jobs';
  end if;

  if not exists (
    select 1 from public.jobs
    where id = '36000000-0000-4000-8000-000000000003'
      and status = 'expired'
  ) or not exists (
    select 1 from public.jobs
    where id = '36000000-0000-4000-8000-000000000004'
      and status = 'closed'
  ) or not exists (
    select 1 from public.jobs
    where id = '36000000-0000-4000-8000-000000000005'
      and status = 'removed'
  ) or not exists (
    select 1 from public.jobs
    where id = '36000000-0000-4000-8000-000000000006'
  ) then
    raise exception 'FIX 1 did not preserve each required hidden lifecycle case';
  end if;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if exists (
    select 1
    from public.jobs
    where id in (
      '36000000-0000-4000-8000-000000000003',
      '36000000-0000-4000-8000-000000000004',
      '36000000-0000-4000-8000-000000000005',
      '36000000-0000-4000-8000-000000000006'
    )
  ) then
    raise exception 'non-applied/non-saved seeker saw a hidden job';
  end if;
end;
$$;

reset role;

\echo 'Asserting saved_jobs owner-only reads and deletes'

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;

do $$
declare
  affected_rows integer;
begin
  if exists (select 1 from public.saved_jobs) then
    raise exception 'other seeker read another user saved_jobs';
  end if;

  delete from public.saved_jobs
  where job_id = '36000000-0000-4000-8000-000000000004';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'other seeker deleted another user saved_job';
  end if;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if (select count(*) from public.saved_jobs) <> 2 then
    raise exception 'saved_jobs owner cannot read both saved rows';
  end if;
end;
$$;

reset role;

\echo 'Asserting job_views spoof guards, dedupe, and read boundaries'

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

insert into public.job_views (job_id, viewer_id, site_id)
values (
  '36000000-0000-4000-8000-000000000001',
  '16000000-0000-4000-8000-000000000001',
  1
);

do $$
declare
  duplicate_constraint text;
begin
  begin
    insert into public.job_views (job_id, viewer_id, site_id)
    values (
      '36000000-0000-4000-8000-000000000001',
      '16000000-0000-4000-8000-000000000002',
      1
    );
    raise exception 'authenticated job-view viewer spoof unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.job_views (job_id, viewer_id, site_id)
    values (
      '36000000-0000-4000-8000-000000000001',
      '16000000-0000-4000-8000-000000000001',
      1
    );
    raise exception 'same-day authenticated duplicate view unexpectedly succeeded';
  exception
    when unique_violation then
      get stacked diagnostics duplicate_constraint = constraint_name;
  end;

  if duplicate_constraint is distinct from 'job_views_authenticated_daily_unique_idx' then
    raise exception 'job-view duplicate hit wrong constraint: %', duplicate_constraint;
  end if;

  if exists (select 1 from public.job_views) then
    raise exception 'job seeker SELECT unexpectedly saw job_views';
  end if;
end;
$$;

reset role;

set local request.jwt.claims = '';
set local role anon;

do $$
declare
  visible_rows integer;
begin
  begin
    insert into public.job_views (job_id, viewer_id, site_id)
    values (
      '36000000-0000-4000-8000-000000000001',
      '16000000-0000-4000-8000-000000000001',
      1
    );
    raise exception 'anon non-null viewer_id spoof unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  insert into public.job_views (job_id, viewer_id, site_id)
  values ('36000000-0000-4000-8000-000000000001', null, 1);

  begin
    execute 'select count(*) from public.job_views' into visible_rows;
    if visible_rows <> 0 then
      raise exception 'anon saw % job_views', visible_rows;
    end if;
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if (
    select count(*)
    from public.job_views
    where job_id = '36000000-0000-4000-8000-000000000001'
  ) <> 2 then
    raise exception 'own-company recruiter did not see authenticated + anon views';
  end if;
end;
$$;

reset role;

\echo 'Asserting application gates for job and seeker state'

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;

do $$
begin
  begin
    insert into public.applications (job_id, resume_path, applied_via_site_id)
    values (
      '36000000-0000-4000-8000-000000000007',
      'resumes/other/pending.pdf',
      1
    );
    raise exception 'application to pending_review job unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.applications (job_id, resume_path, applied_via_site_id)
    values (
      '36000000-0000-4000-8000-000000000006',
      'resumes/other/suspended-company.pdf',
      1
    );
    raise exception 'application to suspended-company job unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.applications (job_id, resume_path, applied_via_site_id)
    values (
      '36000000-0000-4000-8000-000000000008',
      'resumes/other/deleted-job.pdf',
      1
    );
    raise exception 'application to deleted job unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"16000000-0000-4000-8000-000000000006","role":"authenticated"}';
set local role authenticated;

do $$
begin
  begin
    insert into public.applications (job_id, resume_path, applied_via_site_id)
    values (
      '36000000-0000-4000-8000-000000000002',
      'resumes/suspended/apply.pdf',
      1
    );
    raise exception 'suspended seeker application unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

rollback;

do $$
begin
  if exists (select 1 from public.applications)
     or exists (select 1 from public.saved_jobs)
     or exists (select 1 from public.job_views)
     or pg_catalog.to_regprocedure(
       'public.phase_1_6_test_set_application_status(uuid,public.application_status)'
     ) is not null
     or pg_catalog.to_regprocedure(
       'public.phase_1_6_test_set_application_resume(uuid,text)'
     ) is not null then
    raise exception 'Phase 1.6 test data/helpers leaked outside transaction';
  end if;
end;
$$;

\echo 'Phase 1.6 applications assertions passed'
