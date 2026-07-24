import { useState } from "react";
import { useAuth } from "@jooblie/core";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { Container } from "./Container";

const navLinkClass = ({ isActive }: { readonly isActive: boolean }) =>
  `text-sm font-medium hover:text-primary ${
    isActive ? "text-primary" : "text-muted"
  }`;

export function Header() {
  const { initialized, user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      await signOut();
      navigate("/", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="border-b border-border bg-white">
      <Container className="flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-5">
          <Link className="text-xl font-bold tracking-tight text-primary" to="/">
            Jooblie
          </Link>
          <NavLink className={navLinkClass} to="/jobs">
            Jobs
          </NavLink>
        </div>

        {initialized && !user ? (
          <nav className="flex items-center gap-3" aria-label="Account">
            <NavLink className={navLinkClass} to="/login">
              Log in
            </NavLink>
            <Link
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              to="/signup"
            >
              Sign up
            </Link>
          </nav>
        ) : null}

        {initialized && user && role === "job_seeker" ? (
          <nav
            className="flex flex-wrap items-center justify-end gap-3"
            aria-label="Job seeker"
          >
            <NavLink className={navLinkClass} to="/dashboard">
              Dashboard
            </NavLink>
            <NavLink className={navLinkClass} to="/saved">
              Saved
            </NavLink>
            <button
              className="text-sm font-medium text-muted hover:text-primary disabled:opacity-60"
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
            className="flex flex-wrap items-center justify-end gap-3"
            aria-label="Recruiter"
          >
            <NavLink className={navLinkClass} to="/recruiter/jobs/new">
              Post a Job
            </NavLink>
            <NavLink className={navLinkClass} to="/recruiter/jobs">
              My Jobs
            </NavLink>
            <button
              className="text-sm font-medium text-muted hover:text-primary disabled:opacity-60"
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
