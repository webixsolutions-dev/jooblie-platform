export const ERROR_CODE_MESSAGES = {
  "23505": "You've already applied to this job",
  "42501": "You don't have permission to do that",
  JB007: "That job status change isn't allowed",
  JB008: "That application status change isn't allowed",
  P0002: "Not found",
  invalid_credentials: "Invalid email or password",
  email_not_confirmed: "Please confirm your email before signing in",
  user_already_exists: "An account with this email already exists",
  user_exists: "An account with this email already exists",
} as const satisfies Readonly<Record<string, string>>;

export type KnownErrorCode = keyof typeof ERROR_CODE_MESSAGES;

const AUTH_MESSAGE_CODES: ReadonlyArray<readonly [string, KnownErrorCode]> = [
  ["invalid login credentials", "invalid_credentials"],
  ["email not confirmed", "email_not_confirmed"],
  ["user already registered", "user_already_exists"],
  ["user already exists", "user_already_exists"],
];

type ErrorLike = {
  readonly code?: unknown;
  readonly message?: unknown;
};

function getKnownErrorCode(error: unknown): KnownErrorCode | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const { code, message } = error as ErrorLike;

  if (typeof code === "string" && code in ERROR_CODE_MESSAGES) {
    return code as KnownErrorCode;
  }

  if (typeof message !== "string") {
    return undefined;
  }

  const normalizedMessage = message.toLowerCase();
  return AUTH_MESSAGE_CODES.find(([fragment]) =>
    normalizedMessage.includes(fragment),
  )?.[1];
}

export function toUserMessage(error: unknown): string {
  const code = getKnownErrorCode(error);

  return code
    ? ERROR_CODE_MESSAGES[code]
    : "Something went wrong. Please try again.";
}

export function toUserFacingError(error: unknown): Error {
  return new Error(toUserMessage(error), { cause: error });
}
