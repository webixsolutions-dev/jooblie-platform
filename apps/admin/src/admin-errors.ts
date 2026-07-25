import { toUserMessage } from "@jooblie/core";

const GENERIC_ERROR = "Something went wrong. Please try again.";

export function getAdminErrorMessage(
  error: unknown,
  fallback = GENERIC_ERROR,
): string {
  const mappedMessage = toUserMessage(error);
  return mappedMessage === GENERIC_ERROR ? fallback : mappedMessage;
}
