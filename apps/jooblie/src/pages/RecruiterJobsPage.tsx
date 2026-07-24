import {
  useMyCompany,
  useMyJobs,
} from "@jooblie/core";
import { Link } from "react-router-dom";

import { Container } from "../components/Container";
import { LoadingPage } from "../components/LoadingPage";
import {
  formatDate,
  jobStatusClasses,
  jobStatusLabels,
} from "../recruiter-format";

export function RecruiterJobsPage() {
  const companyQuery = useMyCompany();
  const company = companyQuery.data?.companies ?? null;
  const jobsQuery = useMyJobs(company?.id ?? null);

  if (companyQuery.isLoading) {
    return <LoadingPage />;
  }

  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-primary">
            Recruiter workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            My jobs
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted">
            Review every job posted for your company, including roles still
            awaiting verification.
          </p>
        </div>
        {company ? (
          <Link
            className="w-fit rounded-md bg-primary px-5 py-3 font-bold text-white hover:bg-blue-700"
            to="/recruiter/jobs/new"
          >
            Post a Job
          </Link>
        ) : null}
      </div>

      {companyQuery.isError || jobsQuery.isError ? (
        <div
          className="mt-7 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
          role="alert"
        >
          {companyQuery.error?.message ?? jobsQuery.error?.message}
        </div>
      ) : null}

      {!company && !companyQuery.isError ? (
        <div className="mt-8 rounded-xl border border-border bg-white p-7 shadow-sm">
          <h2 className="text-xl font-bold">
            Create your company profile first
          </h2>
          <p className="mt-2 leading-7 text-muted">
            Your company must exist before Jooblie can accept a job posting.
          </p>
          <Link
            className="mt-5 inline-block font-bold text-primary underline underline-offset-4"
            to="/recruiter/company/new"
          >
            Create company profile
          </Link>
        </div>
      ) : null}

      {company && jobsQuery.isLoading ? (
        <div className="mt-8 space-y-4">
          {["job-one", "job-two", "job-three"].map((key) => (
            <div
              className="h-44 animate-pulse rounded-xl border border-border bg-white"
              key={key}
            />
          ))}
        </div>
      ) : null}

      {company && jobsQuery.data?.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold">No jobs posted yet</h2>
          <p className="mt-2 text-muted">
            Create your first job to start reaching candidates.
          </p>
          <Link
            className="mt-5 inline-block rounded-md bg-primary px-5 py-3 font-bold text-white"
            to="/recruiter/jobs/new"
          >
            Post a Job
          </Link>
        </div>
      ) : null}

      {jobsQuery.data && jobsQuery.data.length > 0 ? (
        <div className="mt-8 space-y-4">
          {jobsQuery.data.map((job) => (
            <article
              className="rounded-xl border border-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
              key={job.id}
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {job.categories.name}
                  </p>
                  <h2 className="mt-1 text-xl font-bold">{job.title}</h2>
                </div>
                <span
                  className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${jobStatusClasses[job.status]}`}
                >
                  {jobStatusLabels[job.status]}
                </span>
              </div>

              <dl className="mt-5 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-muted">Posted</dt>
                  <dd className="mt-1">
                    {formatDate(job.published_at, "Not live yet")}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-muted">Expires</dt>
                  <dd className="mt-1">
                    {formatDate(job.expires_at, "Not scheduled")}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 border-t border-border pt-5">
                <Link
                  className="font-bold text-primary underline underline-offset-4"
                  to={`/recruiter/jobs/${job.id}/applicants`}
                >
                  View applicants
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </Container>
  );
}
