import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { env } from "./env";

let supabaseClient: SupabaseClient<Database> | undefined;

export function createSupabaseClient(): SupabaseClient<Database> {
  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: `jooblie.auth.${env.appSlug}`,
    },
  });
}

export function getSupabaseClient(): SupabaseClient<Database> {
  supabaseClient ??= createSupabaseClient();
  return supabaseClient;
}
