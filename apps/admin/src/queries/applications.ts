import { getSupabaseClient } from "@jooblie/core";
import { useQuery } from "@tanstack/react-query";

import type {
  Enums,
  Tables,
} from "../../../../packages/core/src/database.types";
import {
  getExplorerQueryKey,
  getExplorerRange,
  type ExplorerResult,
} from "./explorer";

const APPLICATION_EXPLORER_SORT = "created_at-desc";
const APPLICATION_EXPLORER_SELECT = `
  id,
  job_id,
  applicant_id,
  status,
  status_updated_at,
  applied_via_site_id,
  created_at,
  cover_letter,
  resume_path,
  updated_at,
  deleted_at,
  job:jobs!applications_job_id_fkey!inner(
    title,
    company:companies!jobs_company_id_fkey(name)
  ),
  applicant:profiles!applications_applicant_id_fkey(full_name, email)
` as const;

export const RESUMES_BUCKET = "resumes";
export const RESUME_URL_TTL_SECONDS = 60;

type ApplicationRow = Tables<"applications">;
type CompanyRow = Tables<"companies">;
type JobRow = Tables<"jobs">;
type ProfileRow = Tables<"profiles">;
type CompanySummary = Pick<CompanyRow, "name">;
type JobSummary = Pick<JobRow, "title"> & {
  readonly company: CompanySummary;
};
type ProfileSummary = Pick<ProfileRow, "email" | "full_name">;

export type ApplicationExplorerFilters = {
  readonly applicantId: string;
  readonly appliedViaSiteId: string;
  readonly createdFrom: string;
  readonly createdTo: string;
  readonly jobId: string;
  readonly jobTitle: string;
  readonly status: "" | Enums<"application_status">;
  readonly statusUpdatedFrom: string;
  readonly statusUpdatedTo: string;
};

export type ApplicationExplorerRow = Pick<
  ApplicationRow,
  | "applicant_id"
  | "applied_via_site_id"
  | "cover_letter"
  | "created_at"
  | "deleted_at"
  | "id"
  | "job_id"
  | "resume_path"
  | "status"
  | "status_updated_at"
  | "updated_at"
> & {
  readonly applicant: ProfileSummary;
  readonly job: JobSummary;
};

function getStartOfDay(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function getEndOfDay(date: string): string {
  return `${date}T23:59:59.999Z`;
}

async function fetchApplicationsExplorer(
  filters: ApplicationExplorerFilters,
  page: number,
): Promise<ExplorerResult<ApplicationExplorerRow>> {
  const { from, to } = getExplorerRange(page);
  let query = getSupabaseClient()
    .from("applications")
    .select(APPLICATION_EXPLORER_SELECT, { count: "exact" });

  if (filters.jobId) {
    query = query.eq("job_id", filters.jobId);
  }

  if (filters.jobTitle) {
    query = query.ilike("job.title", `%${filters.jobTitle}%`);
  }

  if (filters.applicantId) {
    query = query.eq("applicant_id", filters.applicantId);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.appliedViaSiteId) {
    query = query.eq(
      "applied_via_site_id",
      Number(filters.appliedViaSiteId),
    );
  }

  if (filters.createdFrom) {
    query = query.gte("created_at", getStartOfDay(filters.createdFrom));
  }

  if (filters.createdTo) {
    query = query.lte("created_at", getEndOfDay(filters.createdTo));
  }

  if (filters.statusUpdatedFrom) {
    query = query.gte(
      "status_updated_at",
      getStartOfDay(filters.statusUpdatedFrom),
    );
  }

  if (filters.statusUpdatedTo) {
    query = query.lte(
      "status_updated_at",
      getEndOfDay(filters.statusUpdatedTo),
    );
  }

  const { count, data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    throw error;
  }

  return {
    rows: data,
    total: count ?? 0,
  };
}

export async function createApplicationResumeSignedUrl(
  resumePath: string,
): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .storage.from(RESUMES_BUCKET)
    .createSignedUrl(resumePath, RESUME_URL_TTL_SECONDS);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

export function useApplicationsExplorer(
  filters: ApplicationExplorerFilters,
  page: number,
) {
  return useQuery({
    queryKey: getExplorerQueryKey(
      "applications",
      filters,
      page,
      APPLICATION_EXPLORER_SORT,
    ),
    queryFn: () => fetchApplicationsExplorer(filters, page),
  });
}
