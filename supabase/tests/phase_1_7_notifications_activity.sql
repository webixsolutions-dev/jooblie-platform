\set ON_ERROR_STOP on

-- Phase 1.7 mutation-proof targets:
--   MA bypassing the deleted-recipient guard notifies a deleted company member;
--   MB narrowing new-applicant fan-out to the job creator produces one row;
--   MC granting emit_notification() to authenticated opens notification forgery;
--   MD removing the actor/recipient skip notifies a seeker about their withdrawal.

\echo 'Asserting Phase 1.7 schema, indexes, triggers, grants, functions, and RLS inventory'

do $$
declare
  actual_policies text[];
  actual_triggers text[];
  enum_labels text[];
  expected_index text;
  tested_role text;
begin
  if pg_catalog.to_regclass('public.notifications') is null
     or pg_catalog.to_regclass('public.activity_log') is null then
    raise exception 'one or more Phase 1.7 tables are missing';
  end if;

  select array_agg(enum_value.enumlabel order by enum_value.enumsortorder)
  into enum_labels
  from pg_catalog.pg_type as enum_type
  join pg_catalog.pg_namespace as enum_namespace
    on enum_namespace.oid = enum_type.typnamespace
  join pg_catalog.pg_enum as enum_value
    on enum_value.enumtypid = enum_type.oid
  where enum_namespace.nspname = 'public'
    and enum_type.typname = 'notification_type';

  if enum_labels is distinct from array[
    'application_status_changed',
    'job_new_applicant',
    'company_verification_request',
    'company_verified',
    'company_rejected'
  ]::text[] then
    raise exception 'notification_type labels mismatch: %', enum_labels;
  end if;

  foreach expected_index in array array[
    'notifications_user_created_idx',
    'notifications_user_unread_idx',
    'notifications_email_pending_created_idx',
    'activity_log_created_idx',
    'activity_log_entity_idx',
    'activity_log_company_created_idx'
  ]
  loop
    if pg_catalog.to_regclass('public.' || expected_index) is null then
      raise exception 'required index public.% is missing', expected_index;
    end if;
  end loop;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.notifications'::pg_catalog.regclass
      and constraint_definition.conname = 'notifications_user_id_fkey'
      and constraint_definition.confdeltype = 'c'
  ) then
    raise exception 'notifications.user_id must use ON DELETE CASCADE';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.activity_log'::pg_catalog.regclass
      and constraint_definition.conname = 'activity_log_actor_id_fkey'
      and constraint_definition.confdeltype = 'a'
  ) then
    raise exception 'activity_log.actor_id must use ON DELETE NO ACTION';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.activity_log'::pg_catalog.regclass
      and constraint_definition.conname = 'activity_log_company_id_fkey'
      and constraint_definition.confdeltype = 'n'
  ) then
    raise exception 'activity_log.company_id must use ON DELETE SET NULL';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as constraint_definition
    where constraint_definition.conrelid = 'public.activity_log'::pg_catalog.regclass
      and constraint_definition.conname = 'activity_log_site_id_fkey'
      and constraint_definition.confdeltype = 'r'
  ) then
    raise exception 'activity_log.site_id must use ON DELETE RESTRICT';
  end if;

  select array_agg(trigger_definition.tgname order by trigger_definition.tgname)
  into actual_triggers
  from pg_catalog.pg_trigger as trigger_definition
  where trigger_definition.tgrelid = 'public.notifications'::pg_catalog.regclass
    and not trigger_definition.tgisinternal;

  if actual_triggers is distinct from array[
    'notifications_guard_deleted_recipient'
  ]::text[] then
    raise exception 'notifications trigger inventory mismatch: %', actual_triggers;
  end if;

  select array_agg(trigger_definition.tgname order by trigger_definition.tgname)
  into actual_triggers
  from pg_catalog.pg_trigger as trigger_definition
  where trigger_definition.tgrelid = 'public.companies'::pg_catalog.regclass
    and not trigger_definition.tgisinternal;

  if actual_triggers is distinct from array[
    'companies_log_created',
    'companies_log_status_changed',
    'companies_log_verification_changed',
    'companies_notify_verification_changed',
    'companies_notify_verification_request',
    'companies_set_updated_at',
    'on_company_created',
    'on_company_resubmit'
  ]::text[] then
    raise exception 'companies trigger inventory mismatch: %', actual_triggers;
  end if;

  select array_agg(trigger_definition.tgname order by trigger_definition.tgname)
  into actual_triggers
  from pg_catalog.pg_trigger as trigger_definition
  where trigger_definition.tgrelid = 'public.profiles'::pg_catalog.regclass
    and not trigger_definition.tgisinternal;

  if actual_triggers is distinct from array[
    'profiles_log_status_changed',
    'profiles_set_updated_at'
  ]::text[] then
    raise exception 'profiles trigger inventory mismatch: %', actual_triggers;
  end if;

  select array_agg(policy.policyname order by policy.policyname)
  into actual_policies
  from pg_catalog.pg_policies as policy
  where policy.schemaname = 'public'
    and policy.tablename = 'notifications';

  if actual_policies is distinct from array[
    'notifications_admin_select',
    'notifications_user_select',
    'notifications_user_update'
  ]::text[] then
    raise exception 'notifications policy inventory mismatch: %', actual_policies;
  end if;

  select array_agg(policy.policyname || ':' || policy.cmd order by policy.policyname)
  into actual_policies
  from pg_catalog.pg_policies as policy
  where policy.schemaname = 'public'
    and policy.tablename = 'activity_log';

  if actual_policies is distinct from array[
    'activity_log_admin_select:SELECT'
  ]::text[] then
    raise exception 'activity_log must have SELECT-only policy inventory, got %', actual_policies;
  end if;

  if not pg_catalog.has_table_privilege(
       'authenticated', 'public.notifications', 'SELECT'
     )
     or not pg_catalog.has_column_privilege(
       'authenticated', 'public.notifications', 'read_at', 'UPDATE'
     )
     or pg_catalog.has_column_privilege(
       'authenticated', 'public.notifications', 'type', 'UPDATE'
     )
     or pg_catalog.has_column_privilege(
       'authenticated', 'public.notifications', 'user_id', 'UPDATE'
     )
     or pg_catalog.has_column_privilege(
       'authenticated', 'public.notifications', 'site_id', 'UPDATE'
     ) then
    raise exception 'notifications client column grants are incorrect';
  end if;

  if pg_catalog.has_table_privilege('anon', 'public.notifications', 'SELECT')
     or pg_catalog.has_table_privilege('anon', 'public.notifications', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.notifications', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.notifications', 'DELETE')
     or pg_catalog.has_table_privilege('authenticated', 'public.notifications', 'TRUNCATE') then
    raise exception 'notifications exposes an unexpected client privilege';
  end if;

  if not pg_catalog.has_table_privilege(
       'authenticated', 'public.activity_log', 'SELECT'
     )
     or pg_catalog.has_table_privilege('anon', 'public.activity_log', 'SELECT')
     or pg_catalog.has_table_privilege('authenticated', 'public.activity_log', 'INSERT')
     or pg_catalog.has_table_privilege('authenticated', 'public.activity_log', 'UPDATE')
     or pg_catalog.has_table_privilege('authenticated', 'public.activity_log', 'DELETE')
     or pg_catalog.has_table_privilege('authenticated', 'public.activity_log', 'TRUNCATE') then
    raise exception 'activity_log append-only grants are incorrect';
  end if;

  foreach tested_role in array array['anon', 'authenticated']
  loop
    if pg_catalog.has_function_privilege(
      tested_role,
      'public.emit_notification(uuid, public.notification_type, smallint, text, uuid, jsonb)',
      'EXECUTE'
    ) then
      raise exception '% must not execute emit_notification', tested_role;
    end if;

    if pg_catalog.has_function_privilege(
      tested_role,
      'public.log_activity(text, text, uuid, smallint, uuid, jsonb)',
      'EXECUTE'
    ) then
      raise exception '% must not execute log_activity', tested_role;
    end if;
  end loop;

  if not exists (
    select 1
    from pg_catalog.pg_proc as function_definition
    where function_definition.oid =
      'public.emit_notification(uuid, public.notification_type, smallint, text, uuid, jsonb)'::pg_catalog.regprocedure
      and function_definition.prosecdef
      and function_definition.proconfig = array['search_path=""']
  ) then
    raise exception 'emit_notification must be SECURITY DEFINER with empty search_path';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_proc as function_definition
    where function_definition.oid =
      'public.log_activity(text, text, uuid, smallint, uuid, jsonb)'::pg_catalog.regprocedure
      and function_definition.prosecdef
      and function_definition.proconfig = array['search_path=""']
  ) then
    raise exception 'log_activity must be SECURITY DEFINER with empty search_path';
  end if;
end;
$$;

do $$
begin
  if exists (select 1 from public.notifications)
     or exists (select 1 from public.activity_log) then
    raise exception 'Phase 1.7 migrations must not seed operational data';
  end if;
end;
$$;

\echo 'Creating rolled-back Phase 1.7 fixtures and exercising source-table triggers'

begin;

insert into public.categories (id, sector_id, slug, name, sort_order)
values (1, 1, 'software', 'Software', 1);

insert into auth.users (id, email, raw_user_meta_data)
values
  ('17000000-0000-4000-8000-000000000001', 'applicant@phase17.test',
   pg_catalog.jsonb_build_object('role', 'job_seeker')),
  ('17000000-0000-4000-8000-000000000002', 'recruiter-a@phase17.test',
   pg_catalog.jsonb_build_object('role', 'recruiter')),
  ('17000000-0000-4000-8000-000000000003', 'recruiter-b@phase17.test',
   pg_catalog.jsonb_build_object('role', 'recruiter')),
  ('17000000-0000-4000-8000-000000000004', 'member-active@phase17.test',
   pg_catalog.jsonb_build_object('role', 'recruiter')),
  ('17000000-0000-4000-8000-000000000005', 'member-deleted@phase17.test',
   pg_catalog.jsonb_build_object('role', 'recruiter')),
  ('17000000-0000-4000-8000-000000000006', 'member-suspended@phase17.test',
   pg_catalog.jsonb_build_object('role', 'recruiter')),
  ('17000000-0000-4000-8000-000000000007', 'admin-one@phase17.test',
   pg_catalog.jsonb_build_object('role', 'job_seeker')),
  ('17000000-0000-4000-8000-000000000008', 'admin-two@phase17.test',
   pg_catalog.jsonb_build_object('role', 'job_seeker')),
  ('17000000-0000-4000-8000-000000000009', 'lifecycle-user@phase17.test',
   pg_catalog.jsonb_build_object('role', 'job_seeker')),
  ('17000000-0000-4000-8000-000000000010', 'system-user@phase17.test',
   pg_catalog.jsonb_build_object('role', 'job_seeker'));

update public.profiles
set role = 'admin'
where id in (
  '17000000-0000-4000-8000-000000000007',
  '17000000-0000-4000-8000-000000000008'
);

set local request.jwt.claims = '';

update public.profiles
set status = 'deleted'
where id = '17000000-0000-4000-8000-000000000005';

update public.profiles
set status = 'suspended'
where id = '17000000-0000-4000-8000-000000000006';

-- Company A is created by recruiter A through the real client grant/RLS path.
alter table public.companies
  alter column id set default '27000000-0000-4000-8000-000000000001'::uuid;

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;

insert into public.companies (name, website, registration_number, created_by)
values (
  'Phase 17 Company A',
  'https://a.phase17.test',
  'P17-A',
  '17000000-0000-4000-8000-000000000002'
);

reset role;
alter table public.companies alter column id set default gen_random_uuid();

do $$
begin
  if (
    select count(*)
    from public.notifications
    where entity_id = '27000000-0000-4000-8000-000000000001'
      and type = 'company_verification_request'
      and site_id is null
      and data = '{"resubmitted": false}'::jsonb
  ) <> 2 then
    raise exception 'fresh company did not notify every admin with resubmitted:false';
  end if;

  if (
    select count(distinct user_id)
    from public.notifications
    where entity_id = '27000000-0000-4000-8000-000000000001'
      and type = 'company_verification_request'
      and data = '{"resubmitted": false}'::jsonb
  ) <> 2 then
    raise exception 'fresh company admin fan-out did not target two distinct admins';
  end if;
end;
$$;

-- Reject, recruiter-resubmit, and verify Company A.
set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000007","role":"authenticated"}';
set local role authenticated;
select public.admin_set_company_verification(
  '27000000-0000-4000-8000-000000000001',
  'rejected',
  'registration mismatch'
);
reset role;

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;
update public.companies
set website = 'https://a-resubmitted.phase17.test'
where id = '27000000-0000-4000-8000-000000000001';
reset role;

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000007","role":"authenticated"}';
set local role authenticated;
select public.admin_set_company_verification(
  '27000000-0000-4000-8000-000000000001',
  'verified',
  null
);
reset role;

do $$
begin
  if (
    select count(*)
    from public.notifications
    where entity_id = '27000000-0000-4000-8000-000000000001'
      and user_id = '17000000-0000-4000-8000-000000000002'
      and type = 'company_rejected'
      and site_id is null
      and data ->> 'reason' = 'registration mismatch'
  ) <> 1 then
    raise exception 'company rejection did not notify the owner with its reason';
  end if;

  if (
    select count(*)
    from public.notifications
    where entity_id = '27000000-0000-4000-8000-000000000001'
      and type = 'company_verification_request'
      and data = '{"resubmitted": true}'::jsonb
  ) <> 2 then
    raise exception 'company resubmit did not notify every admin with resubmitted:true';
  end if;

  if (
    select count(*)
    from public.notifications
    where entity_id = '27000000-0000-4000-8000-000000000001'
      and user_id = '17000000-0000-4000-8000-000000000002'
      and type = 'company_verified'
      and site_id is null
  ) <> 1 then
    raise exception 'company verification did not notify the owner';
  end if;
end;
$$;

-- Company B supplies the deleted-versus-suspended recipient boundary.
alter table public.companies
  alter column id set default '27000000-0000-4000-8000-000000000002'::uuid;

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;
insert into public.companies (name, website, registration_number, created_by)
values (
  'Phase 17 Company B',
  'https://b.phase17.test',
  'P17-B',
  '17000000-0000-4000-8000-000000000003'
);
reset role;
alter table public.companies alter column id set default gen_random_uuid();

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000007","role":"authenticated"}';
set local role authenticated;
select public.admin_set_company_verification(
  '27000000-0000-4000-8000-000000000002',
  'verified',
  null
);
reset role;

insert into public.company_members (company_id, user_id, role)
values
  (
    '27000000-0000-4000-8000-000000000001',
    '17000000-0000-4000-8000-000000000004',
    'member'
  ),
  (
    '27000000-0000-4000-8000-000000000002',
    '17000000-0000-4000-8000-000000000005',
    'member'
  ),
  (
    '27000000-0000-4000-8000-000000000002',
    '17000000-0000-4000-8000-000000000006',
    'member'
  );

-- Insert both jobs through their recruiter client paths so job.created captures
-- the authenticated actor.
alter table public.jobs
  alter column id set default '37000000-0000-4000-8000-000000000001'::uuid;

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;
insert into public.jobs (
  company_id, origin_site_id, category_id, title, description, employment_type
)
values (
  '27000000-0000-4000-8000-000000000001',
  2,
  1,
  'Phase 17 Job A',
  'Two-member fan-out fixture',
  'full_time'
);
reset role;
alter table public.jobs alter column id set default gen_random_uuid();

alter table public.jobs
  alter column id set default '37000000-0000-4000-8000-000000000002'::uuid;

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;
insert into public.jobs (
  company_id, origin_site_id, category_id, title, description, employment_type
)
values (
  '27000000-0000-4000-8000-000000000002',
  2,
  1,
  'Phase 17 Job B',
  'Deleted and suspended recipient fixture',
  'full_time'
);
reset role;
alter table public.jobs alter column id set default gen_random_uuid();

-- Applicant applies through Jooblie to jobs whose origin is the tech site.
alter table public.applications
  alter column id set default '47000000-0000-4000-8000-000000000001'::uuid;

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;
insert into public.applications (
  job_id, resume_path, cover_letter, applied_via_site_id
)
values (
  '37000000-0000-4000-8000-000000000001',
  'resumes/phase17/applicant-a.pdf',
  'Minimal fixture cover letter',
  1
);
reset role;
alter table public.applications alter column id set default gen_random_uuid();

alter table public.applications
  alter column id set default '47000000-0000-4000-8000-000000000002'::uuid;

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;
insert into public.applications (
  job_id, resume_path, cover_letter, applied_via_site_id
)
values (
  '37000000-0000-4000-8000-000000000002',
  'resumes/phase17/applicant-b.pdf',
  'Second fixture cover letter',
  1
);
reset role;
alter table public.applications alter column id set default gen_random_uuid();

do $$
begin
  if (
    select count(*)
    from public.notifications
    where entity_id = '47000000-0000-4000-8000-000000000001'
      and type = 'job_new_applicant'
      and site_id = 2
      and data = pg_catalog.jsonb_build_object(
        'job_id', '37000000-0000-4000-8000-000000000001'::uuid
      )
  ) <> 2 then
    raise exception 'FIX 3 expected exactly 2 origin-site notifications for a two-member company';
  end if;

  if (
    select count(distinct user_id)
    from public.notifications
    where entity_id = '47000000-0000-4000-8000-000000000001'
      and type = 'job_new_applicant'
  ) <> 2 then
    raise exception 'FIX 3 fan-out did not execute once per distinct company member';
  end if;

  if exists (
    select 1
    from public.notifications
    where entity_id = '47000000-0000-4000-8000-000000000002'
      and user_id = '17000000-0000-4000-8000-000000000005'
      and type = 'job_new_applicant'
  ) then
    raise exception 'FIX B deleted member received a new-applicant notification';
  end if;

  if (
    select count(*)
    from public.notifications
    where entity_id = '47000000-0000-4000-8000-000000000002'
      and user_id = '17000000-0000-4000-8000-000000000006'
      and type = 'job_new_applicant'
      and site_id = 2
  ) <> 1 then
    raise exception 'suspended member did not receive exactly one new-applicant notification';
  end if;

  if (
    select count(*)
    from public.notifications
    where entity_id = '47000000-0000-4000-8000-000000000002'
      and type = 'job_new_applicant'
  ) <> 2 then
    raise exception 'deleted-only guard expected owner plus suspended member notifications';
  end if;
end;
$$;

\echo 'Exercising recruiter status notification and seeker self-withdraw skip'

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;
update public.applications
set status = 'shortlisted'
where id = '47000000-0000-4000-8000-000000000001';
reset role;

do $$
begin
  if (
    select count(*)
    from public.notifications
    where entity_id = '47000000-0000-4000-8000-000000000001'
      and user_id = '17000000-0000-4000-8000-000000000001'
      and type = 'application_status_changed'
      and site_id = 1
      and data ->> 'old' = 'submitted'
      and data ->> 'new' = 'shortlisted'
  ) <> 1 then
    raise exception 'recruiter status change did not notify applicant with applied-via site and old/new data';
  end if;
end;
$$;

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;
update public.applications
set status = 'withdrawn'
where id = '47000000-0000-4000-8000-000000000001';
reset role;

do $$
begin
  if (
    select count(*)
    from public.notifications
    where entity_id = '47000000-0000-4000-8000-000000000001'
      and user_id = '17000000-0000-4000-8000-000000000001'
      and type = 'application_status_changed'
  ) <> 1 then
    raise exception 'seeker self-withdraw created applicant notification';
  end if;
end;
$$;

\echo 'Exercising remaining audit actions and actor attribution'

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000007","role":"authenticated"}';
set local role authenticated;
select public.admin_set_company_status(
  '27000000-0000-4000-8000-000000000001', 'suspended'
);
select public.admin_set_company_status(
  '27000000-0000-4000-8000-000000000001', 'active'
);
reset role;

-- Profile moderation has no v1 client grant/RPC yet. Keep the admin JWT while
-- running the source-table update as the database owner so the audit trigger
-- still proves actor attribution for the future privileged path.
set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000007","role":"authenticated"}';
update public.profiles
set status = 'suspended'
where id = '17000000-0000-4000-8000-000000000009';
update public.profiles
set status = 'active'
where id = '17000000-0000-4000-8000-000000000009';
update public.profiles
set status = 'deleted'
where id = '17000000-0000-4000-8000-000000000009';

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000002","role":"authenticated"}';
update public.jobs
set status = 'closed'
where id = '37000000-0000-4000-8000-000000000001';

set local request.jwt.claims = '';
update public.jobs
set status = 'expired'
where id = '37000000-0000-4000-8000-000000000002';
update public.profiles
set status = 'suspended'
where id = '17000000-0000-4000-8000-000000000010';

do $$
begin
  if not exists (
    select 1 from public.activity_log
    where action = 'job.created'
      and entity_id = '37000000-0000-4000-8000-000000000001'
      and actor_id = '17000000-0000-4000-8000-000000000002'
      and site_id = 2
      and company_id = '27000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'job.created audit row or actor/site/company context is incorrect';
  end if;

  if not exists (
    select 1 from public.activity_log
    where action = 'job.status_changed'
      and entity_id = '37000000-0000-4000-8000-000000000001'
      and actor_id = '17000000-0000-4000-8000-000000000002'
      and data ->> 'old' = 'active'
      and data ->> 'new' = 'closed'
  ) then
    raise exception 'job.status_changed audit row lacks JWT actor or old/new data';
  end if;

  if not exists (
    select 1 from public.activity_log
    where action = 'job.status_changed'
      and entity_id = '37000000-0000-4000-8000-000000000002'
      and actor_id is null
      and data ->> 'old' = 'active'
      and data ->> 'new' = 'expired'
  ) then
    raise exception 'no-JWT system job transition did not record actor_id NULL';
  end if;

  if not exists (
    select 1 from public.activity_log
    where action = 'application.submitted'
      and entity_id = '47000000-0000-4000-8000-000000000001'
      and actor_id = '17000000-0000-4000-8000-000000000001'
      and site_id = 1
      and company_id = '27000000-0000-4000-8000-000000000001'
  ) then
    raise exception 'application.submitted audit row is incorrect';
  end if;

  if (
    select count(*) from public.activity_log
    where action = 'application.status_changed'
      and entity_id = '47000000-0000-4000-8000-000000000001'
      and (
        (
          actor_id = '17000000-0000-4000-8000-000000000002'
          and data ->> 'old' = 'submitted'
          and data ->> 'new' = 'shortlisted'
        )
        or (
          actor_id = '17000000-0000-4000-8000-000000000001'
          and data ->> 'old' = 'shortlisted'
          and data ->> 'new' = 'withdrawn'
        )
      )
  ) <> 2 then
    raise exception 'application.status_changed audit history is incomplete';
  end if;

  if not exists (
    select 1 from public.activity_log
    where action = 'company.created'
      and entity_id = '27000000-0000-4000-8000-000000000001'
      and actor_id = '17000000-0000-4000-8000-000000000002'
  ) then
    raise exception 'company.created audit row is incorrect';
  end if;

  if not exists (
    select 1 from public.activity_log
    where action = 'company.rejected'
      and entity_id = '27000000-0000-4000-8000-000000000001'
      and actor_id = '17000000-0000-4000-8000-000000000007'
      and data ->> 'reason' = 'registration mismatch'
  ) then
    raise exception 'company.rejected audit row is incorrect';
  end if;

  if not exists (
    select 1 from public.activity_log
    where action = 'company.resubmitted'
      and entity_id = '27000000-0000-4000-8000-000000000001'
      and actor_id = '17000000-0000-4000-8000-000000000002'
      and data ->> 'old' = 'rejected'
      and data ->> 'new' = 'pending'
  ) then
    raise exception 'company.resubmitted audit row is incorrect';
  end if;

  if not exists (
    select 1 from public.activity_log
    where action = 'company.verified'
      and entity_id = '27000000-0000-4000-8000-000000000001'
      and actor_id = '17000000-0000-4000-8000-000000000007'
  ) then
    raise exception 'company.verified audit row is incorrect';
  end if;

  if (
    select count(*) from public.activity_log
    where entity_id = '27000000-0000-4000-8000-000000000001'
      and actor_id = '17000000-0000-4000-8000-000000000007'
      and action in ('company.suspended', 'company.unsuspended')
  ) <> 2 then
    raise exception 'company suspension audit pair is incomplete';
  end if;

  if (
    select count(*) from public.activity_log
    where entity_id = '17000000-0000-4000-8000-000000000009'
      and actor_id = '17000000-0000-4000-8000-000000000007'
      and action in ('user.suspended', 'user.unsuspended', 'user.deleted')
  ) <> 3 then
    raise exception 'user suspended/unsuspended/deleted audit actions are incomplete';
  end if;

  if not exists (
    select 1 from public.activity_log
    where action = 'user.suspended'
      and entity_id = '17000000-0000-4000-8000-000000000010'
      and actor_id is null
  ) then
    raise exception 'no-JWT system user transition did not record actor_id NULL';
  end if;
end;
$$;

do $$
begin
  if (select count(*) from public.notifications) <> 14 then
    raise exception 'expected 14 total notification rows, got %',
      (select count(*) from public.notifications);
  end if;
end;
$$;

\echo 'Exercising notification RLS, column grants, and activity append-only denial'

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

do $$
declare
  affected_rows integer;
begin
  if (select count(*) from public.notifications) <> 1 then
    raise exception 'notification user RLS did not isolate the applicant row';
  end if;

  if (select count(*) from public.activity_log) <> 0 then
    raise exception 'non-admin read raw activity_log rows';
  end if;

  update public.notifications
  set read_at = pg_catalog.now()
  where type = 'application_status_changed';

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'notification owner could not mark exactly one row read';
  end if;

  begin
    update public.notifications
    set type = 'company_verified'
    where type = 'application_status_changed';
    raise exception 'client UPDATE(type) unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.notifications
    set user_id = '17000000-0000-4000-8000-000000000004'
    where type = 'application_status_changed';
    raise exception 'client UPDATE(user_id) unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.notifications
    set site_id = 2
    where type = 'application_status_changed';
    raise exception 'client UPDATE(site_id) unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into public.notifications (
      user_id, type, site_id, entity_type, entity_id
    ) values (
      '17000000-0000-4000-8000-000000000001',
      'company_verified',
      null,
      'company',
      '27000000-0000-4000-8000-000000000001'
    );
    raise exception 'client notification INSERT unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.activity_log set data = '{}'::jsonb;
    raise exception 'client activity_log UPDATE unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    delete from public.activity_log;
    raise exception 'client activity_log DELETE unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

set local request.jwt.claims =
  '{"sub":"17000000-0000-4000-8000-000000000007","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if (select count(*) from public.notifications) <> 14 then
    raise exception 'admin notification SELECT did not expose every row';
  end if;

  if not exists (
    select 1 from public.activity_log where action = 'job.created'
  ) then
    raise exception 'admin cannot read activity_log';
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
    execute 'select count(*) from public.notifications' into visible_rows;
    if visible_rows <> 0 then
      raise exception 'anon saw % notification rows', visible_rows;
    end if;
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

rollback;

do $$
begin
  if exists (select 1 from public.notifications)
     or exists (select 1 from public.activity_log)
     or exists (select 1 from public.applications)
     or exists (select 1 from public.jobs)
     or exists (select 1 from public.companies) then
    raise exception 'Phase 1.7 test data leaked outside its transaction';
  end if;
end;
$$;

\echo 'Phase 1.7 notification and activity-log assertions passed'
