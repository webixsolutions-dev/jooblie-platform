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

const USER_EXPLORER_SORT = "created_at-desc";
const USER_EXPLORER_SELECT = `
  id,
  full_name,
  email,
  role,
  status,
  signup_site_id,
  location_city,
  location_province,
  created_at,
  phone,
  headline,
  skills,
  default_resume_path,
  updated_at
` as const;

type ProfileRow = Tables<"profiles">;

export type UserExplorerFilters = {
  readonly createdFrom: string;
  readonly createdTo: string;
  readonly role: "" | Enums<"user_role">;
  readonly search: string;
  readonly signupSiteId: string;
  readonly status: "" | Enums<"user_status">;
  readonly userId: string;
};

export type UserExplorerRow = Pick<
  ProfileRow,
  | "created_at"
  | "default_resume_path"
  | "email"
  | "full_name"
  | "headline"
  | "id"
  | "location_city"
  | "location_province"
  | "phone"
  | "role"
  | "signup_site_id"
  | "skills"
  | "status"
  | "updated_at"
>;

function getStartOfDay(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function getEndOfDay(date: string): string {
  return `${date}T23:59:59.999Z`;
}

function quotePostgrestValue(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

async function fetchUsersExplorer(
  filters: UserExplorerFilters,
  page: number,
): Promise<ExplorerResult<UserExplorerRow>> {
  const { from, to } = getExplorerRange(page);
  let query = getSupabaseClient()
    .from("profiles")
    .select(USER_EXPLORER_SELECT, { count: "exact" });

  if (filters.role) {
    query = query.eq("role", filters.role);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.signupSiteId) {
    query = query.eq("signup_site_id", Number(filters.signupSiteId));
  }

  if (filters.createdFrom) {
    query = query.gte("created_at", getStartOfDay(filters.createdFrom));
  }

  if (filters.createdTo) {
    query = query.lte("created_at", getEndOfDay(filters.createdTo));
  }

  if (filters.search) {
    const searchPattern = quotePostgrestValue(`%${filters.search}%`);
    query = query.or(
      `full_name.ilike.${searchPattern},email.ilike.${searchPattern}`,
    );
  }

  if (filters.userId) {
    query = query.eq("id", filters.userId);
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

export function useUsersExplorer(
  filters: UserExplorerFilters,
  page: number,
) {
  return useQuery({
    queryKey: getExplorerQueryKey(
      "users",
      filters,
      page,
      USER_EXPLORER_SORT,
    ),
    queryFn: () => fetchUsersExplorer(filters, page),
  });
}
