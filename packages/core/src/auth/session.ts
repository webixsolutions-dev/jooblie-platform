import { getSupabaseClient } from "../client";
import { toUserFacingError } from "../constants";

export async function getAccessToken(): Promise<string | null> {
  const { data, error } = await getSupabaseClient().auth.getSession();

  if (error) {
    throw toUserFacingError(error);
  }

  return data.session?.access_token ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getAccessToken()) !== null;
}
