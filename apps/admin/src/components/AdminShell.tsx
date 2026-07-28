import { useAuth } from "@jooblie/core";
import {
  Link,
  NavLink,
  Outlet,
} from "react-router-dom";

import logoUrl from "../assets/logo.png";
import { useAdminSignOut } from "../hooks/useAdminSignOut";

const navigation = [
  { label: "Verification", to: "/verification" },
  { label: "Companies", to: "/companies" },
  { label: "Jobs", to: "/jobs" },
  { label: "Applications", to: "/applications" },
  { label: "Users", to: "/users" },
  { label: "Activity", to: "/activity" },
] as const;

export function AdminShell() {
  const { profile } = useAuth();
  const { handleSignOut, isSigningOut, signOutError } =
    useAdminSignOut();

  return (
    <div className="grid min-h-screen grid-cols-[15rem_minmax(0,1fr)] bg-background">
      <aside className="flex min-h-screen flex-col bg-brandNavy px-4 py-6 text-white">
        <Link
          className="rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          to="/"
        >
          <img alt="Jooblie" className="h-10 w-auto" src={logoUrl} />
          <span className="mt-1 block text-xl font-semibold">Admin Console</span>
        </Link>

        <nav aria-label="Admin navigation" className="mt-8 flex-1">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.to}>
                <NavLink
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-white"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`
                  }
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-white/15 pt-4">
          <p className="truncate px-3 text-sm font-medium">
            {profile?.full_name ?? "Administrator"}
          </p>
          {signOutError ? (
            <p className="mt-2 px-3 text-xs leading-5 text-red-200" role="alert">
              {signOutError}
            </p>
          ) : null}
          <button
            className="mt-3 w-full rounded-md border border-white/25 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSigningOut}
            onClick={() => void handleSignOut()}
            type="button"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-6 py-8 md:px-8 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
