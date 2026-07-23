import { getSupabaseClient } from "../client";

function toUserFacingError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error("Something went wrong. Please try again.", { cause: error });
}

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
