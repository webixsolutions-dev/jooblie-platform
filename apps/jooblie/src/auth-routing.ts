import type { UserRole } from "@jooblie/core";

export function getRoleLanding(role: UserRole | null): string {
  if (role === "recruiter") {
    return "/recruiter";
  }

  return "/dashboard";
}

export function getSafeNext(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}
