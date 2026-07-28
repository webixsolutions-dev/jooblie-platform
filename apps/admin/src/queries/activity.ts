import { getSupabaseClient } from "@jooblie/core";
import { useQuery } from "@tanstack/react-query";

import type {
  Tables,
} from "../../../../packages/core/src/database.types";
import {
  getExplorerQueryKey,
  getExplorerRange,
  type ExplorerResult,
} from "./explorer";

const ACTIVITY_EXPLORER_SORT = "created_at-desc";
const ACTIVITY_EXPLORER_SELECT = `
  created_at,
  action,
  actor_id,
  entity_type,
  entity_id,
  company_id,
  site_id,
  data,
  id,
  actor:profiles!activity_log_actor_id_fkey(full_name, email),
  company:companies!activity_log_company_id_fkey(name)
` as const;

type ActivityRow = Tables<"activity_log">;
type CompanyRow = Tables<"companies">;
type ProfileRow = Tables<"profiles">;
type CompanySummary = Pick<CompanyRow, "name">;
type ProfileSummary = Pick<ProfileRow, "email" | "full_name">;

export type ActivityExplorerFilters = {
  readonly action: string;
  readonly actorId: string;
  readonly companyId: string;
  readonly createdFrom: string;
  readonly createdTo: string;
  readonly entityId: string;
  readonly entityType: string;
  readonly siteId: string;
};

export type ActivityExplorerRow = Pick<
  ActivityRow,
  | "action"
  | "actor_id"
  | "company_id"
  | "created_at"
  | "data"
  | "entity_id"
  | "entity_type"
  | "id"
  | "site_id"
> & {
  readonly actor: ProfileSummary | null;
  readonly company: CompanySummary | null;
};

function getStartOfDay(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function getEndOfDay(date: string): string {
  return `${date}T23:59:59.999Z`;
}

async function fetchActivityExplorer(
  filters: ActivityExplorerFilters,
  page: number,
): Promise<ExplorerResult<ActivityExplorerRow>> {
  const { from, to } = getExplorerRange(page);
  let query = getSupabaseClient()
    .from("activity_log")
    .select(ACTIVITY_EXPLORER_SELECT, { count: "exact" });

  if (filters.action) {
    query = query.ilike("action", `%${filters.action}%`);
  }

  if (filters.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  if (filters.entityId) {
    query = query.eq("entity_id", filters.entityId);
  }

  if (filters.actorId) {
    query = query.eq("actor_id", filters.actorId);
  }

  if (filters.companyId) {
    query = query.eq("company_id", filters.companyId);
  }

  if (filters.siteId) {
    query = query.eq("site_id", Number(filters.siteId));
  }

  if (filters.createdFrom) {
    query = query.gte("created_at", getStartOfDay(filters.createdFrom));
  }

  if (filters.createdTo) {
    query = query.lte("created_at", getEndOfDay(filters.createdTo));
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

export function useActivityExplorer(
  filters: ActivityExplorerFilters,
  page: number,
) {
  return useQuery({
    queryKey: getExplorerQueryKey(
      "activity",
      filters,
      page,
      ACTIVITY_EXPLORER_SORT,
    ),
    queryFn: () => fetchActivityExplorer(filters, page),
  });
}
