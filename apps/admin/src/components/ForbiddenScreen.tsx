import { useAdminSignOut } from "../hooks/useAdminSignOut";

export function ForbiddenScreen() {
  const { handleSignOut, isSigningOut, signOutError } =
    useAdminSignOut();

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
      <section className="w-full max-w-lg rounded-xl border border-border bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          403 Forbidden
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          You don&apos;t have access to the admin console
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Sign out and use an administrator account to continue.
        </p>
        {signOutError ? (
          <p
            className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {signOutError}
          </p>
        ) : null}
        <button
          className="mt-6 rounded-md bg-primary px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSigningOut}
          onClick={() => void handleSignOut()}
          type="button"
        >
          {isSigningOut ? "Signing out…" : "Sign out"}
        </button>
      </section>
    </main>
  );
}
