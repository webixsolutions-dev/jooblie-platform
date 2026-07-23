import type { AuthProfile, UserRole } from "./context";
import { useAuth } from "./use-auth";

export type RequireRoleState =
  | { readonly state: "loading" }
  | { readonly state: "unauthenticated" }
  | { readonly state: "forbidden" }
  | { readonly state: "suspended" }
  | { readonly state: "authorized"; readonly profile: AuthProfile };

export type RoleGuardSnapshot = {
  readonly loading: boolean;
  readonly initialized: boolean;
  readonly authenticated: boolean;
  readonly profile: AuthProfile | null;
};

export function resolveRoleGuardState(
  snapshot: RoleGuardSnapshot,
  requiredRole: UserRole,
): RequireRoleState {
  if (snapshot.loading || !snapshot.initialized) {
    return { state: "loading" };
  }

  if (!snapshot.authenticated) {
    return { state: "unauthenticated" };
  }

  if (!snapshot.profile) {
    return { state: "forbidden" };
  }

  if (
    snapshot.profile.status === "suspended" ||
    snapshot.profile.status === "deleted"
  ) {
    return { state: "suspended" };
  }

  if (snapshot.profile.role !== requiredRole) {
    return { state: "forbidden" };
  }

  return { state: "authorized", profile: snapshot.profile };
}

export function useRequireRole(requiredRole: UserRole): RequireRoleState {
  const { session, profile, loading, initialized } = useAuth();

  return resolveRoleGuardState(
    {
      loading,
      initialized,
      authenticated: session !== null,
      profile,
    },
    requiredRole,
  );
}
