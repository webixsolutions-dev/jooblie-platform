\set ON_ERROR_STOP on

\echo 'Asserting Phase 1.1 extensions'

do $$
begin
  if not exists (
    select 1
    from pg_extension as extension
    join pg_namespace as namespace
      on namespace.oid = extension.extnamespace
    where extension.extname = 'pg_cron'
      and namespace.nspname = 'pg_catalog'
  ) then
    raise exception 'pg_cron is missing from pg_catalog';
  end if;

  if not exists (
    select 1
    from pg_extension as extension
    join pg_namespace as namespace
      on namespace.oid = extension.extnamespace
    where extension.extname = 'pg_net'
      and namespace.nspname = 'extensions'
  ) then
    raise exception 'pg_net is missing from extensions';
  end if;
end;
$$;

\echo 'Asserting Phase 1.1 enum values and ordering'

do $$
declare
  expected record;
  actual_values text[];
begin
  for expected in
    select *
    from (
      values
        ('user_role', array['job_seeker', 'recruiter', 'admin']::text[]),
        ('user_status', array['active', 'suspended', 'deleted']::text[]),
        ('site_type', array['aggregator', 'sector', 'audience']::text[]),
        ('company_verification', array['pending', 'verified', 'rejected']::text[]),
        ('company_status', array['active', 'suspended']::text[]),
        ('job_status', array['pending_review', 'active', 'closed', 'expired', 'removed']::text[]),
        ('employment_type', array['full_time', 'part_time', 'contract', 'temporary', 'internship', 'seasonal']::text[]),
        ('salary_period', array['hourly', 'weekly', 'monthly', 'yearly']::text[]),
        ('application_status', array['submitted', 'viewed', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn']::text[]),
        ('company_member_role', array['owner', 'member']::text[])
    ) as enum_contract(enum_name, enum_values)
  loop
    select array_agg(enum_value.enumlabel order by enum_value.enumsortorder)
    into actual_values
    from pg_type as enum_type
    join pg_namespace as namespace
      on namespace.oid = enum_type.typnamespace
    join pg_enum as enum_value
      on enum_value.enumtypid = enum_type.oid
    where namespace.nspname = 'public'
      and enum_type.typname = expected.enum_name;

    if actual_values is distinct from expected.enum_values then
      raise exception 'enum public.% expected %, got %',
        expected.enum_name,
        expected.enum_values,
        actual_values;
    end if;
  end loop;
end;
$$;

\echo 'Asserting Phase 1.1 helper metadata'

do $$
declare
  expected record;
  actual_volatility text;
  actual_security_definer boolean;
begin
  for expected in
    select *
    from (
      values
        ('is_admin()', 's', true),
        ('is_company_member(uuid)', 's', true),
        ('is_suspended()', 's', true),
        ('immutable_arr_join(text[])', 'i', false),
        ('set_updated_at()', 'v', false)
    ) as function_contract(signature, volatility, security_definer)
  loop
    select function_definition.provolatile::text,
           function_definition.prosecdef
    into actual_volatility,
         actual_security_definer
    from pg_proc as function_definition
    where function_definition.oid = to_regprocedure('public.' || expected.signature);

    if not found then
      raise exception 'function public.% is missing', expected.signature;
    end if;

    if actual_volatility is distinct from expected.volatility
       or actual_security_definer is distinct from expected.security_definer then
      raise exception 'function public.% expected volatility/security-definer %/%, got %/%',
        expected.signature,
        expected.volatility,
        expected.security_definer,
        actual_volatility,
        actual_security_definer;
    end if;
  end loop;
end;
$$;

do $$
begin
  if public.immutable_arr_join(array['full', 'stack']) <> 'full stack' then
    raise exception 'immutable_arr_join returned an unexpected value';
  end if;
end;
$$;

\echo 'Phase 1.1 base assertions passed'
