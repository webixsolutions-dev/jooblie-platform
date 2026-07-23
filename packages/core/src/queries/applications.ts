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
} from "../database.types";
import { queryKeys } from "./query-keys";
import { requireMutationData } from "./shared";

const APPLICATION_SELECT = `
  *,
  jobs!applications_job_id_fkey(
    *,
    companies!jobs_company_id_fkey(name, logo_path),
    categories!jobs_category_id_fkey(name, slug)
  )
` as const;

function createApplicationsQuery(client: SupabaseClient<Database>) {
  return client.from("applications").select(APPLICATION_SELECT);
}

export type ApplicationDetail =
  QueryData<ReturnType<typeof createApplicationsQuery>>[number];

type ApplicationInsert = TablesInsert<"applications">;

export type ApplyInput = {
  readonly jobId: ApplicationInsert["job_id"];
  readonly resumePath: ApplicationInsert["resume_path"];
  readonly coverLetter?: ApplicationInsert["cover_letter"];
  readonly appliedViaSiteId: ApplicationInsert["applied_via_site_id"];
};

export async function fetchMyApplications(
  client: SupabaseClient<Database>,
): Promise<ApplicationDetail[]> {
  const { data, error } = await createApplicationsQuery(client).order(
    "created_at",
    { ascending: false },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchApplication(
  client: SupabaseClient<Database>,
  id: string,
): Promise<ApplicationDetail> {
  const { data, error } = await createApplicationsQuery(client)
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function applyToJob(
  client: SupabaseClient<Database>,
  input: ApplyInput,
) {
  const { data, error } = await client
    .from("applications")
    .insert({
      job_id: input.jobId,
      resume_path: input.resumePath,
      cover_letter: input.coverLetter ?? null,
      applied_via_site_id: input.appliedViaSiteId,
    })
    .select()
    .single();

  return requireMutationData(data, error);
}

export function useApply() {
  const client = getSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApplyInput) => applyToJob(client, input),
    onSuccess: async (_application, input) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications.mine(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.jobs.detail(input.jobId),
        }),
      ]);
    },
  });
}

export function useMyApplications() {
  const client = getSupabaseClient();

  return useQuery({
    queryKey: queryKeys.applications.mine(),
    queryFn: () => fetchMyApplications(client),
  });
}

export function useApplication(id: string) {
  const client = getSupabaseClient();

  return useQuery({
    queryKey: queryKeys.applications.detail(id),
    queryFn: () => fetchApplication(client, id),
    enabled: id.length > 0,
  });
}
