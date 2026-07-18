\set ON_ERROR_STOP on

\echo 'Asserting Phase 1.3 profiles columns'

do $$
declare
  expected record;
  actual_type text;
  actual_not_null boolean;
  actual_default text;
  actual_column_count integer;
begin
  for expected in
    select *
    from (
      values
        ('id', 'uuid', true, null::text),
        ('role', 'user_role', true, '''job_seeker''::user_role'),
        ('status', 'user_status', true, '''active''::user_status'),
        ('email', 'text', true, null::text),
        ('full_name', 'text', false, null::text),
        ('phone', 'text', false, null::text),
        ('headline', 'text', false, null::text),
        ('location_province', 'text', false, null::text),
        ('location_city', 'text', false, null::text),
        ('skills', 'text[]', false, '''{}''::text[]'),
        ('default_resume_path', 'text', false, null::text),
        ('signup_site_id', 'smallint', true, null::text),
        ('created_at', 'timestamp with time zone', true, 'now()'),
        ('updated_at', 'timestamp with time zone', true, 'now()')
    ) as column_contract(
      column_name,
      data_type,
      not_null,
      default_expression
    )
  loop
    select pg_catalog.format_type(attribute.atttypid, attribute.atttypmod),
           attribute.attnotnull,
           pg_catalog.pg_get_expr(column_default.adbin, column_default.adrelid)
    into actual_type,
         actual_not_null,
         actual_default
    from pg_catalog.pg_attribute as attribute
    left join pg_catalog.pg_attrdef as column_default
      on column_default.adrelid = attribute.attrelid
     and column_default.adnum = attribute.attnum
    where attribute.attrelid = 'public.profiles'::pg_catalog.regclass
      and attribute.attname = expected.column_name
      and attribute.attnum > 0
      and not attribute.attisdropped;

    if not found then
      raise exception 'column public.profiles.% is missing', expected.column_name;
    end if;

    if actual_type is distinct from expected.data_type
       or actual_not_null is distinct from expected.not_null
       or actual_default is distinct from expected.default_expression then
      raise exception 'column public.profiles.% expected type/not-null/default %/%/%, got %/%/%',
        expected.column_name,
        expected.data_type,
        expected.not_null,
        expected.default_expression,
        actual_type,
        actual_not_null,
        actual_default;
    end if;
  end loop;

  select count(*)
  into actual_column_count
  from pg_catalog.pg_attribute as attribute
  where attribute.attrelid = 'public.profiles'::pg_catalog.regclass
    and attribute.attnum > 0
    and not attribute.attisdropped;

  if actual_column_count <> 14 then
    raise exception 'table public.profiles expected 14 columns, got %',
      actual_column_count;
  end if;
end;
$$;

\echo 'Asserting Phase 1.3 keys, indexes, triggers, RLS, and policy inventory'

do $$
declare
  expected_policy record;
  actual_policy record;
  actual_policy_count integer;
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.profiles'::pg_catalog.regclass
      and constraint_definition.contype = 'f'
      and pg_catalog.pg_get_constraintdef(constraint_definition.oid)
        = 'FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE'
  ) then
    raise exception 'profiles.id -> auth.users cascade foreign key is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.profiles'::pg_catalog.regclass
      and constraint_definition.contype = 'f'
      and pg_catalog.pg_get_constraintdef(constraint_definition.oid)
        = 'FOREIGN KEY (signup_site_id) REFERENCES sites(id)'
  ) then
    raise exception 'profiles.signup_site_id -> sites foreign key is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.profiles'::pg_catalog.regclass
      and constraint_definition.contype = 'p'
      and pg_catalog.pg_get_constraintdef(constraint_definition.oid) = 'PRIMARY KEY (id)'
  ) then
    raise exception 'profiles primary key on (id) is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_indexes as index_definition
    where index_definition.schemaname = 'public'
      and index_definition.tablename = 'profiles'
      and index_definition.indexname = 'profiles_role_idx'
      and index_definition.indexdef like '%(role)%'
  ) then
    raise exception 'profiles(role) index is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_indexes as index_definition
    where index_definition.schemaname = 'public'
      and index_definition.tablename = 'profiles'
      and index_definition.indexname = 'profiles_signup_site_id_idx'
      and index_definition.indexdef like '%(signup_site_id)%'
  ) then
    raise exception 'profiles(signup_site_id) index is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_class as table_definition
    where table_definition.oid = 'public.profiles'::pg_catalog.regclass
      and table_definition.relrowsecurity
  ) then
    raise exception 'RLS is not enabled on public.profiles';
  end if;

  -- updated_at is maintained by the 0003 helper, not by client writes:
  -- a BEFORE UPDATE row trigger bound to public.set_updated_at().
  if not exists (
    select 1
    from pg_catalog.pg_trigger as trigger_definition
    where trigger_definition.tgrelid = 'public.profiles'::pg_catalog.regclass
      and trigger_definition.tgname = 'profiles_set_updated_at'
      and not trigger_definition.tgisinternal
      and trigger_definition.tgfoid = 'public.set_updated_at()'::pg_catalog.regprocedure
      -- tgtype bits: 1 = ROW, 2 = BEFORE (unset means AFTER), 16 = UPDATE
      and (trigger_definition.tgtype & 1) = 1
      and (trigger_definition.tgtype & 2) = 2
      and (trigger_definition.tgtype & 16) = 16
  ) then
    raise exception 'profiles_set_updated_at must be a BEFORE UPDATE row trigger on set_updated_at()';
  end if;

  -- Both auth.users triggers must exist and fire AFTER the row lands.
  if not exists (
    select 1
    from pg_catalog.pg_trigger as trigger_definition
    where trigger_definition.tgrelid = 'auth.users'::pg_catalog.regclass
      and trigger_definition.tgname = 'on_auth_user_created'
      and not trigger_definition.tgisinternal
      and trigger_definition.tgfoid = 'public.handle_new_user()'::pg_catalog.regprocedure
      -- ROW, AFTER (BEFORE bit unset), INSERT
      and (trigger_definition.tgtype & 1) = 1
      and (trigger_definition.tgtype & 2) = 0
      and (trigger_definition.tgtype & 4) = 4
  ) then
    raise exception 'on_auth_user_created must be an AFTER INSERT row trigger on handle_new_user()';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger as trigger_definition
    where trigger_definition.tgrelid = 'auth.users'::pg_catalog.regclass
      and trigger_definition.tgname = 'on_auth_user_email_updated'
      and not trigger_definition.tgisinternal
      and trigger_definition.tgfoid = 'public.sync_profile_email()'::pg_catalog.regprocedure
      -- ROW, AFTER (BEFORE bit unset), UPDATE
      and (trigger_definition.tgtype & 1) = 1
      and (trigger_definition.tgtype & 2) = 0
      and (trigger_definition.tgtype & 16) = 16
  ) then
    raise exception 'on_auth_user_email_updated must be an AFTER UPDATE row trigger on sync_profile_email()';
  end if;

  -- Both trigger functions must be SECURITY DEFINER: they write a table that
  -- no client role may write.
  if not exists (
    select 1
    from pg_catalog.pg_proc as function_definition
    where function_definition.oid = 'public.handle_new_user()'::pg_catalog.regprocedure
      and function_definition.prosecdef
  ) then
    raise exception 'public.handle_new_user() must be SECURITY DEFINER';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_proc as function_definition
    where function_definition.oid = 'public.sync_profile_email()'::pg_catalog.regprocedure
      and function_definition.prosecdef
  ) then
    raise exception 'public.sync_profile_email() must be SECURITY DEFINER';
  end if;

  -- Exact policy inventory: one policy per (role, operation), no catch-alls,
  -- and critically no INSERT or DELETE policy of any kind.
  for expected_policy in
    select *
    from (
      values
        ('profiles_job_seeker_select', 'SELECT'),
        ('profiles_recruiter_select', 'SELECT'),
        ('profiles_admin_select', 'SELECT'),
        ('profiles_job_seeker_update', 'UPDATE'),
        ('profiles_recruiter_update', 'UPDATE'),
        ('profiles_admin_update', 'UPDATE')
    ) as policy_contract(policy_name, command)
  loop
    select policy.cmd, policy.roles
    into actual_policy
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'public'
      and policy.tablename = 'profiles'
      and policy.policyname = expected_policy.policy_name;

    if not found then
      raise exception 'policy public.% is missing', expected_policy.policy_name;
    end if;

    if actual_policy.cmd is distinct from expected_policy.command then
      raise exception 'policy public.% expected command %, got %',
        expected_policy.policy_name,
        expected_policy.command,
        actual_policy.cmd;
    end if;

    if actual_policy.roles is distinct from array['authenticated']::name[] then
      raise exception 'policy public.% must target authenticated only, got %',
        expected_policy.policy_name,
        actual_policy.roles;
    end if;
  end loop;

  select count(*)
  into actual_policy_count
  from pg_catalog.pg_policies as policy
  where policy.schemaname = 'public'
    and policy.tablename = 'profiles';

  if actual_policy_count <> 6 then
    raise exception 'public.profiles expected exactly 6 policies, got %',
      actual_policy_count;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'public'
      and policy.tablename = 'profiles'
      and policy.cmd in ('INSERT', 'DELETE', 'ALL')
  ) then
    raise exception 'public.profiles must have no INSERT/DELETE/ALL policy';
  end if;
end;
$$;

\echo 'Asserting Phase 1.3 column grants (defence in depth)'

do $$
declare
  protected_column text;
  editable_column text;
begin
  -- anon holds no privilege at all on profiles (remediation #3).
  if pg_catalog.has_table_privilege('anon', 'public.profiles', 'SELECT, INSERT, UPDATE, DELETE') then
    raise exception 'anon must hold no privilege on public.profiles';
  end if;

  if not pg_catalog.has_table_privilege('authenticated', 'public.profiles', 'SELECT') then
    raise exception 'authenticated is missing SELECT on public.profiles';
  end if;

  if pg_catalog.has_table_privilege('authenticated', 'public.profiles', 'INSERT, DELETE') then
    raise exception 'authenticated must not hold INSERT/DELETE on public.profiles';
  end if;

  foreach protected_column in array array['role', 'status', 'email', 'signup_site_id', 'id']
  loop
    if pg_catalog.has_column_privilege('authenticated', 'public.profiles', protected_column, 'UPDATE') then
      raise exception 'authenticated must not hold UPDATE on protected column profiles.%',
        protected_column;
    end if;
  end loop;

  foreach editable_column in array array[
    'full_name',
    'phone',
    'headline',
    'location_province',
    'location_city',
    'skills',
    'default_resume_path'
  ]
  loop
    if not pg_catalog.has_column_privilege('authenticated', 'public.profiles', editable_column, 'UPDATE') then
      raise exception 'authenticated is missing UPDATE on editable column profiles.%',
        editable_column;
    end if;
  end loop;
end;
$$;

do $$
begin
  if exists (select 1 from public.profiles) then
    raise exception 'Phase 1.3 must not seed profiles';
  end if;
end;
$$;

\echo 'Exercising the signup trigger'

begin;

-- Sites are seeded by migration 0014 (slice 1.9); this transaction stands up
-- the two rows the signup trigger needs and rolls them back at the end.
insert into public.sectors (id, slug, name, sort_order)
values (31000, 'test-tech', 'Test Tech', 1);

insert into public.sites (id, slug, name, domain, site_type, sector_id)
values
  (1, 'jooblie', 'Jooblie', 'jooblie.test', 'aggregator', null),
  (31001, 'it-jobs', 'IT Jobs', 'it-jobs.test', 'sector', 31000);

insert into auth.users (id, email, raw_user_meta_data)
values
  -- Privilege escalation attempt: 'admin' is never honoured.
  ('a0000000-0000-4000-8000-000000000001', 'meta-admin@phase13.test',
   jsonb_build_object('role', 'admin', 'site', 'it-jobs')),
  -- Garbage role, unknown site slug.
  ('a0000000-0000-4000-8000-000000000002', 'meta-garbage@phase13.test',
   jsonb_build_object('role', 'not-a-role', 'site', 'no-such-site')),
  -- No metadata whatsoever.
  ('a0000000-0000-4000-8000-000000000003', 'meta-none@phase13.test', null),
  -- Empty metadata object.
  ('a0000000-0000-4000-8000-000000000004', 'meta-empty@phase13.test', '{}'::jsonb),
  -- Non-text role value.
  ('a0000000-0000-4000-8000-000000000005', 'meta-number@phase13.test',
   jsonb_build_object('role', 5, 'site', 7)),
  -- Whitelisted recruiter on a valid partner site.
  ('a0000000-0000-4000-8000-000000000006', 'meta-recruiter@phase13.test',
   jsonb_build_object('role', 'recruiter', 'site', 'it-jobs')),
  -- Whitelisted seeker, explicit.
  ('a0000000-0000-4000-8000-000000000007', 'meta-seeker@phase13.test',
   jsonb_build_object('role', 'job_seeker', 'site', 'jooblie')),
  -- Case-variant role must not slip through the whitelist.
  ('a0000000-0000-4000-8000-000000000008', 'meta-case@phase13.test',
   jsonb_build_object('role', 'Recruiter')),
  -- Future admin: created as a seeker, promoted below out-of-band.
  ('a0000000-0000-4000-8000-000000000009', 'meta-admin-real@phase13.test',
   jsonb_build_object('role', 'admin'));

do $$
declare
  expected record;
  actual_role public.user_role;
  actual_status public.user_status;
  actual_email text;
  actual_site_id smallint;
begin
  for expected in
    select *
    from (
      values
        ('a0000000-0000-4000-8000-000000000001', 'job_seeker', 31001, 'meta-admin@phase13.test'),
        ('a0000000-0000-4000-8000-000000000002', 'job_seeker', 1, 'meta-garbage@phase13.test'),
        ('a0000000-0000-4000-8000-000000000003', 'job_seeker', 1, 'meta-none@phase13.test'),
        ('a0000000-0000-4000-8000-000000000004', 'job_seeker', 1, 'meta-empty@phase13.test'),
        ('a0000000-0000-4000-8000-000000000005', 'job_seeker', 1, 'meta-number@phase13.test'),
        ('a0000000-0000-4000-8000-000000000006', 'recruiter', 31001, 'meta-recruiter@phase13.test'),
        ('a0000000-0000-4000-8000-000000000007', 'job_seeker', 1, 'meta-seeker@phase13.test'),
        ('a0000000-0000-4000-8000-000000000008', 'job_seeker', 1, 'meta-case@phase13.test'),
        ('a0000000-0000-4000-8000-000000000009', 'job_seeker', 1, 'meta-admin-real@phase13.test')
    ) as signup_contract(user_id, expected_role, expected_site_id, expected_email)
  loop
    select profile.role, profile.status, profile.email, profile.signup_site_id
    into actual_role, actual_status, actual_email, actual_site_id
    from public.profiles as profile
    where profile.id = expected.user_id::uuid;

    if not found then
      raise exception 'signup trigger did not create a profile for %', expected.user_id;
    end if;

    if actual_role::text is distinct from expected.expected_role then
      raise exception 'signup % expected role %, got %',
        expected.expected_email,
        expected.expected_role,
        actual_role;
    end if;

    if actual_site_id is distinct from expected.expected_site_id::smallint then
      raise exception 'signup % expected signup_site_id %, got %',
        expected.expected_email,
        expected.expected_site_id,
        actual_site_id;
    end if;

    if actual_email is distinct from expected.expected_email then
      raise exception 'signup % expected mirrored email %, got %',
        expected.expected_email,
        expected.expected_email,
        actual_email;
    end if;

    if actual_status <> 'active' then
      raise exception 'signup % expected status active, got %',
        expected.expected_email,
        actual_status;
    end if;
  end loop;

  -- No profile is ever created with role admin by the signup path.
  if exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'signup metadata produced an admin profile';
  end if;

  if (select count(*) from public.profiles) <> 9 then
    raise exception 'expected exactly 9 trigger-created profiles, got %',
      (select count(*) from public.profiles);
  end if;
end;
$$;

\echo 'Exercising the email-sync trigger'

update auth.users
set email = 'meta-seeker-changed@phase13.test'
where id = 'a0000000-0000-4000-8000-000000000007';

do $$
begin
  if (
    select profile.email
    from public.profiles as profile
    where profile.id = 'a0000000-0000-4000-8000-000000000007'
  ) <> 'meta-seeker-changed@phase13.test' then
    raise exception 'email-sync trigger did not mirror the new auth.users email';
  end if;

  -- Other rows are untouched by the sync.
  if (
    select profile.email
    from public.profiles as profile
    where profile.id = 'a0000000-0000-4000-8000-000000000006'
  ) <> 'meta-recruiter@phase13.test' then
    raise exception 'email-sync trigger touched an unrelated profile';
  end if;
end;
$$;

-- Promote one user to admin out-of-band. No client path can do this; the test
-- runs as the migration owner precisely because the client cannot.
update public.profiles
set role = 'admin'
where id = 'a0000000-0000-4000-8000-000000000009';

\echo 'Asserting job_seeker client writes: protected columns denied, editable columns allowed'

set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
declare
  statement text;
  affected_rows integer;
begin
  -- Own row is visible, and only the own row.
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'job_seeker expected to see exactly 1 row, got %',
      (select count(*) from public.profiles);
  end if;

  if not exists (
    select 1 from public.profiles
    where id = 'a0000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'job_seeker cannot see their own profile row';
  end if;

  -- Protected columns: blocked by the column grant, on the own row.
  foreach statement in array array[
    'update public.profiles set role = ''admin'' where id = ''a0000000-0000-4000-8000-000000000001''',
    'update public.profiles set status = ''active'' where id = ''a0000000-0000-4000-8000-000000000001''',
    'update public.profiles set email = ''hijack@phase13.test'' where id = ''a0000000-0000-4000-8000-000000000001''',
    'update public.profiles set signup_site_id = 1 where id = ''a0000000-0000-4000-8000-000000000001''',
    'update public.profiles set id = ''a0000000-0000-4000-8000-000000000002'' where id = ''a0000000-0000-4000-8000-000000000001'''
  ]
  loop
    begin
      execute statement;
      raise exception 'protected-column UPDATE unexpectedly succeeded: %', statement;
    exception
      when insufficient_privilege then null;
    end;
  end loop;

  -- INSERT and DELETE have neither grant nor policy.
  begin
    execute 'insert into public.profiles (id, role, email, signup_site_id)
             values (''a0000000-0000-4000-8000-0000000000ff'', ''admin'', ''self-insert@phase13.test'', 1)';
    raise exception 'client INSERT into profiles unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    execute 'delete from public.profiles where id = ''a0000000-0000-4000-8000-000000000001''';
    raise exception 'client DELETE from profiles unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  -- Editable columns on the own row: allowed.
  update public.profiles
  set full_name = 'Seeker Name',
      skills = array['sql', 'react']
  where id = 'a0000000-0000-4000-8000-000000000001';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'editable-column UPDATE affected % rows, expected 1', affected_rows;
  end if;

  update public.profiles
  set phone = '+1-555-0100',
      headline = 'Backend engineer',
      location_province = 'ON',
      location_city = 'Toronto',
      default_resume_path = 'a0000000-0000-4000-8000-000000000001/resume.pdf'
  where id = 'a0000000-0000-4000-8000-000000000001';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'editable-column UPDATE affected % rows, expected 1', affected_rows;
  end if;

  -- Another user's row is out of row scope: no error, zero rows touched.
  update public.profiles
  set full_name = 'Hijacked'
  where id = 'a0000000-0000-4000-8000-000000000006';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'job_seeker updated another user''s row (% rows)', affected_rows;
  end if;
end;
$$;

reset role;

do $$
begin
  if (
    select profile.full_name
    from public.profiles as profile
    where profile.id = 'a0000000-0000-4000-8000-000000000001'
  ) <> 'Seeker Name' then
    raise exception 'editable-column UPDATE did not persist';
  end if;

  if (
    select profile.skills
    from public.profiles as profile
    where profile.id = 'a0000000-0000-4000-8000-000000000001'
  ) is distinct from array['sql', 'react'] then
    raise exception 'skills UPDATE did not persist';
  end if;

  -- Protected values survived every attempt above.
  if (
    select profile.role
    from public.profiles as profile
    where profile.id = 'a0000000-0000-4000-8000-000000000001'
  ) <> 'job_seeker' then
    raise exception 'profiles.role changed under a client write';
  end if;

  if (
    select profile.email
    from public.profiles as profile
    where profile.id = 'a0000000-0000-4000-8000-000000000001'
  ) <> 'meta-admin@phase13.test' then
    raise exception 'profiles.email changed under a client write';
  end if;

  if (
    select profile.full_name
    from public.profiles as profile
    where profile.id = 'a0000000-0000-4000-8000-000000000006'
  ) is not null then
    raise exception 'a cross-user UPDATE reached another profile';
  end if;

end;
$$;

-- updated_at is trigger-maintained, not client-set. now() is transaction-scoped
-- so it cannot visibly advance inside this transaction; instead supply a bogus
-- updated_at and assert the BEFORE trigger overrides it.
update public.profiles
set updated_at = timestamptz '2000-01-01 00:00:00+00'
where id = 'a0000000-0000-4000-8000-000000000001';

do $$
begin
  if (
    select profile.updated_at
    from public.profiles as profile
    where profile.id = 'a0000000-0000-4000-8000-000000000001'
  ) <> pg_catalog.now() then
    raise exception 'profiles_set_updated_at did not override a supplied updated_at';
  end if;
end;
$$;

\echo 'Asserting recruiter own-row access'

set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000006","role":"authenticated"}';
set local role authenticated;

do $$
declare
  affected_rows integer;
begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'recruiter expected to see exactly 1 row, got %',
      (select count(*) from public.profiles);
  end if;

  update public.profiles
  set headline = 'Hiring manager'
  where id = 'a0000000-0000-4000-8000-000000000006';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'recruiter own-row UPDATE affected % rows, expected 1', affected_rows;
  end if;

  begin
    execute 'update public.profiles set role = ''admin'' where id = ''a0000000-0000-4000-8000-000000000006''';
    raise exception 'recruiter protected-column UPDATE unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

\echo 'Asserting admin read scope'

set local request.jwt.claims = '{"sub":"a0000000-0000-4000-8000-000000000009","role":"authenticated"}';
set local role authenticated;

do $$
begin
  -- Admin SELECT is unrestricted (observability requirement, SystemDesign §6.6).
  if (select count(*) from public.profiles) <> 9 then
    raise exception 'admin expected to see all 9 rows, got %',
      (select count(*) from public.profiles);
  end if;

  -- Admin is still bound by the column grants: status is not client-writable
  -- by anyone. The admin status-write path is DEFERRED to the moderation slice.
  begin
    execute 'update public.profiles set status = ''suspended'' where id = ''a0000000-0000-4000-8000-000000000001''';
    raise exception 'admin status UPDATE unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

\echo 'Asserting anon has no access to profiles (remediation #3 regression)'

set local request.jwt.claims = '';
set local role anon;

do $$
declare
  visible_rows integer;
begin
  begin
    execute 'select count(*) from public.profiles' into visible_rows;

    if visible_rows <> 0 then
      raise exception 'anon SELECT on profiles returned % rows, expected 0', visible_rows;
    end if;
  exception
    -- Preferred outcome: anon holds no SELECT grant, so the read never runs.
    when insufficient_privilege then null;
  end;

  begin
    execute 'insert into public.profiles (id, role, email, signup_site_id)
             values (''a0000000-0000-4000-8000-0000000000fe'', ''admin'', ''anon-insert@phase13.test'', 1)';
    raise exception 'anon INSERT into profiles unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    execute 'update public.profiles set full_name = ''anon'' where true';
    raise exception 'anon UPDATE on profiles unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    execute 'delete from public.profiles where true';
    raise exception 'anon DELETE on profiles unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

\echo 'Asserting auth.users cascade'

delete from auth.users where id = 'a0000000-0000-4000-8000-000000000004';

do $$
begin
  if exists (
    select 1 from public.profiles
    where id = 'a0000000-0000-4000-8000-000000000004'
  ) then
    raise exception 'profile row survived its auth.users row (cascade missing)';
  end if;
end;
$$;

rollback;

do $$
begin
  if exists (select 1 from public.profiles) then
    raise exception 'Phase 1.3 test data leaked outside its transaction';
  end if;
end;
$$;

\echo 'Phase 1.3 identity assertions passed'
