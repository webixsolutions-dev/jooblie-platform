import { toUserFacingError } from "../constants";

export function throwMutationError(error: unknown): never {
  throw toUserFacingError(error);
}

export function requireMutationData<T>(data: T | null, error: unknown): T {
  if (error) {
    throwMutationError(error);
  }

  if (data === null) {
    throwMutationError({ code: "P0002" });
  }

  return data;
}
