\set ON_ERROR_STOP on

\echo 'Asserting Phase 1.2 reference-table columns'

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
        ('sectors', 'id', 'smallint', true, null::text, 4),
        ('sectors', 'slug', 'text', true, null::text, 4),
        ('sectors', 'name', 'text', true, null::text, 4),
        ('sectors', 'sort_order', 'smallint', true, null::text, 4),
        ('categories', 'id', 'smallint', true, null::text, 6),
        ('categories', 'sector_id', 'smallint', true, null::text, 6),
        ('categories', 'slug', 'text', true, null::text, 6),
        ('categories', 'name', 'text', true, null::text, 6),
        ('categories', 'sort_order', 'smallint', true, null::text, 6),
        ('categories', 'is_active', 'boolean', false, 'true', 6),
        ('sites', 'id', 'smallint', true, null::text, 7),
        ('sites', 'slug', 'text', true, null::text, 7),
        ('sites', 'name', 'text', true, null::text, 7),
        ('sites', 'domain', 'text', true, null::text, 7),
        ('sites', 'site_type', 'site_type', true, null::text, 7),
        ('sites', 'sector_id', 'smallint', false, null::text, 7),
        ('sites', 'is_active', 'boolean', false, 'true', 7)
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

\echo 'Asserting Phase 1.2 keys, index, RLS, and policy inventory'

do $$
declare
  reference_table text;
  client_role text;
  expected_policy text;
  actual_roles name[];
begin
  foreach reference_table in array array['sectors', 'categories', 'sites']
  loop
    if not exists (
      select 1
      from pg_catalog.pg_constraint as constraint_definition
      where constraint_definition.conrelid = pg_catalog.to_regclass('public.' || reference_table)
        and constraint_definition.contype = 'p'
    ) then
      raise exception 'public.% is missing its primary key', reference_table;
    end if;

    if not exists (
      select 1
      from pg_catalog.pg_class as table_definition
      where table_definition.oid = pg_catalog.to_regclass('public.' || reference_table)
        and table_definition.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on public.%', reference_table;
    end if;

    expected_policy := reference_table || '_public_select';

    select policy.roles
    into actual_roles
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'public'
      and policy.tablename = reference_table
      and policy.policyname = expected_policy
      and policy.cmd = 'SELECT';

    if not found then
      raise exception 'SELECT policy public.% is missing', expected_policy;
    end if;

    if actual_roles is distinct from array['anon', 'authenticated']::name[] then
      raise exception 'policy public.% expected anon/authenticated roles, got %',
        expected_policy,
        actual_roles;
    end if;

    if (
      select count(*)
      from pg_catalog.pg_policies as policy
      where policy.schemaname = 'public'
        and policy.tablename = reference_table
    ) <> 1 then
      raise exception 'public.% must have exactly one policy', reference_table;
    end if;

    foreach client_role in array array['anon', 'authenticated']
    loop
      if not pg_catalog.has_table_privilege(
        client_role,
        'public.' || reference_table,
        'SELECT'
      ) then
        raise exception '% is missing SELECT privilege on public.%',
          client_role,
          reference_table;
      end if;

      if pg_catalog.has_table_privilege(
        client_role,
        'public.' || reference_table,
        'INSERT, UPDATE, DELETE'
      ) then
        raise exception '% has a write privilege on public.%',
          client_role,
          reference_table;
      end if;
    end loop;
  end loop;

  if not exists (
    select 1
    from pg_catalog.pg_indexes as index_definition
    where index_definition.schemaname = 'public'
      and index_definition.tablename = 'categories'
      and index_definition.indexname = 'categories_sector_id_idx'
      and index_definition.indexdef like '%(sector_id)%'
  ) then
    raise exception 'categories(sector_id) index is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.categories'::pg_catalog.regclass
      and constraint_definition.contype = 'f'
      and pg_catalog.pg_get_constraintdef(constraint_definition.oid)
        = 'FOREIGN KEY (sector_id) REFERENCES sectors(id)'
  ) then
    raise exception 'categories.sector_id foreign key is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.sites'::pg_catalog.regclass
      and constraint_definition.contype = 'f'
      and pg_catalog.pg_get_constraintdef(constraint_definition.oid)
        = 'FOREIGN KEY (sector_id) REFERENCES sectors(id)'
  ) then
    raise exception 'sites.sector_id foreign key is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.sectors'::pg_catalog.regclass
      and constraint_definition.contype = 'u'
      and pg_catalog.pg_get_constraintdef(constraint_definition.oid) = 'UNIQUE (slug)'
  ) then
    raise exception 'sectors.slug unique constraint is missing';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.categories'::pg_catalog.regclass
      and constraint_definition.contype = 'u'
      and pg_catalog.pg_get_constraintdef(constraint_definition.oid) = 'UNIQUE (slug)'
  ) then
    raise exception 'categories.slug unique constraint is missing';
  end if;

  if (
    select count(*)
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.sites'::pg_catalog.regclass
      and constraint_definition.contype = 'u'
      and pg_catalog.pg_get_constraintdef(constraint_definition.oid)
        in ('UNIQUE (slug)', 'UNIQUE (domain)')
  ) <> 2 then
    raise exception 'sites.slug/domain unique constraints are missing';
  end if;
end;
$$;

\echo 'Asserting the sites site_type/sector_id check constraint'

begin;

insert into public.sectors (id, slug, name, sort_order)
values (30000, 'test-sector', 'Test Sector', 1);

do $$
begin
  begin
    insert into public.sites (
      id,
      slug,
      name,
      domain,
      site_type,
      sector_id
    ) values (
      30000,
      'invalid-sector-site',
      'Invalid Sector Site',
      'invalid-sector.test',
      'sector',
      null
    );

    raise exception 'sector site without sector_id unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.sites (
      id,
      slug,
      name,
      domain,
      site_type,
      sector_id
    ) values (
      30001,
      'invalid-audience-site',
      'Invalid Audience Site',
      'invalid-audience.test',
      'audience',
      30000
    );

    raise exception 'non-sector site with sector_id unexpectedly succeeded';
  exception
    when check_violation then null;
  end;

  begin
    insert into public.sites (
      id,
      slug,
      name,
      domain,
      site_type,
      sector_id
    ) values (
      30002,
      'invalid-aggregator-site',
      'Invalid Aggregator Site',
      'invalid-aggregator.test',
      'aggregator',
      30000
    );

    raise exception 'aggregator site with sector_id unexpectedly succeeded';
  exception
    when check_violation then null;
  end;
end;
$$;

insert into public.categories (
  id,
  sector_id,
  slug,
  name,
  sort_order
) values (
  30000,
  30000,
  'test-category',
  'Test Category',
  1
);

insert into public.sites (
  id,
  slug,
  name,
  domain,
  site_type,
  sector_id
) values
  (30003, 'valid-sector-site', 'Valid Sector Site', 'valid-sector.test', 'sector', 30000),
  (30004, 'valid-audience-site', 'Valid Audience Site', 'valid-audience.test', 'audience', null),
  (30005, 'valid-aggregator-site', 'Valid Aggregator Site', 'valid-aggregator.test', 'aggregator', null);

\echo 'Asserting anon read access and write denial'

set local role anon;

do $$
declare
  statement text;
  affected_rows integer;
begin
  if (select count(*) from public.sectors) <> 6
     or (select count(*) from public.categories) <> 39
     or (select count(*) from public.sites) <> 10 then
    raise exception 'anon cannot read all reference rows';
  end if;

  foreach statement in array array[
    'insert into public.sectors (id, slug, name, sort_order) values (30010, ''anon-sector'', ''Anon Sector'', 2)',
    'insert into public.categories (id, sector_id, slug, name, sort_order) values (30010, 30000, ''anon-category'', ''Anon Category'', 2)',
    'insert into public.sites (id, slug, name, domain, site_type) values (30010, ''anon-site'', ''Anon Site'', ''anon.test'', ''audience'')'
  ]
  loop
    begin
      execute statement;
      raise exception 'anon INSERT unexpectedly succeeded: %', statement;
    exception
      when insufficient_privilege then null;
    end;
  end loop;

  foreach statement in array array[
    'update public.sectors set name = ''Anon Update'' where id = 30000',
    'update public.categories set name = ''Anon Update'' where id = 30000',
    'update public.sites set name = ''Anon Update'' where id = 30003',
    'delete from public.categories where id = 30000',
    'delete from public.sites where id = 30003',
    'delete from public.sectors where id = 30000'
  ]
  loop
    begin
      execute statement;
      get diagnostics affected_rows = row_count;

      if affected_rows <> 0 then
        raise exception 'anon write unexpectedly affected rows: %', statement;
      end if;
    exception
      when insufficient_privilege then null;
    end;
  end loop;
end;
$$;

reset role;

\echo 'Asserting authenticated read access and write denial'

set local role authenticated;

do $$
declare
  statement text;
  affected_rows integer;
begin
  if (select count(*) from public.sectors) <> 6
     or (select count(*) from public.categories) <> 39
     or (select count(*) from public.sites) <> 10 then
    raise exception 'authenticated cannot read all reference rows';
  end if;

  foreach statement in array array[
    'insert into public.sectors (id, slug, name, sort_order) values (30020, ''authenticated-sector'', ''Authenticated Sector'', 2)',
    'insert into public.categories (id, sector_id, slug, name, sort_order) values (30020, 30000, ''authenticated-category'', ''Authenticated Category'', 2)',
    'insert into public.sites (id, slug, name, domain, site_type) values (30020, ''authenticated-site'', ''Authenticated Site'', ''authenticated.test'', ''audience'')'
  ]
  loop
    begin
      execute statement;
      raise exception 'authenticated INSERT unexpectedly succeeded: %', statement;
    exception
      when insufficient_privilege then null;
    end;
  end loop;

  foreach statement in array array[
    'update public.sectors set name = ''Authenticated Update'' where id = 30000',
    'update public.categories set name = ''Authenticated Update'' where id = 30000',
    'update public.sites set name = ''Authenticated Update'' where id = 30003',
    'delete from public.categories where id = 30000',
    'delete from public.sites where id = 30003',
    'delete from public.sectors where id = 30000'
  ]
  loop
    begin
      execute statement;
      get diagnostics affected_rows = row_count;

      if affected_rows <> 0 then
        raise exception 'authenticated write unexpectedly affected rows: %', statement;
      end if;
    exception
      when insufficient_privilege then null;
    end;
  end loop;
end;
$$;

reset role;

rollback;

\echo 'Phase 1.2 reference assertions passed'
