import { useState } from "react";
import { useAuth, type SignUpRole } from "@jooblie/core";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

import logoUrl from "../assets/logo.png";

type DashboardLayoutProps = {
  readonly role: SignUpRole;
};

type NavItemKey =
  | "browse"
  | "company"
  | "dashboard"
  | "jobs"
  | "post"
  | "saved";

type NavItem = {
  readonly key: NavItemKey;
  readonly label: string;
  readonly to: string;
};

const seekerNavItems: readonly NavItem[] = [
  { key: "dashboard", label: "Dashboard", to: "/dashboard" },
  { key: "saved", label: "Saved Jobs", to: "/saved" },
  { key: "browse", label: "Browse Jobs", to: "/jobs" },
];

const recruiterNavItems: readonly NavItem[] = [
  { key: "dashboard", label: "Dashboard", to: "/recruiter" },
  { key: "jobs", label: "My Jobs", to: "/recruiter/jobs" },
  { key: "post", label: "Post a Job", to: "/recruiter/jobs/new" },
  { key: "company", label: "Company", to: "/recruiter#company" },
];

function isNavItemActive(
  item: NavItem,
  pathname: string,
  hash: string,
): boolean {
  if (item.key === "company") {
    return (
      pathname === "/recruiter/company/new" ||
      (pathname === "/recruiter" && hash === "#company")
    );
  }

  if (item.key === "dashboard") {
    return item.to === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === "/recruiter" && hash !== "#company";
  }

  if (item.key === "jobs") {
    return (
      pathname === "/recruiter/jobs" ||
      (pathname.startsWith("/recruiter/jobs/") &&
        pathname !== "/recruiter/jobs/new")
    );
  }

  return pathname === item.to;
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  const { profile, signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const isRecruiter = role === "recruiter";
  const navItems = isRecruiter ? recruiterNavItems : seekerNavItems;
  const displayName =
    profile?.full_name?.trim() || user?.email || "Jooblie member";
  const roleLabel = isRecruiter ? "Recruiter account" : "Job seeker account";

  const handleSignOut = async () => {
    setSigningOut(true);
    navigate("/", { replace: true });

    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[17rem_minmax(0,1fr)]">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 bg-brandNavy px-4 text-white shadow-sm md:hidden">
        <div className="min-w-0">
          <Link className="inline-block" to="/">
            <img alt="Jooblie" className="h-8 w-auto" src={logoUrl} />
          </Link>
          <p className="truncate text-xs text-blue-100">{displayName}</p>
        </div>
        <button
          aria-controls="dashboard-sidebar"
          aria-expanded={menuOpen}
          className="rounded-md border border-white/40 px-3 py-2 text-sm font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={() => setMenuOpen((current) => !current)}
          type="button"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </header>

      <aside
        className={`fixed inset-x-0 bottom-0 top-16 z-40 flex-col overflow-y-auto bg-brandNavy px-4 py-5 text-white shadow-xl md:sticky md:top-0 md:flex md:h-screen md:px-5 md:py-7 md:shadow-none ${
          menuOpen ? "flex" : "hidden"
        }`}
        id="dashboard-sidebar"
      >
        <div className="hidden md:block">
          <Link className="inline-block" to="/">
            <img alt="Jooblie" className="h-10 w-auto" src={logoUrl} />
          </Link>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-blue-200">
            {roleLabel}
          </p>
        </div>

        <div className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 md:mt-8">
          <p className="truncate font-bold">{displayName}</p>
          <p className="mt-1 text-xs text-blue-200">{roleLabel}</p>
        </div>

        <nav
          aria-label={
            isRecruiter
              ? "Recruiter dashboard navigation"
              : "Job seeker dashboard navigation"
          }
          className="mt-6 space-y-1.5"
        >
          {navItems.map((item) => {
            const active = isNavItemActive(
              item,
              location.pathname,
              location.hash,
            );

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`block rounded-md px-4 py-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white ${
                  active
                    ? "bg-primary text-white"
                    : "text-blue-50 hover:bg-white/10 hover:text-white"
                }`}
                key={item.key}
                onClick={() => setMenuOpen(false)}
                to={item.to}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/15 pt-5">
          <button
            className="w-full rounded-md px-4 py-3 text-left text-sm font-semibold text-blue-50 hover:bg-white/10 hover:text-white disabled:opacity-60"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            type="button"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
