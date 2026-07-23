import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseClient } from "../client";
import type { Database } from "../database.types";
import { queryKeys } from "./query-keys";

const REFERENCE_DATA_STALE_TIME = Number.POSITIVE_INFINITY;

export async function fetchSectors(
  client: SupabaseClient<Database>,
) {
  const { data, error } = await client
    .from("sectors")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchCategories(
  client: SupabaseClient<Database>,
) {
  const { data, error } = await client
    .from("categories")
    .select("*")
    .or("is_active.is.null,is_active.eq.true")
    .order("sector_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export function useSectors() {
  const client = getSupabaseClient();

  return useQuery({
    queryKey: queryKeys.taxonomy.sectors(),
    queryFn: () => fetchSectors(client),
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}

export function useCategories() {
  const client = getSupabaseClient();

  return useQuery({
    queryKey: queryKeys.taxonomy.categories(),
    queryFn: () => fetchCategories(client),
    staleTime: REFERENCE_DATA_STALE_TIME,
  });
}
