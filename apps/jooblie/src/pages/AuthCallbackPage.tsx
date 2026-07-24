import { useAuth } from "@jooblie/core";
import { Link, Navigate, useSearchParams } from "react-router-dom";

import { getRoleLanding } from "../auth-routing";
import { AuthCard } from "../components/AuthCard";
import { LoadingPage } from "../components/LoadingPage";

export function AuthCallbackPage() {
  const { initialized, loading, user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const callbackError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (callbackError) {
    return (
      <AuthCard
        title="We could not confirm your email"
        description={callbackError}
      >
        <div className="space-y-3 text-sm">
          <Link className="block font-semibold text-primary" to="/auth/check-email">
            View confirmation help
          </Link>
          <Link className="block font-semibold text-primary" to="/login">
            Return to login
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (!initialized || loading) {
    return <LoadingPage />;
  }

  if (user && role) {
    return <Navigate replace to={getRoleLanding(role)} />;
  }

  return (
    <AuthCard
      title="Confirmation link complete"
      description="Your session was not available. Log in to continue."
    >
      <Link className="font-semibold text-primary" to="/login">
        Go to login
      </Link>
    </AuthCard>
  );
}
