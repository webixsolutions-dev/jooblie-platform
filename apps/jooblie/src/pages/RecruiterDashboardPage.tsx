import {
  useMyCompany,
  useMyJobs,
} from "@jooblie/core";
import { Link } from "react-router-dom";

import { Container } from "../components/Container";
import { LoadingPage } from "../components/LoadingPage";
import {
  companyVerificationLabels,
  formatDate,
  jobStatusClasses,
  jobStatusLabels,
} from "../recruiter-format";

export function RecruiterDashboardPage() {
  const companyQuery = useMyCompany();
  const company = companyQuery.data?.companies ?? null;
  const jobsQuery = useMyJobs(company?.id ?? null);

  if (companyQuery.isLoading) {
    return <LoadingPage />;
  }

  if (companyQuery.isError) {
    return (
      <Container className="py-12">
        <div
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
          role="alert"
        >
          {companyQuery.error.message}
        </div>
      </Container>
    );
  }

  if (!company) {
    return (
      <Container className="py-10 sm:py-14">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">
          Recruiter workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Start hiring on Jooblie
        </h1>
        <div
          className="mt-8 rounded-xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8"
          id="company"
        >
          <h2 className="text-2xl font-bold">
            Create your company profile first
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            Jooblie needs your company details before you can post a job.
            Creating the profile takes only a few minutes.
          </p>
          <Link
            className="mt-6 inline-block rounded-md bg-primary px-5 py-3 font-bold text-white hover:bg-blue-700"
            to="/recruiter/company/new"
          >
            Create company profile
          </Link>
        </div>
      </Container>
    );
  }

  const recentJobs = jobsQuery.data?.slice(0, 3) ?? [];

  return (
    <Container className="py-10 sm:py-14">
      <div
        className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"
        id="company"
      >
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-primary">
            Recruiter workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {company.name}
          </h1>
          <p className="mt-3 text-muted">
            Manage your company’s Jooblie hiring activity.
          </p>
        </div>
        {company.verification_status !== "rejected" ? (
          <Link
            className="w-fit rounded-md bg-primary px-5 py-3 font-bold text-white hover:bg-blue-700"
            to="/recruiter/jobs/new"
          >
            Post a Job
          </Link>
        ) : null}
      </div>

      {company.verification_status === "pending" ? (
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-900">
          <h2 className="font-bold">Your company is awaiting verification</h2>
          <p className="mt-1 leading-7">
            You can post jobs now; they’ll go live automatically once
            approved.
          </p>
        </div>
      ) : null}

      {company.verification_status === "rejected" ? (
        <div
          className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"
          role="alert"
        >
          <h2 className="font-bold">Company verification was rejected</h2>
          <p className="mt-2 leading-7">
            {company.rejection_reason ??
              "Jooblie could not verify the submitted company details."}
          </p>
          <p className="mt-2 leading-7">
            Company editing is not available yet. Contact Jooblie support to
            correct your details and request another review.
          </p>
        </div>
      ) : null}

      {company.status === "suspended" ? (
        <div
          className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800"
          role="alert"
        >
          This company is suspended. Contact Jooblie support for assistance.
        </div>
      ) : null}

      <section className="mt-9 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-muted">Company status</p>
          <p className="mt-2 text-2xl font-bold">
            {companyVerificationLabels[company.verification_status]}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-muted">Jobs posted</p>
          <p className="mt-2 text-3xl font-bold">
            {jobsQuery.isLoading ? "…" : (jobsQuery.data?.length ?? 0)}
          </p>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Recent jobs</h2>
          <Link
            className="text-sm font-bold text-primary hover:underline"
            to="/recruiter/jobs"
          >
            View all jobs
          </Link>
        </div>

        {jobsQuery.isError ? (
          <p
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            role="alert"
          >
            {jobsQuery.error.message}
          </p>
        ) : null}

        {!jobsQuery.isLoading && recentJobs.length === 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-white p-7">
            <h3 className="text-lg font-bold">No jobs yet</h3>
            <p className="mt-2 text-muted">
              Your most recent job postings will appear here.
            </p>
          </div>
        ) : null}

        {recentJobs.length > 0 ? (
          <div className="mt-4 space-y-3">
            {recentJobs.map((job) => (
              <article
                className="flex flex-col justify-between gap-4 rounded-xl border border-border bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                key={job.id}
              >
                <div>
                  <h3 className="text-lg font-bold">{job.title}</h3>
                  <p className="mt-1 text-sm text-muted">
                    Created {formatDate(job.created_at)}
                  </p>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${jobStatusClasses[job.status]}`}
                >
                  {jobStatusLabels[job.status]}
                </span>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </Container>
  );
}
