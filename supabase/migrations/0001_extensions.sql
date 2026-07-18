-- Phase 1.1 uses a custom public.set_updated_at() trigger function instead of
-- moddatetime. The function is defined in 0003_helpers.sql with the other
-- reusable helper functions.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
