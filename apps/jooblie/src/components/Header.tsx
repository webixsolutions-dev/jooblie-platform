import { useState } from "react";
import { useAuth } from "@jooblie/core";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { Container } from "./Container";

const navLinkClass = ({ isActive }: { readonly isActive: boolean }) =>
  `rounded px-1 py-1 text-sm font-semibold text-white outline-none hover:text-blue-200 focus-visible:ring-2 focus-visible:ring-white ${
    isActive ? "underline decoration-2 underline-offset-8" : ""
  }`;

export function Header() {
  const { initialized, user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

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
    <header className="sticky top-0 z-50 bg-brandNavy text-white shadow-sm">
      <Container className="flex min-h-16 flex-wrap items-center justify-between gap-x-5 gap-y-3 py-3">
        <div className="flex items-center gap-6">
          <Link className="text-2xl font-bold tracking-tight" to="/">
            Jooblie
          </Link>
          <NavLink className={navLinkClass} to="/jobs">
            Jobs
          </NavLink>
        </div>

        {initialized && !user ? (
          <nav
            className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2"
            aria-label="Main navigation"
          >
            <NavLink className={navLinkClass} to="/signup?role=recruiter">
              For Employers
            </NavLink>
            <NavLink className={navLinkClass} to="/login">
              Sign In
            </NavLink>
            <Link
              className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-blue-600"
              to="/signup"
            >
              Sign Up
            </Link>
          </nav>
        ) : null}

        {initialized && user && role === "job_seeker" ? (
          <nav
            className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2"
            aria-label="Job seeker"
          >
            <NavLink className={navLinkClass} to="/dashboard">
              Dashboard
            </NavLink>
            <NavLink className={navLinkClass} to="/saved">
              Saved
            </NavLink>
            <button
              className="rounded px-1 py-1 text-sm font-semibold text-white hover:text-blue-200 disabled:opacity-60"
              disabled={signingOut}
              onClick={handleSignOut}
              type="button"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </nav>
        ) : null}

        {initialized && user && role === "recruiter" ? (
          <nav
            className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2"
            aria-label="Recruiter"
          >
            <NavLink className={navLinkClass} to="/recruiter/jobs">
              My Jobs
            </NavLink>
            <NavLink className={navLinkClass} to="/recruiter/jobs/new">
              Post a Job
            </NavLink>
            <button
              className="rounded px-1 py-1 text-sm font-semibold text-white hover:text-blue-200 disabled:opacity-60"
              disabled={signingOut}
              onClick={handleSignOut}
              type="button"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </nav>
        ) : null}
      </Container>
    </header>
  );
}
