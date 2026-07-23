import { useQuery } from "@tanstack/react-query";
import type {
  QueryData,
  SupabaseClient,
} from "@supabase/supabase-js";

import { getSupabaseClient } from "../client";
import type { Database } from "../database.types";
import {
  queryKeys,
  type JobListFilters,
} from "./query-keys";

const JOB_LIST_SELECT = `
  *,
  companies!jobs_company_id_fkey(name, logo_path),
  categories!jobs_category_id_fkey(name, slug),
  job_sites!inner(site_id)
` as const;

const JOB_DETAIL_SELECT = `
  *,
  companies!jobs_company_id_fkey(name, website, logo_path, description),
  categories!jobs_category_id_fkey(name, slug),
  job_sites(site_id)
` as const;

function createJobListQuery(client: SupabaseClient<Database>) {
  return client
    .from("jobs")
    .select(JOB_LIST_SELECT, { count: "exact" });
}

function createJobDetailQuery(client: SupabaseClient<Database>) {
  return client.from("jobs").select(JOB_DETAIL_SELECT);
}

export type JobListRow =
  QueryData<ReturnType<typeof createJobListQuery>>[number];
export type JobDetailRow =
  QueryData<ReturnType<typeof createJobDetailQuery>>[number];

export type UseJobsParams = JobListFilters & {
  readonly siteId: number | null;
};

export type JobsPage = {
  readonly rows: JobListRow[];
  readonly total: number;
  readonly hasMore: boolean;
};

export async function fetchJobs(
  client: SupabaseClient<Database>,
  params: UseJobsParams,
): Promise<JobsPage> {
  const page = Math.max(1, Math.trunc(params.page));
  const pageSize = Math.max(1, Math.trunc(params.pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = createJobListQuery(client)
    // RLS is the security boundary. This is a public-listing UX filter so a
    // seeker's own saved/applied non-active jobs do not leak into browse.
    .eq("status", "active")
    .is("deleted_at", null);

  if (params.siteId !== null) {
    query = query.eq("job_sites.site_id", params.siteId);
  }

  const search = params.search?.trim();
  if (search) {
    query = query.textSearch("search_vector", search, {
      type: "websearch",
      config: "english",
    });
  }

  if (params.categoryIds?.length) {
    query = query.in("category_id", [...params.categoryIds]);
  }

  if (params.employmentTypes?.length) {
    query = query.in("employment_type", [
      ...params.employmentTypes,
    ]);
  }

  if (params.isRemote !== undefined) {
    query = query.eq("is_remote", params.isRemote);
  }

  const province = params.province?.trim();
  if (province) {
    query = query.eq("province", province);
  }

  const city = params.city?.trim();
  if (city) {
    query = query.eq("city", city);
  }

  if (params.salaryMin !== undefined) {
    query = query.gte("salary_min", params.salaryMin);
  }

  const { data, error, count } = await query
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    })
    .range(from, to);

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const total = count ?? 0;

  return {
    rows,
    total,
    hasMore: from + rows.length < total,
  };
}

export async function fetchJob(
  client: SupabaseClient<Database>,
  id: string,
): Promise<JobDetailRow> {
  const { data, error } = await createJobDetailQuery(client)
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function useJobs(params: UseJobsParams) {
  const client = getSupabaseClient();
  const { siteId, ...filters } = params;

  return useQuery({
    queryKey: queryKeys.jobs.list(siteId, filters),
    queryFn: () => fetchJobs(client, params),
  });
}

export function useJob(id: string) {
  const client = getSupabaseClient();

  return useQuery({
    queryKey: queryKeys.jobs.detail(id),
    queryFn: () => fetchJob(client, id),
    enabled: id.length > 0,
  });
}
