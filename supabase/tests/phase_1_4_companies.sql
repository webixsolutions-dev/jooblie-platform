\set ON_ERROR_STOP on

\echo 'Asserting Phase 1.4 companies and company_members columns'

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
        ('companies', 'id', 'uuid', true, 'gen_random_uuid()', 16),
        ('companies', 'name', 'text', true, null::text, 16),
        ('companies', 'website', 'text', true, null::text, 16),
        ('companies', 'registration_number', 'text', true, null::text, 16),
        ('companies', 'verification_document_path', 'text', false, null::text, 16),
        ('companies', 'logo_path', 'text', false, null::text, 16),
        ('companies', 'description', 'text', false, null::text, 16),
        ('companies', 'verification_status', 'company_verification', true, '''pending''::company_verification', 16),
        ('companies', 'rejection_reason', 'text', false, null::text, 16),
        ('companies', 'verified_at', 'timestamp with time zone', false, null::text, 16),
        ('companies', 'verified_by', 'uuid', false, null::text, 16),
        ('companies', 'status', 'company_status', true, '''active''::company_status', 16),
        ('companies', 'created_by', 'uuid', true, null::text, 16),
        ('companies', 'created_at', 'timestamp with time zone', true, 'now()', 16),
        ('companies', 'updated_at', 'timestamp with time zone', true, 'now()', 16),
        ('companies', 'deleted_at', 'timestamp with time zone', false, null::text, 16),
        ('company_members', 'company_id', 'uuid', true, null::text, 4),
        ('company_members', 'user_id', 'uuid', true, null::text, 4),
        ('company_members', 'role', 'company_member_role', true, '''member''::company_member_role', 4),
        ('company_members', 'created_at', 'timestamp with time zone', true, 'now()', 4)
    ) as column_contract(
      table_name,
      column_name,
      data_type,
      not_null,
      default_expression,
      column_count
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
    where attribute.attrelid = pg_catalog.to_regclass('public.' || expected.table_name)
      and attribute.attname = expected.column_name
      and attribute.attnum > 0
      and not attribute.attisdropped;

    if not found then
      raise exception 'column public.%.% is missing',
        expected.table_name,
        expected.column_name;
    end if;

    if actual_type is distinct from expected.data_type
       or actual_not_null is distinct from expected.not_null
       or actual_default is distinct from expected.default_expression then
      raise exception 'column public.%.% expected type/not-null/default %/%/%, got %/%/%',
        expected.table_name,
        expected.column_name,
        expected.data_type,
        expected.not_null,
        expected.default_expression,
        actual_type,
        actual_not_null,
        actual_default;
    end if;

    select count(*)
    into actual_column_count
    from pg_catalog.pg_attribute as attribute
    where attribute.attrelid = pg_catalog.to_regclass('public.' || expected.table_name)
      and attribute.attnum > 0
      and not attribute.attisdropped;

    if actual_column_count <> expected.column_count then
      raise exception 'table public.% expected % columns, got %',
        expected.table_name,
        expected.column_count,
        actual_column_count;
    end if;
  end loop;
end;
$$;

\echo 'Asserting Phase 1.4 keys, indexes, constraints, triggers, RLS, and policy inventory'

do $$
declare
  expected_policy record;
  actual_policy record;
  actual_policy_count integer;
  rls_table text;
begin
  -- The partial unique index is the duplicate-name defence (legacy gap #2).
  -- It must be UNIQUE, on lower(name), and partial on deleted_at IS NULL --
  -- a non-partial index would make soft-deleted names permanently unusable.
  if not exists (
    select 1
    from pg_catalog.pg_indexes as index_definition
    where index_definition.schemaname = 'public'
      and index_definition.tablename = 'companies'
      and index_definition.indexname = 'companies_lower_name_live_idx'
      and index_definition.indexdef like 'CREATE UNIQUE INDEX%'
      and index_definition.indexdef like '%lower(name)%'
      and index_definition.indexdef like '%WHERE (deleted_at IS NULL)%'
  ) then
    raise exception 'companies unique partial index on lower(name) where deleted_at is null is missing or wrong';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_indexes as index_definition
    where index_definition.schemaname = 'public'
      and index_definition.tablename = 'companies'
      and index_definition.indexname = 'companies_pending_verification_idx'
      and index_definition.indexdef like '%WHERE (verification_status = %pending%'
  ) then
    raise exception 'companies pending-verification partial index is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_indexes as index_definition
    where index_definition.schemaname = 'public'
      and index_definition.tablename = 'company_members'
      and index_definition.indexname = 'company_members_user_id_idx'
      and index_definition.indexdef like '%(user_id)%'
  ) then
    raise exception 'company_members(user_id) reverse-lookup index is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.company_members'::pg_catalog.regclass
      and constraint_definition.contype = 'p'
      and pg_catalog.pg_get_constraintdef(constraint_definition.oid)
        = 'PRIMARY KEY (company_id, user_id)'
  ) then
    raise exception 'company_members composite primary key is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.company_members'::pg_catalog.regclass
      and constraint_definition.contype = 'f'
      and pg_catalog.pg_get_constraintdef(constraint_definition.oid)
        = 'FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE'
  ) then
    raise exception 'company_members.company_id cascade foreign key is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.companies'::pg_catalog.regclass
      and constraint_definition.conname = 'companies_rejection_reason_check'
      and constraint_definition.contype = 'c'
  ) then
    raise exception 'companies rejection-reason check constraint is missing';
  end if;

  foreach rls_table in array array['companies', 'company_members']
  loop
    if not exists (
      select 1
      from pg_catalog.pg_class as table_definition
      where table_definition.oid = pg_catalog.to_regclass('public.' || rls_table)
        and table_definition.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', rls_table;
    end if;
  end loop;

  -- Triggers: owner creation is AFTER INSERT, resubmit is BEFORE UPDATE.
  if not exists (
    select 1
    from pg_catalog.pg_trigger as trigger_definition
    where trigger_definition.tgrelid = 'public.companies'::pg_catalog.regclass
      and trigger_definition.tgname = 'on_company_created'
      and not trigger_definition.tgisinternal
      and trigger_definition.tgfoid = 'public.handle_new_company()'::pg_catalog.regprocedure
      and (trigger_definition.tgtype & 1) = 1
      and (trigger_definition.tgtype & 2) = 0
      and (trigger_definition.tgtype & 4) = 4
  ) then
    raise exception 'on_company_created must be an AFTER INSERT row trigger on handle_new_company()';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger as trigger_definition
    where trigger_definition.tgrelid = 'public.companies'::pg_catalog.regclass
      and trigger_definition.tgname = 'on_company_resubmit'
      and not trigger_definition.tgisinternal
      and trigger_definition.tgfoid = 'public.handle_company_resubmit()'::pg_catalog.regprocedure
      and (trigger_definition.tgtype & 1) = 1
      and (trigger_definition.tgtype & 2) = 2
      and (trigger_definition.tgtype & 16) = 16
  ) then
    raise exception 'on_company_resubmit must be a BEFORE UPDATE row trigger on handle_company_resubmit()';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_trigger as trigger_definition
    where trigger_definition.tgrelid = 'public.companies'::pg_catalog.regclass
      and trigger_definition.tgname = 'companies_set_updated_at'
      and not trigger_definition.tgisinternal
      and trigger_definition.tgfoid = 'public.set_updated_at()'::pg_catalog.regprocedure
  ) then
    raise exception 'companies_set_updated_at trigger is missing';
  end if;

  -- The owner trigger and both admin RPCs must be SECURITY DEFINER: each
  -- writes something no client role may write.
  if not exists (
    select 1 from pg_catalog.pg_proc as function_definition
    where function_definition.oid = 'public.handle_new_company()'::pg_catalog.regprocedure
      and function_definition.prosecdef
  ) then
    raise exception 'public.handle_new_company() must be SECURITY DEFINER';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_proc as function_definition
    where function_definition.oid
        = 'public.admin_set_company_verification(uuid, public.company_verification, text)'::pg_catalog.regprocedure
      and function_definition.prosecdef
  ) then
    raise exception 'admin_set_company_verification must be SECURITY DEFINER';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_proc as function_definition
    where function_definition.oid
        = 'public.admin_set_company_status(uuid, public.company_status)'::pg_catalog.regprocedure
      and function_definition.prosecdef
  ) then
    raise exception 'admin_set_company_status must be SECURITY DEFINER';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_proc as function_definition
    where function_definition.oid = 'public.is_recruiter()'::pg_catalog.regprocedure
      and function_definition.prosecdef
      and function_definition.provolatile = 's'
  ) then
    raise exception 'public.is_recruiter() must be SECURITY DEFINER and STABLE';
  end if;

  -- Exact policy inventory. Critically: no INSERT/UPDATE/DELETE policy on
  -- company_members, and no UPDATE policy on companies for admin (admin
  -- verification goes through the RPC, not a table write).
  for expected_policy in
    select *
    from (
      values
        ('companies', 'companies_public_select', 'SELECT'),
        ('companies', 'companies_recruiter_select', 'SELECT'),
        ('companies', 'companies_admin_select', 'SELECT'),
        ('companies', 'companies_recruiter_insert', 'INSERT'),
        ('companies', 'companies_recruiter_update', 'UPDATE'),
        ('company_members', 'company_members_recruiter_select', 'SELECT'),
        ('company_members', 'company_members_admin_select', 'SELECT')
    ) as policy_contract(table_name, policy_name, command)
  loop
    select policy.cmd into actual_policy
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'public'
      and policy.tablename = expected_policy.table_name
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
  end loop;

  select count(*) into actual_policy_count
  from pg_catalog.pg_policies as policy
  where policy.schemaname = 'public' and policy.tablename = 'companies';

  if actual_policy_count <> 5 then
    raise exception 'public.companies expected exactly 5 policies, got %', actual_policy_count;
  end if;

  select count(*) into actual_policy_count
  from pg_catalog.pg_policies as policy
  where policy.schemaname = 'public' and policy.tablename = 'company_members';

  if actual_policy_count <> 2 then
    raise exception 'public.company_members expected exactly 2 policies, got %', actual_policy_count;
  end if;

  if exists (
    select 1 from pg_catalog.pg_policies as policy
    where policy.schemaname = 'public'
      and policy.tablename = 'company_members'
      and policy.cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  ) then
    raise exception 'company_members must have no client write policy';
  end if;

  if exists (
    select 1 from pg_catalog.pg_policies as policy
    where policy.schemaname = 'public'
      and policy.tablename = 'companies'
      and policy.cmd in ('DELETE', 'ALL')
  ) then
    raise exception 'companies must have no DELETE or ALL policy';
  end if;
end;
$$;

\echo 'Asserting Phase 1.4 column grants (defence in depth)'

do $$
declare
  protected_column text;
  editable_column text;
  public_column text;
  hidden_column text;
begin
  -- anon: column-scoped SELECT on companies only, nothing on company_members.
  foreach public_column in array array['id', 'name', 'website', 'logo_path', 'description', 'created_at']
  loop
    if not pg_catalog.has_column_privilege('anon', 'public.companies', public_column, 'SELECT') then
      raise exception 'anon is missing SELECT on public company column companies.%', public_column;
    end if;
  end loop;

  -- These are the columns a public company page must never expose.
  foreach hidden_column in array array[
    'registration_number',
    'verification_document_path',
    'rejection_reason',
    'verified_by',
    'verified_at',
    'created_by'
  ]
  loop
    if pg_catalog.has_column_privilege('anon', 'public.companies', hidden_column, 'SELECT') then
      raise exception 'anon must not hold SELECT on companies.%', hidden_column;
    end if;
  end loop;

  if pg_catalog.has_table_privilege('anon', 'public.companies', 'INSERT, UPDATE, DELETE') then
    raise exception 'anon must hold no write privilege on public.companies';
  end if;

  if pg_catalog.has_table_privilege('anon', 'public.company_members', 'SELECT, INSERT, UPDATE, DELETE') then
    raise exception 'anon must hold no privilege on public.company_members';
  end if;

  -- authenticated: no write privilege on company_members at all.
  if pg_catalog.has_table_privilege('authenticated', 'public.company_members', 'INSERT, UPDATE, DELETE') then
    raise exception 'authenticated must hold no write privilege on public.company_members';
  end if;

  if not pg_catalog.has_table_privilege('authenticated', 'public.company_members', 'SELECT') then
    raise exception 'authenticated is missing SELECT on public.company_members';
  end if;

  -- companies: the verification columns are writable by no client role.
  foreach protected_column in array array[
    'verification_status',
    'status',
    'verified_at',
    'verified_by',
    'rejection_reason',
    'created_by',
    'deleted_at',
    'id'
  ]
  loop
    if pg_catalog.has_column_privilege('authenticated', 'public.companies', protected_column, 'UPDATE') then
      raise exception 'authenticated must not hold UPDATE on protected column companies.%', protected_column;
    end if;
  end loop;

  foreach editable_column in array array[
    'name',
    'website',
    'registration_number',
    'verification_document_path',
    'logo_path',
    'description'
  ]
  loop
    if not pg_catalog.has_column_privilege('authenticated', 'public.companies', editable_column, 'UPDATE') then
      raise exception 'authenticated is missing UPDATE on editable column companies.%', editable_column;
    end if;
  end loop;

  -- INSERT is column-scoped so a company cannot be born verified/active.
  foreach protected_column in array array[
    'verification_status',
    'status',
    'verified_at',
    'verified_by',
    'rejection_reason',
    'deleted_at'
  ]
  loop
    if pg_catalog.has_column_privilege('authenticated', 'public.companies', protected_column, 'INSERT') then
      raise exception 'authenticated must not hold INSERT on protected column companies.%', protected_column;
    end if;
  end loop;

  if pg_catalog.has_table_privilege('authenticated', 'public.companies', 'DELETE') then
    raise exception 'authenticated must not hold DELETE on public.companies';
  end if;

  -- anon must not be able to invoke either admin RPC.
  if pg_catalog.has_function_privilege(
    'anon',
    'public.admin_set_company_verification(uuid, public.company_verification, text)',
    'EXECUTE'
  ) then
    raise exception 'anon must not hold EXECUTE on admin_set_company_verification';
  end if;

  if pg_catalog.has_function_privilege(
    'anon',
    'public.admin_set_company_status(uuid, public.company_status)',
    'EXECUTE'
  ) then
    raise exception 'anon must not hold EXECUTE on admin_set_company_status';
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from public.companies) or exists (select 1 from public.company_members) then
    raise exception 'Phase 1.4 must not seed company data';
  end if;
end;
$$;

\echo 'Exercising the company lifecycle'

begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('b0000000-0000-4000-8000-000000000001', 'owner@phase14.test',
   jsonb_build_object('role', 'recruiter')),
  ('b0000000-0000-4000-8000-000000000002', 'outsider@phase14.test',
   jsonb_build_object('role', 'recruiter')),
  ('b0000000-0000-4000-8000-000000000003', 'seeker@phase14.test',
   jsonb_build_object('role', 'job_seeker')),
  ('b0000000-0000-4000-8000-000000000004', 'admin@phase14.test',
   jsonb_build_object('role', 'job_seeker'));

-- Admin is promoted out-of-band; no client path can do this (0005 contract).
update public.profiles
set role = 'admin'
where id = 'b0000000-0000-4000-8000-000000000004';

\echo '-- recruiter creates a company; owner row must be automatic'

-- `id` is deliberately NOT in the INSERT grant (asserted above), so a client
-- cannot choose its own primary key and this test cannot either. Pin the
-- default for the duration of this transaction so the row below has a
-- referencable id; it is reset before the second company is created and the
-- whole transaction is rolled back. This changes nothing the test asserts --
-- the recruiter INSERT still goes through RLS and the column grants.
alter table public.companies
  alter column id set default 'c0000000-0000-4000-8000-000000000001'::uuid;

set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

insert into public.companies (name, website, registration_number, created_by)
values (
  'Acme Corp',
  'https://acme.test',
  'REG-0001',
  'b0000000-0000-4000-8000-000000000001'
);

do $$
declare
  member_role public.company_member_role;
  member_count integer;
begin
  select membership.role
  into member_role
  from public.company_members as membership
  where membership.company_id = 'c0000000-0000-4000-8000-000000000001'
    and membership.user_id = 'b0000000-0000-4000-8000-000000000001';

  if not found then
    raise exception 'company INSERT did not create the creator''s membership row';
  end if;

  if member_role <> 'owner' then
    raise exception 'creator membership expected role owner, got %', member_role;
  end if;

  select count(*) into member_count from public.company_members;

  if member_count <> 1 then
    raise exception 'expected exactly 1 membership row, got %', member_count;
  end if;

  -- A brand-new company must never be born verified or active-but-unverified.
  if (
    select company.verification_status
    from public.companies as company
    where company.id = 'c0000000-0000-4000-8000-000000000001'
  ) <> 'pending' then
    raise exception 'new company did not default to pending verification';
  end if;
end;
$$;

reset role;

-- Restore the real default immediately. Leaving it pinned would make every
-- later INSERT collide on the PRIMARY KEY, and a PK collision also raises
-- unique_violation -- which would let the duplicate-name assertions below pass
-- for entirely the wrong reason.
alter table public.companies
  alter column id set default gen_random_uuid();

set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

\echo '-- duplicate names blocked case-insensitively; client write scope'

do $$
declare
  duplicate_name text;
  violated_constraint text;
begin
  -- Both an exact duplicate and a case-variant must be rejected, and each must
  -- be rejected BY THE NAME INDEX specifically. Asserting the constraint name
  -- matters: a primary-key collision also raises unique_violation, so a bare
  -- `when unique_violation` handler can pass for entirely the wrong reason.
  foreach duplicate_name in array array['Acme Corp', 'ACME CORP', 'aCmE cOrP']
  loop
    begin
      execute pg_catalog.format(
        'insert into public.companies (name, website, registration_number, created_by)
         values (%L, %L, %L, %L)',
        duplicate_name,
        'https://dup.test',
        'REG-DUP',
        'b0000000-0000-4000-8000-000000000001'
      );

      raise exception 'duplicate company name % unexpectedly succeeded', duplicate_name;
    exception
      when unique_violation then
        get stacked diagnostics violated_constraint = constraint_name;

        if violated_constraint is distinct from 'companies_lower_name_live_idx' then
          raise exception 'duplicate name % was rejected by %, expected companies_lower_name_live_idx',
            duplicate_name,
            coalesce(violated_constraint, '<none>');
        end if;
    end;
  end loop;

  -- Whitespace-padded names are NOT collapsed by lower() alone, so this one
  -- must succeed. Asserted so that adding trim() later is a deliberate
  -- decision rather than an accidental behaviour change.
  begin
    execute 'insert into public.companies (name, website, registration_number, created_by)
             values ('' acme corp '', ''https://dup3.test'', ''REG-DUP3'', ''b0000000-0000-4000-8000-000000000001'')';
  exception
    when unique_violation then
      raise exception 'whitespace-padded name was unexpectedly treated as a duplicate';
  end;
end;
$$;

reset role;

-- Clients hold no DELETE grant, so the padded row is cleaned up as owner.
delete from public.companies where name = ' acme corp ';

set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
declare
  statement text;
  affected_rows integer;
begin
  -- Protected columns: recruiter cannot self-verify or self-activate.
  foreach statement in array array[
    'update public.companies set verification_status = ''verified'' where id = ''c0000000-0000-4000-8000-000000000001''',
    'update public.companies set status = ''suspended'' where id = ''c0000000-0000-4000-8000-000000000001''',
    'update public.companies set verified_at = now() where id = ''c0000000-0000-4000-8000-000000000001''',
    'update public.companies set verified_by = ''b0000000-0000-4000-8000-000000000001'' where id = ''c0000000-0000-4000-8000-000000000001''',
    'update public.companies set rejection_reason = null where id = ''c0000000-0000-4000-8000-000000000001''',
    'update public.companies set created_by = ''b0000000-0000-4000-8000-000000000002'' where id = ''c0000000-0000-4000-8000-000000000001''',
    'update public.companies set deleted_at = now() where id = ''c0000000-0000-4000-8000-000000000001'''
  ]
  loop
    begin
      execute statement;
      raise exception 'protected-column UPDATE unexpectedly succeeded: %', statement;
    exception
      when insufficient_privilege then null;
    end;
  end loop;

  -- A recruiter cannot create a pre-verified company either (INSERT grant).
  begin
    execute 'insert into public.companies (name, website, registration_number, created_by, verification_status)
             values (''Presto'', ''https://p.test'', ''REG-P'', ''b0000000-0000-4000-8000-000000000001'', ''verified'')';
    raise exception 'recruiter INSERT with verification_status unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  -- A recruiter cannot create a company owned by someone else.
  begin
    execute 'insert into public.companies (name, website, registration_number, created_by)
             values (''Proxy Co'', ''https://proxy.test'', ''REG-X'', ''b0000000-0000-4000-8000-000000000002'')';
    raise exception 'company INSERT with a foreign created_by unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  -- company_members is trigger-managed: no client writes of any kind.
  foreach statement in array array[
    'insert into public.company_members (company_id, user_id, role) values (''c0000000-0000-4000-8000-000000000001'', ''b0000000-0000-4000-8000-000000000002'', ''owner'')',
    'update public.company_members set role = ''owner'' where company_id = ''c0000000-0000-4000-8000-000000000001''',
    'delete from public.company_members where company_id = ''c0000000-0000-4000-8000-000000000001'''
  ]
  loop
    begin
      execute statement;
      raise exception 'client write to company_members unexpectedly succeeded: %', statement;
    exception
      when insufficient_privilege then null;
    end;
  end loop;

  -- Editable columns on the owned company: allowed.
  update public.companies
  set name = 'Acme Corporation',
      website = 'https://acme-corp.test',
      description = 'We make things.'
  where id = 'c0000000-0000-4000-8000-000000000001';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'owner UPDATE affected % rows, expected 1', affected_rows;
  end if;
end;
$$;

reset role;

\echo '-- a non-member recruiter is blind to the company'

set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;

do $$
declare
  affected_rows integer;
begin
  -- Unverified company is not public, and the outsider is not a member.
  if (select count(*) from public.companies) <> 0 then
    raise exception 'non-member recruiter can see % companies, expected 0',
      (select count(*) from public.companies);
  end if;

  if (select count(*) from public.company_members) <> 0 then
    raise exception 'non-member recruiter can see other companies'' membership rows';
  end if;

  -- Out of row scope: no error, zero rows touched.
  update public.companies
  set name = 'Hijacked Corp'
  where id = 'c0000000-0000-4000-8000-000000000001';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'non-member recruiter updated another company (% rows)', affected_rows;
  end if;
end;
$$;

reset role;

do $$
begin
  if (
    select company.name
    from public.companies as company
    where company.id = 'c0000000-0000-4000-8000-000000000001'
  ) <> 'Acme Corporation' then
    raise exception 'a non-member UPDATE reached the company row';
  end if;
end;
$$;

\echo '-- rejection requires a reason; resubmit returns the company to pending'

do $$
begin
  -- The CHECK constraint is the backstop, tested directly as the owner role.
  begin
    update public.companies
    set verification_status = 'rejected', rejection_reason = null
    where id = 'c0000000-0000-4000-8000-000000000001';

    raise exception 'rejection without a reason unexpectedly succeeded';
  exception
    when check_violation then null;
  end;
end;
$$;

set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-000000000004","role":"authenticated"}';
set local role authenticated;

do $$
begin
  -- The RPC enforces the same rule ahead of the constraint.
  begin
    perform public.admin_set_company_verification(
      'c0000000-0000-4000-8000-000000000001', 'rejected', null
    );
    raise exception 'RPC rejection without a reason unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

  begin
    perform public.admin_set_company_verification(
      'c0000000-0000-4000-8000-000000000001', 'rejected', '   '
    );
    raise exception 'RPC rejection with a blank reason unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

  perform public.admin_set_company_verification(
    'c0000000-0000-4000-8000-000000000001', 'rejected', 'Registration number could not be confirmed.'
  );
end;
$$;

reset role;

do $$
begin
  if (
    select company.verification_status
    from public.companies as company
    where company.id = 'c0000000-0000-4000-8000-000000000001'
  ) <> 'rejected' then
    raise exception 'admin rejection did not persist';
  end if;

  if (
    select company.rejection_reason
    from public.companies as company
    where company.id = 'c0000000-0000-4000-8000-000000000001'
  ) is null then
    raise exception 'rejection reason was not stored';
  end if;
end;
$$;

set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
begin
  -- A cosmetic edit must NOT re-open review.
  update public.companies
  set description = 'We make better things.'
  where id = 'c0000000-0000-4000-8000-000000000001';

  if (
    select company.verification_status
    from public.companies as company
    where company.id = 'c0000000-0000-4000-8000-000000000001'
  ) <> 'rejected' then
    raise exception 'a cosmetic edit incorrectly triggered resubmission';
  end if;

  -- A verification-material edit must flip the company back to pending and
  -- clear the stale reason -- even though the recruiter cannot write either
  -- column directly (the BEFORE trigger does it).
  update public.companies
  set registration_number = 'REG-0001-CORRECTED'
  where id = 'c0000000-0000-4000-8000-000000000001';
end;
$$;

reset role;

do $$
begin
  if (
    select company.verification_status
    from public.companies as company
    where company.id = 'c0000000-0000-4000-8000-000000000001'
  ) <> 'pending' then
    raise exception 'resubmission did not flip the company back to pending';
  end if;

  if (
    select company.rejection_reason
    from public.companies as company
    where company.id = 'c0000000-0000-4000-8000-000000000001'
  ) is not null then
    raise exception 'resubmission did not clear the stale rejection reason';
  end if;
end;
$$;

\echo '-- only an admin may verify, and verification stamps provenance'

set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
begin
  begin
    perform public.admin_set_company_verification(
      'c0000000-0000-4000-8000-000000000001', 'verified'
    );
    raise exception 'a recruiter self-verified their own company';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.admin_set_company_status(
      'c0000000-0000-4000-8000-000000000001', 'active'
    );
    raise exception 'a recruiter invoked the admin status RPC';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

\echo '-- a suspended or deleted recruiter cannot stand up a new company'

do $$
declare
  blocked_status public.user_status;
begin
  foreach blocked_status in array array['suspended', 'deleted']::public.user_status[]
  loop
    -- profiles.status is not client-writable (0005), so an admin-equivalent
    -- path sets it here.
    update public.profiles
    set status = blocked_status
    where id = 'b0000000-0000-4000-8000-000000000002';

    perform set_config(
      'request.jwt.claims',
      '{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated"}',
      true
    );
    set local role authenticated;

    begin
      execute pg_catalog.format(
        'insert into public.companies (name, website, registration_number, created_by)
         values (%L, ''https://blocked.test'', ''REG-B'', ''b0000000-0000-4000-8000-000000000002'')',
        'Blocked Co ' || blocked_status::text
      );

      raise exception 'a % recruiter created a company', blocked_status;
    exception
      when insufficient_privilege then null;
    end;

    reset role;
  end loop;

  -- Restore so the reborn-company case below still exercises a live recruiter.
  update public.profiles
  set status = 'active'
  where id = 'b0000000-0000-4000-8000-000000000002';
end;
$$;

set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;

do $$
begin
  -- A job_seeker cannot create a company at all (is_recruiter guard).
  begin
    execute 'insert into public.companies (name, website, registration_number, created_by)
             values (''Seeker Co'', ''https://sc.test'', ''REG-S'', ''b0000000-0000-4000-8000-000000000003'')';
    raise exception 'job_seeker company INSERT unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.admin_set_company_verification(
      'c0000000-0000-4000-8000-000000000001', 'verified'
    );
    raise exception 'a job_seeker invoked the admin verification RPC';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-000000000004","role":"authenticated"}';
set local role authenticated;

do $$
begin
  -- Admin sees every company regardless of verification state.
  if (select count(*) from public.companies) <> 1 then
    raise exception 'admin expected to see 1 company, got %',
      (select count(*) from public.companies);
  end if;

  if (select count(*) from public.company_members) <> 1 then
    raise exception 'admin expected to see 1 membership row, got %',
      (select count(*) from public.company_members);
  end if;

  perform public.admin_set_company_verification(
    'c0000000-0000-4000-8000-000000000001', 'verified'
  );
end;
$$;

reset role;

do $$
begin
  if (
    select company.verification_status
    from public.companies as company
    where company.id = 'c0000000-0000-4000-8000-000000000001'
  ) <> 'verified' then
    raise exception 'admin verification did not persist';
  end if;

  if (
    select company.verified_by
    from public.companies as company
    where company.id = 'c0000000-0000-4000-8000-000000000001'
  ) <> 'b0000000-0000-4000-8000-000000000004' then
    raise exception 'verified_by was not stamped with the acting admin';
  end if;

  if (
    select company.verified_at
    from public.companies as company
    where company.id = 'c0000000-0000-4000-8000-000000000001'
  ) is null then
    raise exception 'verified_at was not stamped';
  end if;

  if (
    select company.rejection_reason
    from public.companies as company
    where company.id = 'c0000000-0000-4000-8000-000000000001'
  ) is not null then
    raise exception 'verification did not clear the rejection reason';
  end if;
end;
$$;

\echo '-- anon sees verified+active companies only'

set local request.jwt.claims = '';
set local role anon;

do $$
declare
  visible_rows integer;
begin
  select count(*) into visible_rows from public.companies;

  if visible_rows <> 1 then
    raise exception 'anon expected to see the verified company, got % rows', visible_rows;
  end if;

  -- The hidden columns are unreachable even on a visible row.
  begin
    execute 'select registration_number from public.companies';
    raise exception 'anon read companies.registration_number';
  exception
    when insufficient_privilege then null;
  end;

  begin
    execute 'select verification_document_path from public.companies';
    raise exception 'anon read companies.verification_document_path';
  exception
    when insufficient_privilege then null;
  end;

  begin
    execute 'select count(*) from public.company_members' into visible_rows;
    if visible_rows <> 0 then
      raise exception 'anon saw % company_members rows, expected 0', visible_rows;
    end if;
  exception
    when insufficient_privilege then null;
  end;

  begin
    execute 'insert into public.companies (name, website, registration_number, created_by)
             values (''Anon Co'', ''https://a.test'', ''REG-A'', ''b0000000-0000-4000-8000-000000000001'')';
    raise exception 'anon company INSERT unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

\echo '-- suspending the company hides it from the public again'

set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-000000000004","role":"authenticated"}';
set local role authenticated;
select public.admin_set_company_status('c0000000-0000-4000-8000-000000000001', 'suspended');
reset role;

set local request.jwt.claims = '';
set local role anon;

do $$
begin
  if (select count(*) from public.companies) <> 0 then
    raise exception 'anon can still see a suspended company';
  end if;
end;
$$;

reset role;

\echo '-- soft-deleted names become reusable'

update public.companies
set deleted_at = now(), status = 'active'
where id = 'c0000000-0000-4000-8000-000000000001';

do $$
begin
  if (select count(*) from public.companies where deleted_at is null) <> 0 then
    raise exception 'soft delete did not take effect';
  end if;
end;
$$;

set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;

-- The partial unique index is scoped to live rows, so the retired name frees up.
insert into public.companies (name, website, registration_number, created_by)
values (
  'Acme Corporation',
  'https://acme-reborn.test',
  'REG-0002',
  'b0000000-0000-4000-8000-000000000002'
);

reset role;

do $$
begin
  if (select count(*) from public.companies where lower(name) = 'acme corporation') <> 2 then
    raise exception 'expected the retired and the reborn company to coexist';
  end if;

  -- The new company got its own owner row.
  if (
    select count(*)
    from public.company_members as membership
    where membership.user_id = 'b0000000-0000-4000-8000-000000000002'
      and membership.role = 'owner'
  ) <> 1 then
    raise exception 'the reborn company did not get an owner membership row';
  end if;
end;
$$;

\echo '-- a soft-deleted company is invisible and immutable to its owner'

set local request.jwt.claims = '{"sub":"b0000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
declare
  affected_rows integer;
begin
  update public.companies
  set description = 'resurrect me'
  where id = 'c0000000-0000-4000-8000-000000000001';

  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'owner updated a soft-deleted company (% rows)', affected_rows;
  end if;
end;
$$;

reset role;

\echo '-- company_members cascades when its company is hard-deleted'

delete from public.companies where id = 'c0000000-0000-4000-8000-000000000001';

do $$
begin
  if exists (
    select 1 from public.company_members
    where company_id = 'c0000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'company_members row survived its company (cascade missing)';
  end if;
end;
$$;

rollback;

do $$
begin
  if exists (select 1 from public.companies) or exists (select 1 from public.company_members) then
    raise exception 'Phase 1.4 test data leaked outside its transaction';
  end if;
end;
$$;

\echo 'Phase 1.4 company assertions passed'
