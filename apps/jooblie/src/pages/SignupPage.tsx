import { useState, type FormEvent } from "react";
import { useAuth, type SignUpRole } from "@jooblie/core";
import { Link, useNavigate } from "react-router-dom";

import { getAuthErrorMessage } from "../auth-errors";
import {
  AuthCard,
  inputClassName,
  primaryButtonClassName,
} from "../components/AuthCard";

const MIN_PASSWORD_LENGTH = 6;

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SignUpRole>("job_seeker");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
      );
      return;
    }

    setSubmitting(true);

    try {
      const result = await signUp(email, password, {
        role,
        siteSlug: "jooblie",
        fullName,
      });

      if (result.state === "confirmation_required") {
        navigate("/auth/check-email", {
          replace: true,
          state: { email },
        });
        return;
      }

      navigate(role === "recruiter" ? "/recruiter" : "/dashboard", {
        replace: true,
      });
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      description="Join Jooblie to find work or grow your team."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium">
          Full name
          <input
            autoComplete="name"
            className={inputClassName}
            name="fullName"
            onChange={(event) => setFullName(event.target.value)}
            required
            type="text"
            value={fullName}
          />
        </label>

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
            aria-describedby="password-help"
            autoComplete="new-password"
            className={inputClassName}
            minLength={MIN_PASSWORD_LENGTH}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <span
            className="mt-1.5 block text-xs font-normal text-muted"
            id="password-help"
          >
            Use at least {MIN_PASSWORD_LENGTH} characters.
          </span>
        </label>

        <label className="block text-sm font-medium">
          I want to
          <select
            className={inputClassName}
            name="role"
            onChange={(event) => setRole(event.target.value as SignUpRole)}
            value={role}
          >
            <option value="job_seeker">Find a job</option>
            <option value="recruiter">Hire people</option>
          </select>
        </label>

        {error ? (
          <p
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <button
          className={primaryButtonClassName}
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link className="font-semibold text-primary" to="/login">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
