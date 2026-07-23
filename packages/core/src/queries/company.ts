import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  QueryData,
  SupabaseClient,
} from "@supabase/supabase-js";

import { getSupabaseClient } from "../client";
import type {
  Database,
  TablesInsert,
  TablesUpdate,
} from "../database.types";
import { queryKeys } from "./query-keys";
import {
  requireMutationData,
  throwMutationError,
} from "./shared";

const MY_COMPANY_SELECT = `
  role,
  companies!company_members_company_id_fkey(*)
` as const;

const MY_JOBS_SELECT = `
  *,
  categories!jobs_category_id_fkey(name, slug),
  job_sites(site_id)
` as const;

const JOB_APPLICANTS_SELECT = `
  *,
  profiles!applications_applicant_id_fkey(
    id,
    full_name,
    headline,
    skills,
    location_city,
    location_province
  )
` as const;

function createMyCompanyQuery(client: SupabaseClient<Database>) {
  return client.from("company_members").select(MY_COMPANY_SELECT);
}

function createMyJobsQuery(client: SupabaseClient<Database>) {
  return client.from("jobs").select(MY_JOBS_SELECT);
}

function createJobApplicantsQuery(client: SupabaseClient<Database>) {
  return client
    .from("applications")
    .select(JOB_APPLICANTS_SELECT);
}

export type MyCompany =
  QueryData<ReturnType<typeof createMyCompanyQuery>>[number];
export type RecruiterJob =
  QueryData<ReturnType<typeof createMyJobsQuery>>[number];
export type JobApplicant =
  QueryData<ReturnType<typeof createJobApplicantsQuery>>[number];

type CompanyInsert = TablesInsert<"companies">;
type JobInsert = TablesInsert<"jobs">;
type ApplicationUpdate = TablesUpdate<"applications">;

export type CreateCompanyInput = {
  readonly name: CompanyInsert["name"];
  readonly website: CompanyInsert["website"];
  readonly registrationNumber: CompanyInsert["registration_number"];
  readonly verificationDocumentPath?: CompanyInsert["verification_document_path"];
  readonly logoPath?: CompanyInsert["logo_path"];
  readonly description?: CompanyInsert["description"];
};

export type CreateJobInput = {
  readonly companyId: JobInsert["company_id"];
  readonly originSiteId: JobInsert["origin_site_id"];
  readonly title: JobInsert["title"];
  readonly description: JobInsert["description"];
  readonly categoryId: JobInsert["category_id"];
  readonly province?: JobInsert["province"];
  readonly city?: JobInsert["city"];
  readonly isRemote?: JobInsert["is_remote"];
  readonly salaryMin?: JobInsert["salary_min"];
  readonly salaryMax?: JobInsert["salary_max"];
  readonly salaryCurrency?: JobInsert["salary_currency"];
  readonly salaryPeriod?: JobInsert["salary_period"];
  readonly employmentType: JobInsert["employment_type"];
  readonly skills?: JobInsert["skills"];
};

export type UpdateApplicationStatusInput = {
  readonly applicationId: string;
  readonly status: NonNullable<ApplicationUpdate["status"]>;
};

export async function fetchMyCompany(
  client: SupabaseClient<Database>,
): Promise<MyCompany | null> {
  const { data, error } = await createMyCompanyQuery(client)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createCompany(
  client: SupabaseClient<Database>,
  input: CreateCompanyInput,
) {
  const { data: userData, error: userError } =
    await client.auth.getUser();

  if (userError) {
    throwMutationError(userError);
  }

  if (!userData.user) {
    throwMutationError({ code: "42501" });
  }

  const { data, error } = await client
    .from("companies")
    .insert({
      name: input.name,
      website: input.website,
      registration_number: input.registrationNumber,
      verification_document_path:
        input.verificationDocumentPath ?? null,
      logo_path: input.logoPath ?? null,
      description: input.description ?? null,
      created_by: userData.user.id,
    })
    .select()
    .single();

  return requireMutationData(data, error);
}

export async function createJob(
  client: SupabaseClient<Database>,
  input: CreateJobInput,
) {
  const { data, error } = await client
    .from("jobs")
    .insert({
      company_id: input.companyId,
      origin_site_id: input.originSiteId,
      title: input.title,
      description: input.description,
      category_id: input.categoryId,
      province: input.province ?? null,
      city: input.city ?? null,
      is_remote: input.isRemote ?? false,
      salary_min: input.salaryMin ?? null,
      salary_max: input.salaryMax ?? null,
      salary_currency: input.salaryCurrency ?? "CAD",
      salary_period: input.salaryPeriod ?? null,
      employment_type: input.employmentType,
      skills: input.skills ?? [],
    })
    .select()
    .single();

  return requireMutationData(data, error);
}

export async function fetchMyJobs(
  client: SupabaseClient<Database>,
  companyId: string,
): Promise<RecruiterJob[]> {
  const { data, error } = await createMyJobsQuery(client)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchJobApplicants(
  client: SupabaseClient<Database>,
  jobId: string,
): Promise<JobApplicant[]> {
  const { data, error } = await createJobApplicantsQuery(client)
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateApplicationStatus(
  client: SupabaseClient<Database>,
  input: UpdateApplicationStatusInput,
) {
  const { data, error } = await client
    .from("applications")
    .update({ status: input.status })
    .eq("id", input.applicationId)
    .select()
    .single();

  return requireMutationData(data, error);
}

export function useMyCompany() {
  const client = getSupabaseClient();

  return useQuery({
    queryKey: queryKeys.company.mine(),
    queryFn: () => fetchMyCompany(client),
  });
}

export function useCreateCompany() {
  const client = getSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCompanyInput) =>
      createCompany(client, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.company.mine(),
      });
    },
  });
}

export function useCreateJob() {
  const client = getSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateJobInput) => createJob(client, input),
    onSuccess: async (_job, input) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.jobs.mine(input.companyId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.jobs.lists(),
        }),
      ]);
    },
  });
}

export function useMyJobs(companyId: string | null) {
  const client = getSupabaseClient();

  return useQuery({
    queryKey: queryKeys.jobs.mine(companyId),
    queryFn: () =>
      companyId ? fetchMyJobs(client, companyId) : Promise.resolve([]),
    enabled: companyId !== null,
  });
}

export function useJobApplicants(jobId: string | null) {
  const client = getSupabaseClient();

  return useQuery({
    queryKey: queryKeys.applications.forJob(jobId),
    queryFn: () =>
      jobId
        ? fetchJobApplicants(client, jobId)
        : Promise.resolve([]),
    enabled: jobId !== null,
  });
}

export function useUpdateApplicationStatus() {
  const client = getSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateApplicationStatusInput) =>
      updateApplicationStatus(client, input),
    onSuccess: async (application) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications.detail(application.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications.forJob(application.job_id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications.mine(),
        }),
      ]);
    },
  });
}
