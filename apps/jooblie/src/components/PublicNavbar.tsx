import { useEffect, useState } from "react";
import { useAuth } from "@jooblie/core";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import logoUrl from "../assets/logo.png";
import { Container } from "./Container";

interface NavItem {
  readonly label: string;
  readonly primary?: boolean;
  readonly to: string;
}

const standardLinkClass = ({ isActive }: { readonly isActive: boolean }) =>
  `rounded-md px-2 py-2 text-sm font-semibold outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brandNavy ${
    isActive
      ? "text-white underline decoration-primary decoration-2 underline-offset-8"
      : "text-white/80"
  }`;

const navItemClass = (
  { isActive }: { readonly isActive: boolean },
  primary = false,
) => {
  if (primary) {
    return `rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-white outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brandNavy ${
      isActive ? "ring-2 ring-white/70" : ""
    }`;
  }

  return standardLinkClass({ isActive });
};

export function PublicNavbar() {
  const { initialized, user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpenLocationKey, setMenuOpenLocationKey] = useState<string | null>(
    null,
  );
  const [signingOut, setSigningOut] = useState(false);
  const menuOpen = menuOpenLocationKey === location.key;

  const navItems: readonly NavItem[] = !initialized
    ? []
    : !user
      ? [
          { label: "Sign in", to: "/login" },
          { label: "Get started", primary: true, to: "/signup" },
        ]
      : role === "job_seeker"
        ? [
            { label: "Dashboard", to: "/dashboard" },
            { label: "Saved", to: "/saved" },
          ]
        : role === "recruiter"
          ? [
              { label: "My Jobs", to: "/recruiter/jobs" },
              {
                label: "Post a Job",
                primary: true,
                to: "/recruiter/jobs/new",
              },
            ]
          : [];

  const showSignOut =
    initialized &&
    Boolean(user) &&
    (role === "job_seeker" || role === "recruiter");

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpenLocationKey(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => document.removeEventListener("keydown", handleEscape);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpenLocationKey(null);

  const handleSignOut = async () => {
    setSigningOut(true);
    closeMenu();

    try {
      await signOut();
      navigate("/", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  const renderNavItem = (item: NavItem) => (
    <NavLink
      className={(state) => navItemClass(state, item.primary)}
      key={item.to}
      onClick={closeMenu}
      to={item.to}
    >
      {item.label}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/15 bg-brandNavy text-white shadow-sm">
      <nav aria-label="Public navigation">
        <Container className="flex min-h-16 min-w-0 items-center justify-between gap-3 py-2">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <Link
              className="shrink-0 rounded outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brandNavy"
              onClick={closeMenu}
              to="/"
            >
              <img
                alt="Jooblie"
                className="h-10 w-auto"
                src={logoUrl}
              />
            </Link>
            <NavLink
              className={standardLinkClass}
              onClick={closeMenu}
              to="/jobs"
            >
              Jobs
            </NavLink>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map(renderNavItem)}
            {showSignOut ? (
              <button
                className="rounded-md px-2 py-2 text-sm font-semibold text-white/80 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brandNavy disabled:cursor-not-allowed disabled:opacity-60"
                disabled={signingOut}
                onClick={() => void handleSignOut()}
                type="button"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            ) : null}
          </div>

          <button
            aria-controls="public-mobile-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex size-11 shrink-0 items-center justify-center rounded-md border border-white/30 outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brandNavy md:hidden"
            onClick={() =>
              setMenuOpenLocationKey((current) =>
                current === location.key ? null : location.key,
              )
            }
            type="button"
          >
            <span aria-hidden="true" className="flex w-5 flex-col gap-1.5">
              <span className="block h-0.5 w-full rounded bg-white" />
              <span className="block h-0.5 w-full rounded bg-white" />
              <span className="block h-0.5 w-full rounded bg-white" />
            </span>
          </button>
        </Container>

        {menuOpen ? (
          <div
            className="border-t border-white/15 md:hidden"
            id="public-mobile-menu"
          >
            <Container className="flex min-w-0 flex-col gap-1 py-3">
              {navItems.map(renderNavItem)}
              {showSignOut ? (
                <button
                  className="rounded-md px-2 py-2.5 text-left text-sm font-semibold text-white/80 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={signingOut}
                  onClick={() => void handleSignOut()}
                  type="button"
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              ) : null}
            </Container>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
