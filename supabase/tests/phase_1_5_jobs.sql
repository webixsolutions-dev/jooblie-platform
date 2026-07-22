\set ON_ERROR_STOP on

-- FIX 1 NOTE: seeker branches for own applied/saved jobs land in slice 1.6
-- (migration 0008), after applications and saved_jobs exist. This suite tests
-- only the public-active seeker branch introduced by 0007.
--
-- Mutation-proof targets:
--   M1 removing the partner -> Jooblie visibility branch breaks the 2-row check;
--   M2 granting authenticated UPDATE(status) breaks the protected-write check;
--   M3 removing the transition RAISE breaks an illegal-edge check;
--   M4 adding a job_sites authenticated INSERT policy breaks policy inventory.

\echo 'Asserting Phase 1.5 jobs schema, triggers, indexes, grants, and RLS inventory'

do $$
declare
  actual_policies text[];
  actual_triggers text[];
  expected_index text;
begin
  if pg_catalog.to_regclass('public.jobs') is null then
    raise exception 'public.jobs is missing';
  end if;

  if pg_catalog.to_regclass('public.job_sites') is null then
    raise exception 'public.job_sites is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_class as table_definition
    where table_definition.oid = 'public.jobs'::pg_catalog.regclass
      and table_definition.relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.jobs';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_class as table_definition
    where table_definition.oid = 'public.job_sites'::pg_catalog.regclass
      and table_definition.relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.job_sites';
  end if;

  select array_agg(policy.policyname order by policy.policyname)
  into actual_policies
  from pg_catalog.pg_policies as policy
  where policy.schemaname = 'public'
    and policy.tablename = 'jobs';

  if actual_policies is distinct from array[
    'jobs_admin_select',
    'jobs_anon_select',
    'jobs_job_seeker_select',
    'jobs_recruiter_insert',
    'jobs_recruiter_select',
    'jobs_recruiter_update'
  ]::text[] then
    raise exception 'jobs policy inventory mismatch: %', actual_policies;
  end if;

  select array_agg(policy.policyname order by policy.policyname)
  into actual_policies
  from pg_catalog.pg_policies as policy
  where policy.schemaname = 'public'
    and policy.tablename = 'job_sites';

  if actual_policies is distinct from array[
    'job_sites_anon_select',
    'job_sites_authenticated_select'
  ]::text[] then
    raise exception 'job_sites write surface/policy inventory mismatch: %', actual_policies;
  end if;

  select array_agg(trigger_definition.tgname order by trigger_definition.tgname)
  into actual_triggers
  from pg_catalog.pg_trigger as trigger_definition
  where trigger_definition.tgrelid = 'public.jobs'::pg_catalog.regclass
    and not trigger_definition.tgisinternal;

  if actual_triggers is distinct from array[
    'jobs_derive_status',
    'jobs_log_created',
    'jobs_log_status_changed',
    'jobs_populate_job_sites',
    'jobs_set_updated_at',
    'jobs_validate_status_transition'
  ]::text[] then
    raise exception 'jobs trigger inventory mismatch: %', actual_triggers;
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_attribute as attribute
    where attribute.attrelid = 'public.jobs'::pg_catalog.regclass
      and attribute.attname = 'search_vector'
      and attribute.attgenerated = 's'
      and attribute.atttypid = 'pg_catalog.tsvector'::pg_catalog.regtype
  ) then
    raise exception 'jobs.search_vector must be a stored generated tsvector';
  end if;

  foreach expected_index in array array[
    'idx_jobs_public',
    'idx_jobs_company_created',
    'idx_jobs_category',
    'idx_jobs_origin_site',
    'idx_jobs_created_by',
    'idx_jobs_search',
    'idx_jobs_skills',
    'idx_job_sites_site'
  ]
  loop
    if pg_catalog.to_regclass('public.' || expected_index) is null then
      raise exception 'required index public.% is missing', expected_index;
    end if;
  end loop;

  if not exists (
    select 1
    from pg_catalog.pg_indexes as index_definition
    where index_definition.schemaname = 'public'
      and index_definition.tablename = 'jobs'
      and index_definition.indexname = 'idx_jobs_public'
      and index_definition.indexdef like '%(published_at DESC)%'
      and index_definition.indexdef like '%WHERE ((status = %active%'
      and index_definition.indexdef like '%deleted_at IS NULL%'
  ) then
    raise exception 'idx_jobs_public is not the expected active/live partial index';
  end if;

  if (
    select access_method.amname
    from pg_catalog.pg_class as index_relation
    join pg_catalog.pg_am as access_method
      on access_method.oid = index_relation.relam
    where index_relation.oid = 'public.idx_jobs_search'::pg_catalog.regclass
  ) <> 'gin' then
    raise exception 'idx_jobs_search must use GIN';
  end if;

  if (
    select access_method.amname
    from pg_catalog.pg_class as index_relation
    join pg_catalog.pg_am as access_method
      on access_method.oid = index_relation.relam
    where index_relation.oid = 'public.idx_jobs_skills'::pg_catalog.regclass
  ) <> 'gin' then
    raise exception 'idx_jobs_skills must use GIN';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_proc as function_definition
    where function_definition.oid = 'public.jooblie_site_id()'::pg_catalog.regprocedure
      and function_definition.provolatile = 'i'
      and pg_catalog.pg_get_function_result(function_definition.oid) = 'smallint'
  ) then
    raise exception 'jooblie_site_id() must be IMMUTABLE and return smallint';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_proc as function_definition
    where function_definition.oid = 'public.company_is_suspended(uuid)'::pg_catalog.regprocedure
      and function_definition.provolatile = 's'
      and function_definition.prosecdef
  ) then
    raise exception 'company_is_suspended(uuid) must be STABLE SECURITY DEFINER';
  end if;

  if pg_catalog.has_table_privilege('authenticated', 'public.job_sites', 'INSERT')
     or pg_catalog.has_table_privilege('anon', 'public.job_sites', 'INSERT') then
    raise exception 'a client role holds INSERT on job_sites';
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from public.jobs)
     or exists (select 1 from public.job_sites) then
    raise exception 'Phase 1.5 must not seed jobs or job_sites';
  end if;
end;
$$;

\echo 'Creating rolled-back Phase 1.5 fixtures'

begin;

insert into public.categories (id, sector_id, slug, name, sort_order)
values (1, 1, 'software', 'Software', 1);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('15000000-0000-4000-8000-000000000001', 'recruiter@phase15.test',
   jsonb_build_object('role', 'recruiter')),
  ('15000000-0000-4000-8000-000000000002', 'other-recruiter@phase15.test',
   jsonb_build_object('role', 'recruiter')),
  ('15000000-0000-4000-8000-000000000003', 'seeker@phase15.test',
   jsonb_build_object('role', 'job_seeker')),
  ('15000000-0000-4000-8000-000000000004', 'admin@phase15.test',
   jsonb_build_object('role', 'job_seeker'));

update public.profiles
set role = 'admin'
where id = '15000000-0000-4000-8000-000000000004';

insert into public.companies (
  id,
  name,
  website,
  registration_number,
  verification_status,
  verified_at,
  verified_by,
  status,
  created_by
)
values
  (
    '25000000-0000-4000-8000-000000000001',
    'Verified Phase 15 Co',
    'https://verified.phase15.test',
    'P15-VERIFIED',
    'verified',
    pg_catalog.now(),
    '15000000-0000-4000-8000-000000000004',
    'active',
    '15000000-0000-4000-8000-000000000001'
  ),
  (
    '25000000-0000-4000-8000-000000000002',
    'Pending Phase 15 Co',
    'https://pending.phase15.test',
    'P15-PENDING',
    'pending',
    null,
    null,
    'active',
    '15000000-0000-4000-8000-000000000002'
  ),
  (
    '25000000-0000-4000-8000-000000000003',
    'Suspended Phase 15 Co',
    'https://suspended.phase15.test',
    'P15-SUSPENDED',
    'verified',
    pg_catalog.now(),
    '15000000-0000-4000-8000-000000000004',
    'suspended',
    '15000000-0000-4000-8000-000000000002'
  );

-- Supplying hostile lifecycle values as the owner proves the BEFORE trigger
-- overwrites them. An authenticated client cannot name `status` at all because
-- that column is intentionally absent from its INSERT grant (asserted below).
insert into public.jobs (
  id, company_id, origin_site_id, created_by, category_id,
  title, description, employment_type, skills,
  status, published_at, expires_at
)
values
  (
    '35000000-0000-4000-8000-000000000001',
    '25000000-0000-4000-8000-000000000001',
    2,
    '15000000-0000-4000-8000-000000000001',
    1,
    'Quasar Platform Engineer',
    'Build distributed hiring systems.',
    'full_time',
    array['quantum', 'postgres'],
    'removed',
    null,
    null
  ),
  (
    '35000000-0000-4000-8000-000000000002',
    '25000000-0000-4000-8000-000000000001',
    1,
    '15000000-0000-4000-8000-000000000001',
    1,
    'Jooblie Origin Engineer',
    'A Jooblie-origin fixture.',
    'contract',
    array['typescript'],
    'pending_review',
    null,
    null
  ),
  (
    '35000000-0000-4000-8000-000000000003',
    '25000000-0000-4000-8000-000000000002',
    2,
    '15000000-0000-4000-8000-000000000002',
    1,
    'Pending Company Engineer',
    'Must remain hidden until verification.',
    'part_time',
    array['review'],
    'active',
    pg_catalog.now(),
    pg_catalog.now() + interval '1 day'
  ),
  (
    '35000000-0000-4000-8000-000000000004',
    '25000000-0000-4000-8000-000000000003',
    2,
    '15000000-0000-4000-8000-000000000002',
    1,
    'Suspended Company Engineer',
    'Active lifecycle, hidden public company.',
    'temporary',
    array['hidden'],
    'pending_review',
    null,
    null
  );

\echo 'Asserting visibility rows, status derivation, and FTS'

do $$
begin
  if (
    select count(*)
    from public.job_sites
    where job_id = '35000000-0000-4000-8000-000000000001'
  ) <> 2 then
    raise exception 'M1 partner-origin visibility expected exactly 2 job_sites rows, got %',
      (
        select count(*)
        from public.job_sites
        where job_id = '35000000-0000-4000-8000-000000000001'
      );
  end if;

  if not exists (
    select 1
    from public.job_sites
    where job_id = '35000000-0000-4000-8000-000000000001'
      and site_id = 1
  ) or not exists (
    select 1
    from public.job_sites
    where job_id = '35000000-0000-4000-8000-000000000001'
      and site_id = 2
  ) then
    raise exception 'partner-origin visibility does not contain origin + Jooblie';
  end if;

  if (
    select count(*)
    from public.job_sites
    where job_id = '35000000-0000-4000-8000-000000000002'
  ) <> 1 then
    raise exception 'Jooblie-origin visibility expected exactly 1 job_sites row';
  end if;

  if (
    select status
    from public.jobs
    where id = '35000000-0000-4000-8000-000000000001'
  ) <> 'active' then
    raise exception 'verified-company job was not derived active';
  end if;

  if (
    select published_at is null or expires_at is null
    from public.jobs
    where id = '35000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'verified-company job is missing publication timestamps';
  end if;

  if (
    select expires_at <> published_at + interval '60 days'
    from public.jobs
    where id = '35000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'verified-company job expiry is not exactly 60 days';
  end if;

  if (
    select status
    from public.jobs
    where id = '35000000-0000-4000-8000-000000000003'
  ) <> 'pending_review' then
    raise exception 'pending-company job was not derived pending_review';
  end if;

  if (
    select published_at is not null or expires_at is not null
    from public.jobs
    where id = '35000000-0000-4000-8000-000000000003'
  ) then
    raise exception 'pending-company job retained publication timestamps';
  end if;

  if not exists (
    select 1
    from public.jobs
    where id = '35000000-0000-4000-8000-000000000001'
      and search_vector @@ pg_catalog.websearch_to_tsquery(
        'pg_catalog.english'::pg_catalog.regconfig,
        'quasar'
      )
  ) then
    raise exception 'FTS title-word lookup did not return the job';
  end if;

  if not exists (
    select 1
    from public.jobs
    where id = '35000000-0000-4000-8000-000000000001'
      and search_vector @@ pg_catalog.websearch_to_tsquery(
        'pg_catalog.english'::pg_catalog.regconfig,
        'quantum'
      )
  ) then
    raise exception 'FTS skills-element lookup did not return the job';
  end if;
end;
$$;

\echo 'Asserting public, seeker, recruiter, and admin read boundaries'

set local request.jwt.claims = '';
set local role anon;

do $$
begin
  if (
    select count(*)
    from public.jobs
    where id in (
      '35000000-0000-4000-8000-000000000001',
      '35000000-0000-4000-8000-000000000002',
      '35000000-0000-4000-8000-000000000003',
      '35000000-0000-4000-8000-000000000004'
    )
  ) <> 2 then
    raise exception 'anon did not see exactly the two public-active jobs';
  end if;

  if exists (
    select 1 from public.jobs
    where id in (
      '35000000-0000-4000-8000-000000000003',
      '35000000-0000-4000-8000-000000000004'
    )
  ) then
    raise exception 'anon saw a pending or suspended-company job';
  end if;

  begin
    insert into public.jobs (
      company_id, origin_site_id, category_id, title, description, employment_type
    ) values (
      '25000000-0000-4000-8000-000000000001', 1, 1,
      'Anon Insert', 'Must fail.', 'full_time'
    );
    raise exception 'anon job INSERT unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"15000000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if (
    select count(*)
    from public.jobs
    where id in (
      '35000000-0000-4000-8000-000000000001',
      '35000000-0000-4000-8000-000000000002',
      '35000000-0000-4000-8000-000000000003',
      '35000000-0000-4000-8000-000000000004'
    )
  ) <> 2 then
    raise exception 'seeker did not see exactly the public-active jobs';
  end if;

  if exists (
    select 1 from public.jobs
    where id = '35000000-0000-4000-8000-000000000004'
  ) then
    raise exception 'seeker saw an active job belonging to a suspended company';
  end if;

  begin
    insert into public.jobs (
      company_id, origin_site_id, category_id, title, description, employment_type
    ) values (
      '25000000-0000-4000-8000-000000000001', 1, 1,
      'Seeker Insert', 'Must fail RLS.', 'full_time'
    );
    raise exception 'seeker job INSERT unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"15000000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if not exists (
    select 1
    from public.jobs
    where id = '35000000-0000-4000-8000-000000000003'
      and status = 'pending_review'
  ) then
    raise exception 'recruiter cannot see their own-company pending job';
  end if;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"15000000-0000-4000-8000-000000000004","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if (
    select count(*)
    from public.jobs
    where id in (
      '35000000-0000-4000-8000-000000000001',
      '35000000-0000-4000-8000-000000000002',
      '35000000-0000-4000-8000-000000000003',
      '35000000-0000-4000-8000-000000000004'
    )
  ) <> 4 then
    raise exception 'admin cannot see all jobs';
  end if;
end;
$$;

reset role;

\echo 'Asserting client inserts, protected lifecycle columns, and job_sites writes'

set local request.jwt.claims = '{"sub":"15000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
declare
  affected_rows integer;
begin
  -- Because status is not in the INSERT grant, a client cannot name it. The
  -- owner-level fixture above separately proves hostile values are overwritten.
  begin
    insert into public.jobs (
      company_id, origin_site_id, category_id, title, description,
      employment_type, status
    ) values (
      '25000000-0000-4000-8000-000000000001', 1, 1,
      'Status Spoof Insert', 'Must fail column privilege.',
      'full_time', 'removed'
    );
    raise exception 'authenticated INSERT supplying jobs.status unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.jobs
    set status = 'closed'
    where id = '35000000-0000-4000-8000-000000000001';
    raise exception 'M2 protected jobs.status UPDATE unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.jobs
    set published_at = pg_catalog.now()
    where id = '35000000-0000-4000-8000-000000000001';
    raise exception 'protected jobs.published_at UPDATE unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.jobs
    set expires_at = pg_catalog.now() + interval '1 day'
    where id = '35000000-0000-4000-8000-000000000001';
    raise exception 'protected jobs.expires_at UPDATE unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  insert into public.jobs (
    company_id, origin_site_id, category_id, title, description,
    employment_type, skills
  ) values (
    '25000000-0000-4000-8000-000000000001', 2, 1,
    'Recruiter Allowed Insert', 'Member insert must succeed.',
    'full_time', array['allowed']
  );

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'member recruiter INSERT affected % rows, expected 1', affected_rows;
  end if;

  begin
    insert into public.jobs (
      company_id, origin_site_id, category_id, title, description, employment_type
    ) values (
      '25000000-0000-4000-8000-000000000002', 2, 1,
      'Non-member Insert', 'Must fail RLS.', 'full_time'
    );
    raise exception 'recruiter inserted a job for a non-member company';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.job_sites (job_id, site_id)
    values ('35000000-0000-4000-8000-000000000001', 1);
    raise exception 'authenticated client INSERT into job_sites unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

set local request.jwt.claims = '';
set local role anon;

do $$
begin
  begin
    insert into public.job_sites (job_id, site_id)
    values ('35000000-0000-4000-8000-000000000001', 1);
    raise exception 'anon INSERT into job_sites unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

\echo 'Exercising every legal and required illegal status transition'

insert into public.jobs (
  id, company_id, origin_site_id, created_by, category_id,
  title, description, employment_type
)
values
  ('35000000-0000-4000-8000-000000000010', '25000000-0000-4000-8000-000000000002', 1,
   '15000000-0000-4000-8000-000000000002', 1, 'Legal Pending Active', 'Fixture', 'full_time'),
  ('35000000-0000-4000-8000-000000000011', '25000000-0000-4000-8000-000000000002', 1,
   '15000000-0000-4000-8000-000000000002', 1, 'Legal Pending Removed', 'Fixture', 'full_time'),
  ('35000000-0000-4000-8000-000000000012', '25000000-0000-4000-8000-000000000001', 1,
   '15000000-0000-4000-8000-000000000001', 1, 'Legal Active Closed', 'Fixture', 'full_time'),
  ('35000000-0000-4000-8000-000000000013', '25000000-0000-4000-8000-000000000001', 1,
   '15000000-0000-4000-8000-000000000001', 1, 'Legal Active Expired', 'Fixture', 'full_time'),
  ('35000000-0000-4000-8000-000000000014', '25000000-0000-4000-8000-000000000001', 1,
   '15000000-0000-4000-8000-000000000001', 1, 'Legal Active Removed', 'Fixture', 'full_time'),
  ('35000000-0000-4000-8000-000000000020', '25000000-0000-4000-8000-000000000002', 1,
   '15000000-0000-4000-8000-000000000002', 1, 'Illegal Pending Closed', 'Fixture', 'full_time'),
  ('35000000-0000-4000-8000-000000000021', '25000000-0000-4000-8000-000000000001', 1,
   '15000000-0000-4000-8000-000000000001', 1, 'Illegal Active Pending', 'Fixture', 'full_time'),
  ('35000000-0000-4000-8000-000000000022', '25000000-0000-4000-8000-000000000001', 1,
   '15000000-0000-4000-8000-000000000001', 1, 'Illegal Closed Expired', 'Fixture', 'full_time');

do $$
begin
  update public.jobs set status = 'active'
  where id = '35000000-0000-4000-8000-000000000010';

  update public.jobs set status = 'removed'
  where id = '35000000-0000-4000-8000-000000000011';
  update public.jobs set status = 'active'
  where id = '35000000-0000-4000-8000-000000000011';

  update public.jobs set status = 'closed'
  where id = '35000000-0000-4000-8000-000000000012';
  update public.jobs set status = 'active'
  where id = '35000000-0000-4000-8000-000000000012';

  update public.jobs set status = 'expired'
  where id = '35000000-0000-4000-8000-000000000013';
  update public.jobs set status = 'active'
  where id = '35000000-0000-4000-8000-000000000013';

  update public.jobs set status = 'removed'
  where id = '35000000-0000-4000-8000-000000000014';
  update public.jobs set status = 'active'
  where id = '35000000-0000-4000-8000-000000000014';

  if exists (
    select 1
    from public.jobs
    where id in (
      '35000000-0000-4000-8000-000000000010',
      '35000000-0000-4000-8000-000000000011',
      '35000000-0000-4000-8000-000000000012',
      '35000000-0000-4000-8000-000000000013',
      '35000000-0000-4000-8000-000000000014'
    )
      and status <> 'active'
  ) then
    raise exception 'one or more legal transition paths did not complete';
  end if;

  begin
    update public.jobs set status = 'closed'
    where id = '35000000-0000-4000-8000-000000000020';
    raise exception 'M3 pending_review -> closed unexpectedly succeeded';
  exception
    when sqlstate 'JB007' then null;
  end;

  begin
    update public.jobs set status = 'pending_review'
    where id = '35000000-0000-4000-8000-000000000021';
    raise exception 'active -> pending_review unexpectedly succeeded';
  exception
    when sqlstate 'JB007' then null;
  end;

  update public.jobs set status = 'closed'
  where id = '35000000-0000-4000-8000-000000000022';

  begin
    update public.jobs set status = 'expired'
    where id = '35000000-0000-4000-8000-000000000022';
    raise exception 'closed -> expired unexpectedly succeeded';
  exception
    when sqlstate 'JB007' then null;
  end;
end;
$$;

\echo 'Asserting verification activates pending jobs and stamps 60-day expiry'

set local request.jwt.claims = '{"sub":"15000000-0000-4000-8000-000000000004","role":"authenticated"}';
set local role authenticated;

select public.admin_set_company_verification(
  '25000000-0000-4000-8000-000000000002',
  'verified'
);

reset role;

do $$
begin
  if exists (
    select 1
    from public.jobs
    where company_id = '25000000-0000-4000-8000-000000000002'
      and status = 'pending_review'
  ) then
    raise exception 'verification left pending_review jobs behind';
  end if;

  if exists (
    select 1
    from public.jobs
    where id in (
      '35000000-0000-4000-8000-000000000003',
      '35000000-0000-4000-8000-000000000020'
    )
      and (
        status <> 'active'
        or published_at is null
        or expires_at is null
        or expires_at <> published_at + interval '60 days'
      )
  ) then
    raise exception 'verification did not activate/stamp all pending jobs';
  end if;
end;
$$;

\echo 'Asserting recruiter updates cannot reach soft-deleted jobs'

update public.jobs
set deleted_at = pg_catalog.now()
where id = '35000000-0000-4000-8000-000000000001';

set local request.jwt.claims = '{"sub":"15000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
declare
  affected_rows integer;
begin
  update public.jobs
  set title = 'Soft-deleted job changed'
  where id = '35000000-0000-4000-8000-000000000001';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'recruiter updated a soft-deleted job';
  end if;
end;
$$;

reset role;

rollback;

do $$
begin
  if exists (select 1 from public.jobs)
     or exists (select 1 from public.job_sites)
     or exists (select 1 from public.companies)
     or exists (select 1 from public.company_members) then
    raise exception 'Phase 1.5 test data leaked outside its transaction';
  end if;
end;
$$;

\echo 'Phase 1.5 jobs assertions passed'
