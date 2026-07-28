import { Link } from "react-router-dom";

import logoUrl from "../assets/logo.png";
import { Container } from "./Container";

const footerLinkClass =
  "rounded text-sm text-white/75 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brandNavy";

export function PublicFooter() {
  return (
    <footer className="bg-brandNavy text-white">
      <Container className="grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_1fr_1fr_1fr] lg:py-12">
        <div className="max-w-lg">
          <Link
            className="inline-block rounded outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brandNavy"
            to="/"
          >
            <img alt="Jooblie" className="h-10 w-auto" src={logoUrl} />
          </Link>
          <p className="mt-3 text-sm leading-6 text-white/75">
            Search jobs from Jooblie and our Canadian partner network — all in
            one place.
          </p>
        </div>

        <nav aria-labelledby="job-seeker-footer-heading">
          <h2
            className="text-sm font-bold"
            id="job-seeker-footer-heading"
          >
            For job seekers
          </h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link className={footerLinkClass} to="/jobs">
                Browse jobs
              </Link>
            </li>
            <li>
              <Link className={footerLinkClass} to="/login">
                Sign in
              </Link>
            </li>
            <li>
              <Link className={footerLinkClass} to="/signup">
                Create account
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="employer-footer-heading">
          <h2 className="text-sm font-bold" id="employer-footer-heading">
            For employers
          </h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link
                className={footerLinkClass}
                to="/signup?role=recruiter"
              >
                Post a job
              </Link>
            </li>
            <li>
              <Link className={footerLinkClass} to="/login">
                Recruiter sign in
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-labelledby="company-footer-heading">
          <h2 className="text-sm font-bold" id="company-footer-heading">
            Company
          </h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link className={footerLinkClass} to="/about">
                About Jooblie
              </Link>
            </li>
            <li>
              <Link className={footerLinkClass} to="/contact">
                Contact us
              </Link>
            </li>
          </ul>
        </nav>
      </Container>

      <div className="border-t border-white/15">
        <Container className="py-5 text-sm text-white/70">
          <p>© 2026 Jooblie. All rights reserved.</p>
        </Container>
      </div>
    </footer>
  );
}
