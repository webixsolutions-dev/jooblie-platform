import { useEffect, useState, type FormEvent } from "react";
import { toUserMessage, useAuth } from "@jooblie/core";
import { useNavigate } from "react-router-dom";

const GENERIC_ERROR = "Something went wrong. Please try again.";

function getAuthErrorMessage(error: unknown): string {
  const mappedMessage = toUserMessage(error);

  if (
    mappedMessage === GENERIC_ERROR &&
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return mappedMessage;
}

export function LoginPage() {
  const { initialized, loading, role, signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (initialized && !loading && user && role === "admin") {
      navigate("/", { replace: true });
    }
  }, [initialized, loading, navigate, role, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitted(true);

    try {
      await signIn(email, password);
      navigate("/", { replace: true });
    } catch (caughtError) {
      setError(getAuthErrorMessage(caughtError));
      setSubmitted(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-12">
      <section className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Jooblie
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Admin console
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Sign in with your administrator account.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Email
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
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
              className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
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
            className="w-full rounded-md bg-primary px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitted || loading}
            type="submit"
          >
            {submitted || loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
