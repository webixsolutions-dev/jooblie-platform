import { Link, useLocation } from "react-router-dom";

import { AuthCard } from "../components/AuthCard";

type CheckEmailLocationState = {
  readonly email?: string;
};

export function CheckEmailPage() {
  const location = useLocation();
  const state = location.state as CheckEmailLocationState | null;

  return (
    <AuthCard
      title="Check your email"
      description={
        state?.email
          ? `We sent a confirmation link to ${state.email}.`
          : "Open the confirmation link sent to your email address."
      }
    >
      <p className="text-sm leading-6 text-muted">
        After confirming your email, you will return to Jooblie. If the link has
        expired, create the account again or contact support.
      </p>
      <Link
        className="mt-5 inline-block font-semibold text-primary"
        to="/login"
      >
        Return to login
      </Link>
    </AuthCard>
  );
}
