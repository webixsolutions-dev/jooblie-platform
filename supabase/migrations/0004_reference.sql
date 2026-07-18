create table public.sectors (
  id smallint primary key,
  slug text unique not null,
  name text not null,
  sort_order smallint not null
);

create table public.categories (
  id smallint primary key,
  sector_id smallint not null references public.sectors (id),
  slug text unique not null,
  name text not null,
  sort_order smallint not null,
  is_active boolean default true
);

create index categories_sector_id_idx
  on public.categories (sector_id);

create table public.sites (
  id smallint primary key,
  slug text unique not null,
  name text not null,
  domain text unique not null,
  site_type public.site_type not null,
  sector_id smallint references public.sectors (id),
  is_active boolean default true,
  constraint sites_site_type_sector_id_check
    check ((site_type = 'sector') = (sector_id is not null))
);

alter table public.sectors enable row level security;
alter table public.categories enable row level security;
alter table public.sites enable row level security;

grant select on table public.sectors to anon, authenticated;
grant select on table public.categories to anon, authenticated;
grant select on table public.sites to anon, authenticated;

create policy sectors_public_select
on public.sectors
for select
to anon, authenticated
using (true);

create policy categories_public_select
on public.categories
for select
to anon, authenticated
using (true);

create policy sites_public_select
on public.sites
for select
to anon, authenticated
using (true);
