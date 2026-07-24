import { toUserMessage } from "@jooblie/core";

const GENERIC_ERROR = "Something went wrong. Please try again.";

export function getAuthErrorMessage(error: unknown): string {
  const mappedMessage = toUserMessage(error);

  if (
    mappedMessage === GENERIC_ERROR &&
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return mappedMessage;
}
