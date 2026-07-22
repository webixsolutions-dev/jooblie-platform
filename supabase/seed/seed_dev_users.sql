-- DEV/STAGING ONLY. Never apply this file to production.
--
-- This file is intentionally outside supabase/migrations and is not listed in
-- supabase/config.toml [db.seed]. CI reset/db-push therefore never executes it.
-- Apply it explicitly to a disposable local or staging database with psql.
--
-- Fixed password for every user below: JooblieDev123!

begin;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'd1000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'seeker@jooblie.local',
    crypt('JooblieDev123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"job_seeker","site":"jooblie"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd1000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'recruiter.verified@jooblie.local',
    crypt('JooblieDev123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"recruiter","site":"jooblie"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd1000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'recruiter.pending@jooblie.local',
    crypt('JooblieDev123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"recruiter","site":"jooblie"}'::jsonb,
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'd1000000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'admin@jooblie.local',
    crypt('JooblieDev123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"role":"job_seeker","site":"jooblie"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    'e1000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000001',
    '{"sub":"d1000000-0000-4000-8000-000000000001","email":"seeker@jooblie.local","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    'e1000000-0000-4000-8000-000000000002',
    'd1000000-0000-4000-8000-000000000002',
    'd1000000-0000-4000-8000-000000000002',
    '{"sub":"d1000000-0000-4000-8000-000000000002","email":"recruiter.verified@jooblie.local","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    'e1000000-0000-4000-8000-000000000003',
    'd1000000-0000-4000-8000-000000000003',
    'd1000000-0000-4000-8000-000000000003',
    '{"sub":"d1000000-0000-4000-8000-000000000003","email":"recruiter.pending@jooblie.local","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  ),
  (
    'e1000000-0000-4000-8000-000000000004',
    'd1000000-0000-4000-8000-000000000004',
    'd1000000-0000-4000-8000-000000000004',
    '{"sub":"d1000000-0000-4000-8000-000000000004","email":"admin@jooblie.local","email_verified":true,"phone_verified":false}'::jsonb,
    'email',
    now(),
    now(),
    now()
  )
on conflict (provider_id, provider) do nothing;

update public.profiles
set full_name = case id
      when 'd1000000-0000-4000-8000-000000000001' then 'Dev Job Seeker'
      when 'd1000000-0000-4000-8000-000000000002' then 'Dev Verified Recruiter'
      when 'd1000000-0000-4000-8000-000000000003' then 'Dev Pending Recruiter'
      when 'd1000000-0000-4000-8000-000000000004' then 'Dev Admin'
    end,
    role = case
      when id = 'd1000000-0000-4000-8000-000000000004' then 'admin'::public.user_role
      else role
    end
where id in (
  'd1000000-0000-4000-8000-000000000001',
  'd1000000-0000-4000-8000-000000000002',
  'd1000000-0000-4000-8000-000000000003',
  'd1000000-0000-4000-8000-000000000004'
);

insert into public.companies (
  id,
  name,
  website,
  registration_number,
  description,
  verification_status,
  verified_at,
  verified_by,
  status,
  created_by
)
values
  (
    'd2000000-0000-4000-8000-000000000001',
    'Northstar Digital Inc.',
    'https://northstar.example',
    'DEV-VERIFIED-001',
    'Verified development company used by local frontend fixtures.',
    'verified',
    now(),
    'd1000000-0000-4000-8000-000000000004',
    'active',
    'd1000000-0000-4000-8000-000000000002'
  ),
  (
    'd2000000-0000-4000-8000-000000000002',
    'Maple Pending Co.',
    'https://maple-pending.example',
    'DEV-PENDING-001',
    'Pending development company used by local verification screens.',
    'pending',
    null,
    null,
    'active',
    'd1000000-0000-4000-8000-000000000003'
  )
on conflict (id) do nothing;

insert into public.jobs (
  id,
  company_id,
  origin_site_id,
  created_by,
  category_id,
  title,
  description,
  province,
  city,
  is_remote,
  salary_min,
  salary_max,
  salary_period,
  employment_type,
  skills
)
values
  (
    'd3000000-0000-4000-8000-000000000001',
    'd2000000-0000-4000-8000-000000000001',
    1,
    'd1000000-0000-4000-8000-000000000002',
    201,
    'Senior Full-Stack Developer',
    'Build and ship accessible job-board experiences across the Jooblie network.',
    'Ontario',
    'Toronto',
    true,
    110000,
    145000,
    'yearly',
    'full_time',
    array['TypeScript', 'React', 'PostgreSQL']
  ),
  (
    'd3000000-0000-4000-8000-000000000002',
    'd2000000-0000-4000-8000-000000000001',
    2,
    'd1000000-0000-4000-8000-000000000002',
    102,
    'Customer Support Specialist',
    'Help Canadian job seekers and recruiters use the platform successfully.',
    'British Columbia',
    'Vancouver',
    false,
    25,
    32,
    'hourly',
    'full_time',
    array['Customer Support', 'Communication', 'CRM']
  ),
  (
    'd3000000-0000-4000-8000-000000000003',
    'd2000000-0000-4000-8000-000000000001',
    1,
    'd1000000-0000-4000-8000-000000000002',
    501,
    'Retail Team Member',
    'Join a customer-focused retail team with flexible weekday shifts.',
    'Alberta',
    'Calgary',
    false,
    18,
    22,
    'hourly',
    'part_time',
    array['Retail', 'Point of Sale', 'Teamwork']
  )
on conflict (id) do nothing;

commit;
