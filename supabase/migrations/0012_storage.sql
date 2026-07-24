-- Phase 1.8-slim: migration-owned Storage buckets and per-operation access
-- policies. Object ownership is derived exclusively from the first path segment.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'resumes',
    'resumes',
    false,
    5242880,
    array[
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
  ),
  (
    'company-logos',
    'company-logos',
    true,
    2097152,
    array[
      'image/png',
      'image/jpeg',
      'image/webp'
    ]::text[]
  ),
  (
    'verification-docs',
    'verification-docs',
    false,
    10485760,
    array[
      'application/pdf',
      'image/png',
      'image/jpeg'
    ]::text[]
  );

-- Application resume snapshots are an audit trail. A default profile pointer is
-- deliberately not considered a reference and must be cleared by the upload UI
-- when its object is deleted.
create function public.is_resume_referenced(_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications as application
    where application.resume_path = _path
  );
$$;

-- Resume reads are granted per exact application snapshot, never by applicant
-- folder. The caller must currently belong to the applied-to job's company.
create function public.can_access_resume(_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.applications as application
    join public.jobs as job on job.id = application.job_id
    where application.resume_path = _path
      and public.is_company_member(job.company_id)
  );
$$;

-- Company-scoped object policies receive an untrusted text path segment. Parse
-- it inside a definer helper so malformed UUIDs deny access instead of raising,
-- and require the resolved company to remain non-deleted.
create function public.is_company_member_path(_segment text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  _company_id uuid;
begin
  begin
    _company_id := _segment::uuid;
  exception
    when others then
      return false;
  end;

  return exists (
    select 1
    from public.companies as company
    where company.id = _company_id
      and company.deleted_at is null
      and public.is_company_member(company.id)
  );
end;
$$;

-- Company evidence may not be removed while an admin review is pending. This
-- helper also safe-parses the untrusted first path segment.
create function public.can_delete_verification_document(_segment text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  _company_id uuid;
begin
  begin
    _company_id := _segment::uuid;
  exception
    when others then
      return false;
  end;

  return exists (
    select 1
    from public.companies as company
    where company.id = _company_id
      and company.deleted_at is null
      and company.verification_status <> 'pending'
      and public.is_company_member(company.id)
  );
end;
$$;

-- resumes: private, with no anon policy.
create policy resumes_job_seeker_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not public.is_recruiter()
  and not public.is_admin()
  and not public.is_suspended()
);

create policy resumes_owner_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy resumes_owner_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not public.is_resume_referenced(name)
)
with check (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not public.is_resume_referenced(name)
);

create policy resumes_owner_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'resumes'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not public.is_resume_referenced(name)
);

create policy resumes_recruiter_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resumes'
  and public.is_recruiter()
  and public.can_access_resume(name)
  and not public.is_suspended()
);

create policy resumes_admin_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'resumes'
  and public.is_admin()
);

-- company-logos: public read, company-member writes.
create policy "company-logos_public_select"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'company-logos');

create policy "company-logos_company_member_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'company-logos'
  and public.is_company_member_path((storage.foldername(name))[1])
  and not public.is_suspended()
);

create policy "company-logos_company_member_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'company-logos'
  and public.is_company_member_path((storage.foldername(name))[1])
  and not public.is_suspended()
)
with check (
  bucket_id = 'company-logos'
  and public.is_company_member_path((storage.foldername(name))[1])
  and not public.is_suspended()
);

create policy "company-logos_company_member_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'company-logos'
  and public.is_company_member_path((storage.foldername(name))[1])
  and not public.is_suspended()
);

-- verification-docs: private, with no anon policy.
create policy "verification-docs_company_member_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'verification-docs'
  and public.is_company_member_path((storage.foldername(name))[1])
  and not public.is_suspended()
);

create policy "verification-docs_company_member_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'verification-docs'
  and public.is_company_member_path((storage.foldername(name))[1])
  and not public.is_suspended()
);

create policy "verification-docs_company_member_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'verification-docs'
  and public.is_company_member_path((storage.foldername(name))[1])
  and not public.is_suspended()
)
with check (
  bucket_id = 'verification-docs'
  and public.is_company_member_path((storage.foldername(name))[1])
  and not public.is_suspended()
);

create policy "verification-docs_company_member_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'verification-docs'
  and public.can_delete_verification_document((storage.foldername(name))[1])
  and not public.is_suspended()
);

create policy "verification-docs_admin_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'verification-docs'
  and public.is_admin()
);
