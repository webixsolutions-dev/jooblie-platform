\set ON_ERROR_STOP on

-- Phase 1.8 storage tests insert storage.objects rows directly under explicit
-- database roles and JWT claims. This exercises the policy layer; it does not
-- exercise the Storage HTTP upload/download path or MIME/content validation.
--
-- Mutation-proof targets:
--   MA making the resumes bucket public fails the private-bucket assertion;
--   MB replacing can_access_resume() with true leaks a resume to an unrelated
--      recruiter;
--   MC removing is_resume_referenced() from owner DELETE destroys an
--      application resume snapshot;
--   MD removing the auth.uid() folder check permits a cross-folder upload.

\echo 'Asserting Phase 1.8 storage buckets, helpers, and policy inventory'

do $$
declare
  actual_policies text[];
  expected_function text;
begin
  if (
    select count(*)
    from storage.buckets
    where id in ('resumes', 'company-logos', 'verification-docs')
  ) <> 3 then
    raise exception 'Phase 1.8 storage bucket inventory is incomplete';
  end if;

  if not exists (
    select 1
    from storage.buckets
    where id = 'resumes'
      and name = 'resumes'
      and public = false
      and file_size_limit = 5242880
      and allowed_mime_types = array[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]::text[]
  ) then
    raise exception 'MA resumes bucket must be private with the approved limits';
  end if;

  if not exists (
    select 1
    from storage.buckets
    where id = 'company-logos'
      and name = 'company-logos'
      and public = true
      and file_size_limit = 2097152
      and allowed_mime_types = array[
        'image/png',
        'image/jpeg',
        'image/webp'
      ]::text[]
  ) then
    raise exception 'company-logos bucket contract mismatch';
  end if;

  if not exists (
    select 1
    from storage.buckets
    where id = 'verification-docs'
      and name = 'verification-docs'
      and public = false
      and file_size_limit = 10485760
      and allowed_mime_types = array[
        'application/pdf',
        'image/png',
        'image/jpeg'
      ]::text[]
  ) then
    raise exception 'verification-docs bucket contract mismatch';
  end if;

  foreach expected_function in array array[
    'public.is_resume_referenced(text)',
    'public.can_access_resume(text)',
    'public.is_company_member_path(text)',
    'public.can_delete_verification_document(text)'
  ]
  loop
    if not exists (
      select 1
      from pg_catalog.pg_proc as function_definition
      where function_definition.oid = expected_function::pg_catalog.regprocedure
        and function_definition.provolatile = 's'
        and function_definition.prosecdef
        and function_definition.proconfig = array['search_path=""']
    ) then
      raise exception '% must be STABLE SECURITY DEFINER with empty search_path',
        expected_function;
    end if;
  end loop;

  select array_agg(policy.policyname order by policy.policyname)
  into actual_policies
  from pg_catalog.pg_policies as policy
  where policy.schemaname = 'storage'
    and policy.tablename = 'objects';

  if actual_policies is distinct from array[
    'company-logos_company_member_delete',
    'company-logos_company_member_insert',
    'company-logos_company_member_update',
    'company-logos_public_select',
    'resumes_admin_select',
    'resumes_job_seeker_insert',
    'resumes_owner_delete',
    'resumes_owner_select',
    'resumes_owner_update',
    'resumes_recruiter_select',
    'verification-docs_admin_select',
    'verification-docs_company_member_delete',
    'verification-docs_company_member_insert',
    'verification-docs_company_member_select',
    'verification-docs_company_member_update'
  ]::text[] then
    raise exception 'storage.objects policy inventory mismatch: %', actual_policies;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_policies as policy
    where policy.schemaname = 'storage'
      and policy.tablename = 'objects'
      and (
        coalesce(policy.qual, '') like '%::uuid%'
        or coalesce(policy.with_check, '') like '%::uuid%'
      )
  ) then
    raise exception 'storage.objects policy expressions must not contain raw UUID casts';
  end if;

  if public.is_company_member_path('not-a-uuid')
     or public.can_delete_verification_document('not-a-uuid') then
    raise exception 'malformed company path segments must safely deny';
  end if;
end;
$$;

\echo 'Creating rolled-back Phase 1.8 storage fixtures'

begin;

-- This local Storage version protects direct DELETE statements with a
-- statement trigger unless its own API-session flag is set. The flag disables
-- only that trigger guard; storage.objects RLS remains enabled and is the layer
-- asserted below.
set local storage.allow_delete_query = 'true';

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '18000000-0000-4000-8000-000000000001',
    'storage-seeker@phase18.test',
    jsonb_build_object('role', 'job_seeker')
  ),
  (
    '18000000-0000-4000-8000-000000000002',
    'storage-other-seeker@phase18.test',
    jsonb_build_object('role', 'job_seeker')
  ),
  (
    '18000000-0000-4000-8000-000000000003',
    'storage-suspended-seeker@phase18.test',
    jsonb_build_object('role', 'job_seeker')
  ),
  (
    '18000000-0000-4000-8000-000000000004',
    'storage-recruiter-a@phase18.test',
    jsonb_build_object('role', 'recruiter')
  ),
  (
    '18000000-0000-4000-8000-000000000005',
    'storage-recruiter-b@phase18.test',
    jsonb_build_object('role', 'recruiter')
  ),
  (
    '18000000-0000-4000-8000-000000000006',
    'storage-admin@phase18.test',
    jsonb_build_object('role', 'job_seeker')
  ),
  (
    '18000000-0000-4000-8000-000000000007',
    'storage-suspended-recruiter@phase18.test',
    jsonb_build_object('role', 'recruiter')
  );

update public.profiles
set role = 'admin'
where id = '18000000-0000-4000-8000-000000000006';

update public.profiles
set status = 'suspended'
where id in (
  '18000000-0000-4000-8000-000000000003',
  '18000000-0000-4000-8000-000000000007'
);

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
    '28000000-0000-4000-8000-000000000001',
    'Phase 18 Verified Company',
    'https://verified.phase18.test',
    'P18-VERIFIED',
    'verified',
    pg_catalog.now(),
    '18000000-0000-4000-8000-000000000006',
    'active',
    '18000000-0000-4000-8000-000000000004'
  ),
  (
    '28000000-0000-4000-8000-000000000002',
    'Phase 18 Pending Company',
    'https://pending.phase18.test',
    'P18-PENDING',
    'pending',
    null,
    null,
    'active',
    '18000000-0000-4000-8000-000000000005'
  ),
  (
    '28000000-0000-4000-8000-000000000003',
    'Phase 18 Deleted Company',
    'https://deleted.phase18.test',
    'P18-DELETED',
    'verified',
    pg_catalog.now(),
    '18000000-0000-4000-8000-000000000006',
    'active',
    '18000000-0000-4000-8000-000000000004'
  );

update public.companies
set deleted_at = pg_catalog.now()
where id = '28000000-0000-4000-8000-000000000003';

insert into public.company_members (company_id, user_id, role)
values (
  '28000000-0000-4000-8000-000000000001',
  '18000000-0000-4000-8000-000000000007',
  'member'
);

insert into public.jobs (
  id,
  company_id,
  origin_site_id,
  created_by,
  category_id,
  title,
  description,
  employment_type
)
values
  (
    '38000000-0000-4000-8000-000000000001',
    '28000000-0000-4000-8000-000000000001',
    1,
    '18000000-0000-4000-8000-000000000004',
    101,
    'Referenced resume job',
    'Phase 1.8 storage fixture',
    'full_time'
  ),
  (
    '38000000-0000-4000-8000-000000000002',
    '28000000-0000-4000-8000-000000000001',
    1,
    '18000000-0000-4000-8000-000000000004',
    101,
    'Revocable resume access job',
    'Phase 1.8 storage fixture',
    'full_time'
  ),
  (
    '38000000-0000-4000-8000-000000000003',
    '28000000-0000-4000-8000-000000000001',
    1,
    '18000000-0000-4000-8000-000000000004',
    101,
    'Protected update target job',
    'Phase 1.8 storage fixture',
    'full_time'
  );

insert into public.applications (
  id,
  job_id,
  applicant_id,
  resume_path,
  applied_via_site_id
)
values
  (
    '48000000-0000-4000-8000-000000000001',
    '38000000-0000-4000-8000-000000000001',
    '18000000-0000-4000-8000-000000000001',
    '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1-resume.pdf',
    1
  ),
  (
    '48000000-0000-4000-8000-000000000002',
    '38000000-0000-4000-8000-000000000002',
    '18000000-0000-4000-8000-000000000001',
    '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2-revocable.pdf',
    1
  ),
  (
    '48000000-0000-4000-8000-000000000003',
    '38000000-0000-4000-8000-000000000003',
    '18000000-0000-4000-8000-000000000001',
    '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5-protected-target.pdf',
    1
  );

-- These direct rows model records the Storage service would create. Individual
-- policy tests below perform client operations under anon/authenticated roles.
insert into storage.objects (bucket_id, name, metadata)
values
  (
    'resumes',
    '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1-resume.pdf',
    '{"mimetype":"application/pdf"}'
  ),
  (
    'resumes',
    '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2-revocable.pdf',
    '{"mimetype":"application/pdf"}'
  ),
  (
    'resumes',
    '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3-unreferenced.pdf',
    '{"mimetype":"application/pdf"}'
  ),
  (
    'company-logos',
    '28000000-0000-4000-8000-000000000001/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1-logo.png',
    '{"mimetype":"image/png"}'
  ),
  (
    'verification-docs',
    '28000000-0000-4000-8000-000000000001/cccccccc-cccc-4ccc-8ccc-ccccccccccc1-proof.pdf',
    '{"mimetype":"application/pdf"}'
  ),
  (
    'verification-docs',
    '28000000-0000-4000-8000-000000000001/cccccccc-cccc-4ccc-8ccc-ccccccccccc2-delete.pdf',
    '{"mimetype":"application/pdf"}'
  ),
  (
    'verification-docs',
    '28000000-0000-4000-8000-000000000002/cccccccc-cccc-4ccc-8ccc-ccccccccccc3-pending.pdf',
    '{"mimetype":"application/pdf"}'
  );

\echo 'Asserting seeker resume upload, overwrite, and delete boundaries'

set local request.jwt.claims = '{"sub":"18000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

insert into storage.objects (bucket_id, name, metadata)
values (
  'resumes',
  '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4-own-upload.pdf',
  '{"mimetype":"application/pdf"}'
);

do $$
declare
  affected_rows integer;
begin
  if not exists (
    select 1
    from storage.objects
    where bucket_id = 'resumes'
      and name = '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4-own-upload.pdf'
  ) then
    raise exception 'seeker own-folder upload was not visible to its owner';
  end if;

  begin
    insert into storage.objects (bucket_id, name, metadata)
    values (
      'resumes',
      '18000000-0000-4000-8000-000000000002/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6-cross-folder.pdf',
      '{"mimetype":"application/pdf"}'
    );
    raise exception 'MD seeker cross-folder upload unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  update storage.objects
  set metadata = '{"mimetype":"application/pdf","updated":true}'
  where bucket_id = 'resumes'
    and name = '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1-resume.pdf';
  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'referenced resume UPDATE USING guard allowed overwrite';
  end if;

  begin
    update storage.objects
    set name = '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5-protected-target.pdf'
    where bucket_id = 'resumes'
      and name = '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4-own-upload.pdf';
    raise exception 'referenced resume UPDATE WITH CHECK guard allowed overwrite';
  exception
    when insufficient_privilege then null;
  end;

  delete from storage.objects
  where bucket_id = 'resumes'
    and name = '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3-unreferenced.pdf';
  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'owner could not delete one unreferenced resume';
  end if;

  delete from storage.objects
  where bucket_id = 'resumes'
    and name = '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1-resume.pdf';
  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'MC owner deleted an application-referenced resume';
  end if;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"18000000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;

do $$
begin
  begin
    insert into storage.objects (bucket_id, name, metadata)
    values (
      'resumes',
      '18000000-0000-4000-8000-000000000003/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7-suspended.pdf',
      '{"mimetype":"application/pdf"}'
    );
    raise exception 'suspended seeker resume upload unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

\echo 'Asserting anonymous private/public bucket reads'

set local request.jwt.claims = '';
set local role anon;

do $$
begin
  if exists (
    select 1
    from storage.objects
    where bucket_id = 'resumes'
  ) then
    raise exception 'MA anon read a private resume object';
  end if;

  if not exists (
    select 1
    from storage.objects
    where bucket_id = 'company-logos'
      and name = '28000000-0000-4000-8000-000000000001/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1-logo.png'
  ) then
    raise exception 'anon could not read a company logo';
  end if;

  if exists (
    select 1
    from storage.objects
    where bucket_id = 'verification-docs'
  ) then
    raise exception 'anon read a private verification document';
  end if;
end;
$$;

reset role;

\echo 'Asserting unrelated recruiter and malformed company-path denials'

set local request.jwt.claims = '{"sub":"18000000-0000-4000-8000-000000000005","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if exists (
    select 1
    from storage.objects
    where bucket_id = 'resumes'
      and name = '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1-resume.pdf'
  ) then
    raise exception 'MB unrelated recruiter read an applicant resume';
  end if;

  if exists (
    select 1
    from storage.objects
    where bucket_id = 'verification-docs'
      and name = '28000000-0000-4000-8000-000000000001/cccccccc-cccc-4ccc-8ccc-ccccccccccc1-proof.pdf'
  ) then
    raise exception 'non-member recruiter read another company verification document';
  end if;

  begin
    insert into storage.objects (bucket_id, name, metadata)
    values (
      'company-logos',
      '28000000-0000-4000-8000-000000000001/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2-nonmember.png',
      '{"mimetype":"image/png"}'
    );
    raise exception 'non-member company-logo write unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    insert into storage.objects (bucket_id, name, metadata)
    values (
      'company-logos',
      'not-a-uuid/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3-malformed.png',
      '{"mimetype":"image/png"}'
    );
    raise exception 'malformed company path unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

\echo 'Asserting applied-to recruiter resume access and company-member writes'

set local request.jwt.claims = '{"sub":"18000000-0000-4000-8000-000000000004","role":"authenticated"}';
set local role authenticated;

do $$
declare
  affected_rows integer;
begin
  if (
    select count(*)
    from storage.objects
    where bucket_id = 'resumes'
      and name in (
        '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1-resume.pdf',
        '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2-revocable.pdf'
      )
  ) <> 2 then
    raise exception 'applied-to recruiter could not read both exact application resumes';
  end if;

  insert into storage.objects (bucket_id, name, metadata)
  values (
    'company-logos',
    '28000000-0000-4000-8000-000000000001/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4-member.png',
    '{"mimetype":"image/png"}'
  );

  if not exists (
    select 1
    from storage.objects
    where bucket_id = 'verification-docs'
      and name = '28000000-0000-4000-8000-000000000001/cccccccc-cccc-4ccc-8ccc-ccccccccccc1-proof.pdf'
  ) then
    raise exception 'company member could not read own verification document';
  end if;

  update storage.objects
  set metadata = '{"mimetype":"application/pdf","review-copy":true}'
  where bucket_id = 'verification-docs'
    and name = '28000000-0000-4000-8000-000000000001/cccccccc-cccc-4ccc-8ccc-ccccccccccc1-proof.pdf';
  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'company member could not update own verification document';
  end if;

  delete from storage.objects
  where bucket_id = 'verification-docs'
    and name = '28000000-0000-4000-8000-000000000001/cccccccc-cccc-4ccc-8ccc-ccccccccccc2-delete.pdf';
  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'verified company member could not delete own evidence';
  end if;

  begin
    insert into storage.objects (bucket_id, name, metadata)
    values (
      'company-logos',
      '28000000-0000-4000-8000-000000000003/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5-deleted.png',
      '{"mimetype":"image/png"}'
    );
    raise exception 'soft-deleted company retained storage write access';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

reset role;

\echo 'Asserting pending-review evidence deletion is blocked'

set local request.jwt.claims = '{"sub":"18000000-0000-4000-8000-000000000005","role":"authenticated"}';
set local role authenticated;

do $$
declare
  affected_rows integer;
begin
  if not exists (
    select 1
    from storage.objects
    where bucket_id = 'verification-docs'
      and name = '28000000-0000-4000-8000-000000000002/cccccccc-cccc-4ccc-8ccc-ccccccccccc3-pending.pdf'
  ) then
    raise exception 'pending company member could not read own evidence';
  end if;

  delete from storage.objects
  where bucket_id = 'verification-docs'
    and name = '28000000-0000-4000-8000-000000000002/cccccccc-cccc-4ccc-8ccc-ccccccccccc3-pending.pdf';
  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'pending company member deleted evidence during review';
  end if;
end;
$$;

reset role;

\echo 'Asserting suspended recruiter and admin private-object reads'

set local request.jwt.claims = '{"sub":"18000000-0000-4000-8000-000000000007","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if exists (
    select 1
    from storage.objects
    where bucket_id = 'resumes'
      and name = '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1-resume.pdf'
  ) then
    raise exception 'suspended recruiter read an applicant resume';
  end if;
end;
$$;

reset role;

set local request.jwt.claims = '{"sub":"18000000-0000-4000-8000-000000000006","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if not exists (
    select 1
    from storage.objects
    where bucket_id = 'resumes'
      and name = '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1-resume.pdf'
  ) then
    raise exception 'admin could not read an applicant resume';
  end if;

  if (
    select count(*)
    from storage.objects
    where bucket_id = 'verification-docs'
  ) <> 2 then
    raise exception 'admin could not read all remaining verification documents';
  end if;
end;
$$;

reset role;

\echo 'Asserting recruiter access disappears with the application row'

delete from public.applications
where id = '48000000-0000-4000-8000-000000000002';

set local request.jwt.claims = '{"sub":"18000000-0000-4000-8000-000000000004","role":"authenticated"}';
set local role authenticated;

do $$
begin
  if exists (
    select 1
    from storage.objects
    where bucket_id = 'resumes'
      and name = '18000000-0000-4000-8000-000000000001/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2-revocable.pdf'
  ) then
    raise exception 'recruiter retained resume access after application deletion';
  end if;
end;
$$;

reset role;

rollback;

\echo 'Phase 1.8 storage policy checks passed'
