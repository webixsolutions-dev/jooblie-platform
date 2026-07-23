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
import type { Database } from "../database.types";
import { queryKeys } from "./query-keys";
import { requireMutationData } from "./shared";

const NOTIFICATIONS_SELECT = `
  *,
  sites!notifications_site_id_fkey(id, slug, name)
` as const;

function createNotificationsQuery(client: SupabaseClient<Database>) {
  return client.from("notifications").select(NOTIFICATIONS_SELECT);
}

export type NotificationListRow =
  QueryData<ReturnType<typeof createNotificationsQuery>>[number];

export type MarkNotificationReadInput = {
  readonly notificationId: string;
};

export async function fetchNotifications(
  client: SupabaseClient<Database>,
): Promise<NotificationListRow[]> {
  const { data, error } = await createNotificationsQuery(client).order(
    "created_at",
    { ascending: false },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchUnreadCount(
  client: SupabaseClient<Database>,
): Promise<number> {
  const { count, error } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function markNotificationRead(
  client: SupabaseClient<Database>,
  input: MarkNotificationReadInput,
) {
  const { data, error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", input.notificationId)
    .select()
    .single();

  return requireMutationData(data, error);
}

export function useNotifications() {
  const client = getSupabaseClient();

  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: () => fetchNotifications(client),
  });
}

export function useUnreadCount() {
  const client = getSupabaseClient();

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => fetchUnreadCount(client),
  });
}

export function useMarkNotificationRead() {
  const client = getSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MarkNotificationReadInput) =>
      markNotificationRead(client, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.list(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.notifications.unreadCount(),
        }),
      ]);
    },
  });
}
