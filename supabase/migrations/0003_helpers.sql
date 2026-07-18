-- The profiles and company_members tables land in later Phase 1 slices.
-- PL/pgSQL resolves these fully qualified table references when the functions
-- are called, so the helpers can be defined now without placeholder tables.
-- They must not be called until their referenced tables have been migrated.

create function public.is_admin()
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
      and profile.role = 'admin'
  );
end;
$$;

create function public.is_company_member(_company_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1
    from public.company_members as membership
    where membership.company_id = _company_id
      and membership.user_id = auth.uid()
  );
end;
$$;

create function public.is_suspended()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return coalesce(
    (
      select profile.status in ('suspended', 'deleted')
      from public.profiles as profile
      where profile.id = auth.uid()
    ),
    false
  );
end;
$$;

create function public.immutable_arr_join(_values text[])
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select pg_catalog.array_to_string(_values, ' ');
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;
