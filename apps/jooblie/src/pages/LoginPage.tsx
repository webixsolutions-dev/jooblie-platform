import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@jooblie/core";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { getAuthErrorMessage } from "../auth-errors";
import { getRoleLanding, getSafeNext } from "../auth-routing";
import {
  AuthCard,
  inputClassName,
  primaryButtonClassName,
} from "../components/AuthCard";

export function LoginPage() {
  const { signIn, initialized, loading, user, role } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const safeNext = getSafeNext(searchParams.get("next"));

  useEffect(() => {
    if (!initialized || loading || !user || !role) {
      return;
    }

    navigate(safeNext ?? getRoleLanding(role), { replace: true });
  }, [initialized, loading, navigate, role, safeNext, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitted(true);

    try {
      await signIn(email, password);
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
      setSubmitted(false);
    }
  };

  const showCheckEmailLink =
    error?.toLowerCase().includes("confirm your email") ?? false;

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to continue to your Jooblie account."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium">
          Email
          <input
            autoComplete="email"
            className={inputClassName}
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label className="block text-sm font-medium">
          Password
          <input
            autoComplete="current-password"
            className={inputClassName}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {error ? (
          <div
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            <p>{error}</p>
            {showCheckEmailLink ? (
              <Link
                className="mt-1 inline-block font-semibold underline"
                to="/auth/check-email"
              >
                Confirmation help
              </Link>
            ) : null}
          </div>
        ) : null}

        <button
          className={primaryButtonClassName}
          disabled={submitted || loading}
          type="submit"
        >
          {submitted || loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        New to Jooblie?{" "}
        <Link className="font-semibold text-primary" to="/signup">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
