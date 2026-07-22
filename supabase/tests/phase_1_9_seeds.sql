\echo 'Asserting Phase 1.9 site and taxonomy seed rows'

do $$
declare
  duplicate_count integer;
  orphan_count integer;
begin
  if (select count(*) from public.sites) <> 7 then
    raise exception 'expected exactly 7 seeded sites';
  end if;

  if (select count(*) from public.sectors) <> 5 then
    raise exception 'expected exactly 5 seeded sectors';
  end if;

  if (select count(*) from public.categories) <> 38 then
    raise exception 'expected exactly 38 seeded categories';
  end if;

  if not exists (
    select 1
    from public.sites
    where id = 1
      and slug = 'jooblie'
      and id = public.jooblie_site_id()
  ) then
    raise exception 'Jooblie must be site id 1 and match jooblie_site_id()';
  end if;

  if exists (
    select 1
    from public.sites
    where sector_id = 5
  ) then
    raise exception 'general-services must not map to a partner site';
  end if;

  if not exists (
    select 1
    from public.categories
    where id = 507
      and slug = 'skilled-trades-construction'
      and sector_id = 5
  ) then
    raise exception 'skilled-trades-construction must be category 507 in general-services';
  end if;

  select count(*)
  into orphan_count
  from public.categories as category
  left join public.sectors as sector on sector.id = category.sector_id
  where sector.id is null;

  if orphan_count <> 0 then
    raise exception 'found % categories with unresolved sector_id', orphan_count;
  end if;

  for duplicate_count in
    select count(*)
    from (
      select slug from public.sites group by slug having count(*) > 1
      union all
      select slug from public.sectors group by slug having count(*) > 1
      union all
      select slug from public.categories group by slug having count(*) > 1
    ) as duplicate_slug
  loop
    if duplicate_count <> 0 then
      raise exception 'seeded reference data contains duplicate slugs';
    end if;
  end loop;
end;
$$;

\echo 'Asserting anon reference reads and writes'

begin;
set local role anon;

do $$
declare
  statement text;
begin
  if (select count(*) from public.sites) <> 7
     or (select count(*) from public.sectors) <> 5
     or (select count(*) from public.categories) <> 38
  then
    raise exception 'anon cannot read all seeded reference rows';
  end if;

  foreach statement in array array[
    'insert into public.sectors (id, slug, name, sort_order) values (32000, ''anon-sector'', ''Anon Sector'', 32000)',
    'update public.sectors set name = ''Anon Changed'' where id = 1',
    'insert into public.categories (id, sector_id, slug, name, sort_order) values (32000, 1, ''anon-category'', ''Anon Category'', 32000)',
    'update public.categories set name = ''Anon Changed'' where id = 101',
    'insert into public.sites (id, slug, name, domain, site_type) values (32000, ''anon-site'', ''Anon Site'', ''anon.invalid'', ''audience'')',
    'update public.sites set name = ''Anon Changed'' where id = 1'
  ]
  loop
    begin
      execute statement;
      raise exception 'anon reference write unexpectedly succeeded: %', statement;
    exception
      when insufficient_privilege then null;
    end;
  end loop;
end;
$$;

rollback;

\echo 'Asserting authenticated reference reads and writes'

begin;
set local role authenticated;

do $$
declare
  statement text;
begin
  if (select count(*) from public.sites) <> 7
     or (select count(*) from public.sectors) <> 5
     or (select count(*) from public.categories) <> 38
  then
    raise exception 'authenticated cannot read all seeded reference rows';
  end if;

  foreach statement in array array[
    'insert into public.sectors (id, slug, name, sort_order) values (32001, ''authenticated-sector'', ''Authenticated Sector'', 32001)',
    'update public.sectors set name = ''Authenticated Changed'' where id = 1',
    'insert into public.categories (id, sector_id, slug, name, sort_order) values (32001, 1, ''authenticated-category'', ''Authenticated Category'', 32001)',
    'update public.categories set name = ''Authenticated Changed'' where id = 101',
    'insert into public.sites (id, slug, name, domain, site_type) values (32001, ''authenticated-site'', ''Authenticated Site'', ''authenticated.invalid'', ''audience'')',
    'update public.sites set name = ''Authenticated Changed'' where id = 1'
  ]
  loop
    begin
      execute statement;
      raise exception 'authenticated reference write unexpectedly succeeded: %', statement;
    exception
      when insufficient_privilege then null;
    end;
  end loop;
end;
$$;

rollback;

\echo 'Phase 1.9 seed assertions passed'
