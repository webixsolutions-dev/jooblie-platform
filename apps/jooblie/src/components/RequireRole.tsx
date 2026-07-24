import type { ReactNode } from "react";
import { useRequireRole, type UserRole } from "@jooblie/core";
import { Link, Navigate, useLocation } from "react-router-dom";

import { Container } from "./Container";
import { LoadingPage } from "./LoadingPage";

type RequireRoleProps = {
  readonly children: ReactNode;
  readonly role: UserRole;
};

function AccessMessage({
  title,
  description,
}: {
  readonly title: string;
  readonly description: string;
}) {
  return (
    <Container className="py-20 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mx-auto mt-3 max-w-lg text-muted">{description}</p>
      <Link className="mt-6 inline-block font-semibold text-primary" to="/">
        Return home
      </Link>
    </Container>
  );
}

export function RequireRole({ children, role }: RequireRoleProps) {
  const access = useRequireRole(role);
  const location = useLocation();

  if (access.state === "loading") {
    return <LoadingPage />;
  }

  if (access.state === "unauthenticated") {
    const next = encodeURIComponent(location.pathname);
    return <Navigate replace to={`/login?next=${next}`} />;
  }

  if (access.state === "suspended") {
    return (
      <AccessMessage
        title="Account unavailable"
        description="This account is restricted. Contact support if you believe this is a mistake."
      />
    );
  }

  if (access.state === "forbidden") {
    return (
      <AccessMessage
        title="You cannot access this page"
        description="This page is available to a different account role."
      />
    );
  }

  return children;
}
