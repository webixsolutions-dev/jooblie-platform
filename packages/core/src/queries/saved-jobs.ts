import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
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
import type {
  JobDetailRow,
  JobListRow,
  JobsPage,
} from "./jobs";
import { queryKeys } from "./query-keys";
import {
  requireMutationData,
  throwMutationError,
} from "./shared";

const SAVED_JOBS_SELECT = `
  *,
  jobs!saved_jobs_job_id_fkey(
    *,
    companies!jobs_company_id_fkey(name, logo_path),
    categories!jobs_category_id_fkey(name, slug)
  )
` as const;

function createSavedJobsQuery(client: SupabaseClient<Database>) {
  return client.from("saved_jobs").select(SAVED_JOBS_SELECT);
}

export type SavedJobListRow =
  QueryData<ReturnType<typeof createSavedJobsQuery>>[number];

type SavedJobInsert = TablesInsert<"saved_jobs">;

export type ToggleSaveJobInput = {
  readonly jobId: SavedJobInsert["job_id"];
  readonly savedViaSiteId: SavedJobInsert["saved_via_site_id"];
  /** Desired state after the mutation. */
  readonly saved: boolean;
};

export async function fetchSavedJobs(
  client: SupabaseClient<Database>,
): Promise<SavedJobListRow[]> {
  const { data, error } = await createSavedJobsQuery(client).order(
    "created_at",
    { ascending: false },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function toggleSavedJob(
  client: SupabaseClient<Database>,
  input: ToggleSaveJobInput,
) {
  if (input.saved) {
    const { data, error } = await client
      .from("saved_jobs")
      .insert({
        job_id: input.jobId,
        saved_via_site_id: input.savedViaSiteId,
      })
      .select()
      .single();

    return {
      saved: true as const,
      row: requireMutationData(data, error),
    };
  }

  const { error } = await client
    .from("saved_jobs")
    .delete()
    .eq("job_id", input.jobId);

  if (error) {
    throwMutationError(error);
  }

  return { saved: false as const, row: null };
}

function findCachedJob(
  queryClient: QueryClient,
  jobId: string,
): JobDetailRow | JobListRow | undefined {
  const detail = queryClient.getQueryData<JobDetailRow>(
    queryKeys.jobs.detail(jobId),
  );

  if (detail) {
    return detail;
  }

  for (const [, page] of queryClient.getQueriesData<JobsPage>({
    queryKey: queryKeys.jobs.lists(),
  })) {
    const job = page?.rows.find((row) => row.id === jobId);

    if (job) {
      return job;
    }
  }

  return undefined;
}

export function useSavedJobs() {
  const client = getSupabaseClient();

  return useQuery({
    queryKey: queryKeys.savedJobs.list(),
    queryFn: () => fetchSavedJobs(client),
  });
}

export function useToggleSaveJob() {
  const client = getSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ToggleSaveJobInput) =>
      toggleSavedJob(client, input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.savedJobs.list(),
      });

      const previous = queryClient.getQueryData<SavedJobListRow[]>(
        queryKeys.savedJobs.list(),
      );

      if (!previous) {
        return { previous };
      }

      if (!input.saved) {
        queryClient.setQueryData<SavedJobListRow[]>(
          queryKeys.savedJobs.list(),
          previous.filter((row) => row.job_id !== input.jobId),
        );
        return { previous };
      }

      if (previous.some((row) => row.job_id === input.jobId)) {
        return { previous };
      }

      const cachedJob = findCachedJob(queryClient, input.jobId);
      const { data } = await client.auth.getSession();
      const userId = data.session?.user.id;

      if (cachedJob && userId) {
        const optimisticRow = {
          created_at: new Date().toISOString(),
          job_id: input.jobId,
          saved_via_site_id: input.savedViaSiteId,
          user_id: userId,
          jobs: cachedJob,
        } satisfies SavedJobListRow;

        queryClient.setQueryData<SavedJobListRow[]>(
          queryKeys.savedJobs.list(),
          [optimisticRow, ...previous],
        );
      }

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          queryKeys.savedJobs.list(),
          context.previous,
        );
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.savedJobs.list(),
      });
    },
  });
}
