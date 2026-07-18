create type public.user_role as enum (
  'job_seeker',
  'recruiter',
  'admin'
);

create type public.user_status as enum (
  'active',
  'suspended',
  'deleted'
);

create type public.site_type as enum (
  'aggregator',
  'sector',
  'audience'
);

create type public.company_verification as enum (
  'pending',
  'verified',
  'rejected'
);

create type public.company_status as enum (
  'active',
  'suspended'
);

create type public.job_status as enum (
  'pending_review',
  'active',
  'closed',
  'expired',
  'removed'
);

create type public.employment_type as enum (
  'full_time',
  'part_time',
  'contract',
  'temporary',
  'internship',
  'seasonal'
);

create type public.salary_period as enum (
  'hourly',
  'weekly',
  'monthly',
  'yearly'
);

create type public.application_status as enum (
  'submitted',
  'viewed',
  'shortlisted',
  'interviewing',
  'offered',
  'hired',
  'rejected',
  'withdrawn'
);

create type public.company_member_role as enum (
  'owner',
  'member'
);
