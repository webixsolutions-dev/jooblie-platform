import { useRequireRole } from "@jooblie/core";
import { Navigate, Outlet } from "react-router-dom";

import { ForbiddenScreen } from "./ForbiddenScreen";
import { LoadingScreen } from "./LoadingScreen";

export function AdminGuard() {
  const guard = useRequireRole("admin");

  if (guard.state === "loading") {
    return <LoadingScreen />;
  }

  if (guard.state === "unauthenticated") {
    return <Navigate replace to="/login" />;
  }

  if (guard.state === "forbidden" || guard.state === "suspended") {
    return <ForbiddenScreen />;
  }

  return <Outlet />;
}
