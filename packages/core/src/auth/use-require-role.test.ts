import { describe, expect, it } from "vitest";

import type { UserRole } from "../constants";
import type { AuthProfile } from "./context";
import {
  resolveRoleGuardState,
  type RoleGuardSnapshot,
} from "./use-require-role";

const profile: AuthProfile = {
  id: "d1000000-0000-4000-8000-000000000001",
  role: "job_seeker",
  status: "active",
  full_name: "Dev Job Seeker",
  default_resume_path: null,
};

function guard(
  requiredRole: UserRole,
  overrides: Partial<RoleGuardSnapshot> = {},
) {
  return resolveRoleGuardState(
    {
      loading: false,
      initialized: true,
      authenticated: true,
      profile,
      ...overrides,
    },
    requiredRole,
  );
}

describe("useRequireRole guard states", () => {
  it("authorizes an exact role match", () => {
    expect(guard("job_seeker")).toEqual({
      state: "authorized",
      profile,
    });
  });

  it("forbids a different role", () => {
    expect(guard("recruiter")).toEqual({ state: "forbidden" });
  });

  it("does not treat admin as recruiter", () => {
    expect(
      guard("recruiter", {
        profile: { ...profile, role: "admin" },
      }),
    ).toEqual({ state: "forbidden" });
  });

  it("suspends a user even when the role matches", () => {
    expect(
      guard("job_seeker", {
        profile: { ...profile, status: "suspended" },
      }),
    ).toEqual({ state: "suspended" });
  });

  it("treats deleted users as suspended", () => {
    expect(
      guard("job_seeker", {
        profile: { ...profile, status: "deleted" },
      }),
    ).toEqual({ state: "suspended" });
  });

  it("returns unauthenticated without a session", () => {
    expect(
      guard("job_seeker", {
        authenticated: false,
        profile: null,
      }),
    ).toEqual({ state: "unauthenticated" });
  });

  it("stays loading before initialization", () => {
    expect(
      guard("job_seeker", {
        loading: true,
        initialized: false,
        authenticated: false,
        profile: null,
      }),
    ).toEqual({ state: "loading" });
  });
});
