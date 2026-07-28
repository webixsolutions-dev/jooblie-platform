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

const JOB_EXPLORER_SORT = "created_at-desc";
const JOB_EXPLORER_SELECT = `
  id,
  title,
  status,
  company_id,
  created_by,
  origin_site_id,
  employment_type,
  city,
  province,
  is_remote,
  published_at,
  expires_at,
  created_at,
  description,
  skills,
  salary_min,
  salary_max,
  salary_currency,
  salary_period,
  category_id,
  deleted_at,
  removed_reason,
  updated_at,
  company:companies!jobs_company_id_fkey!inner(name),
  recruiter:profiles!jobs_created_by_fkey(full_name, email)
` as const;

type JobRow = Tables<"jobs">;
type CompanyRow = Tables<"companies">;
type ProfileRow = Tables<"profiles">;
type CompanySummary = Pick<CompanyRow, "name">;
type ProfileSummary = Pick<ProfileRow, "email" | "full_name">;

export type JobExplorerFilters = {
  readonly companyId: string;
  readonly companyName: string;
  readonly createdFrom: string;
  readonly createdTo: string;
  readonly originSiteId: string;
  readonly publishedFrom: string;
  readonly publishedTo: string;
  readonly recruiterId: string;
  readonly status: "" | Enums<"job_status">;
  readonly title: string;
};

export type JobExplorerRow = Pick<
  JobRow,
  | "category_id"
  | "city"
  | "company_id"
  | "created_at"
  | "created_by"
  | "deleted_at"
  | "description"
  | "employment_type"
  | "expires_at"
  | "id"
  | "is_remote"
  | "origin_site_id"
  | "province"
  | "published_at"
  | "removed_reason"
  | "salary_currency"
  | "salary_max"
  | "salary_min"
  | "salary_period"
  | "skills"
  | "status"
  | "title"
  | "updated_at"
> & {
  readonly company: CompanySummary;
  readonly recruiter: ProfileSummary | null;
};

function getStartOfDay(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function getEndOfDay(date: string): string {
  return `${date}T23:59:59.999Z`;
}

async function fetchJobsExplorer(
  filters: JobExplorerFilters,
  page: number,
): Promise<ExplorerResult<JobExplorerRow>> {
  const { from, to } = getExplorerRange(page);
  let query = getSupabaseClient()
    .from("jobs")
    .select(JOB_EXPLORER_SELECT, { count: "exact" });

  if (filters.originSiteId) {
    query = query.eq("origin_site_id", Number(filters.originSiteId));
  }

  if (filters.companyId) {
    query = query.eq("company_id", filters.companyId);
  }

  if (filters.companyName) {
    query = query.ilike("company.name", `%${filters.companyName}%`);
  }

  if (filters.recruiterId) {
    query = query.eq("created_by", filters.recruiterId);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.createdFrom) {
    query = query.gte("created_at", getStartOfDay(filters.createdFrom));
  }

  if (filters.createdTo) {
    query = query.lte("created_at", getEndOfDay(filters.createdTo));
  }

  if (filters.publishedFrom) {
    query = query.gte(
      "published_at",
      getStartOfDay(filters.publishedFrom),
    );
  }

  if (filters.publishedTo) {
    query = query.lte(
      "published_at",
      getEndOfDay(filters.publishedTo),
    );
  }

  if (filters.title) {
    query = query.ilike("title", `%${filters.title}%`);
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

export function useJobsExplorer(
  filters: JobExplorerFilters,
  page: number,
) {
  return useQuery({
    queryKey: getExplorerQueryKey(
      "jobs",
      filters,
      page,
      JOB_EXPLORER_SORT,
    ),
    queryFn: () => fetchJobsExplorer(filters, page),
  });
}
