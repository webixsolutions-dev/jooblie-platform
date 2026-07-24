import {
  toUserMessage,
  useAuth,
  useJob,
} from "@jooblie/core";
import { Link, useParams } from "react-router-dom";

import { CompanyLogo } from "../components/CompanyLogo";
import { Container } from "../components/Container";
import { SeekerJobActions } from "../components/SeekerJobActions";
import {
  formatEmploymentType,
  formatJobLocation,
  formatPostedDate,
  formatSalary,
} from "../job-format";

export function JobDetailPage() {
  const { id = "" } = useParams();
  const jobQuery = useJob(id);
  const { initialized, role, user } = useAuth();

  if (jobQuery.isLoading) {
    return (
      <Container className="py-12">
        <div
          aria-label="Loading job details"
          className="h-[34rem] animate-pulse rounded-xl border border-border bg-white"
        />
      </Container>
    );
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <Container className="py-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-7" role="alert">
          <h1 className="text-2xl font-bold">Job not available</h1>
          <p className="mt-2 text-red-700">
            {jobQuery.isError
              ? toUserMessage(jobQuery.error)
              : "We couldn't find this job."}
          </p>
          <Link
            className="mt-5 inline-block font-semibold text-primary underline"
            to="/jobs"
          >
            Browse current jobs
          </Link>
        </div>
      </Container>
    );
  }

  const job = jobQuery.data;
  const salary = formatSalary(job);

  return (
    <Container className="py-10 sm:py-14">
      {job.status !== "active" ? (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900">
          <p className="font-bold">Job status: {job.status.replace("_", " ")}</p>
          <p className="mt-1 text-sm">
            This listing is retained because you previously applied to or saved it.
          </p>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <article className="min-w-0 rounded-xl border border-border bg-white p-6 shadow-sm sm:p-9">
          <div className="flex items-start gap-5">
            <CompanyLogo
              companyName={job.companies.name}
              logoPath={job.companies.logo_path}
              size="md"
            />
            <div>
              <p className="font-semibold text-primary">{job.categories.name}</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {job.title}
              </h1>
              <p className="mt-2 text-lg font-semibold text-muted">
                {job.companies.name}
              </p>
            </div>
          </div>

          <dl className="mt-7 grid gap-4 border-y border-border py-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-muted">Location</dt>
              <dd className="mt-1 font-medium">{formatJobLocation(job)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Employment type</dt>
              <dd className="mt-1 font-medium">
                {formatEmploymentType(job.employment_type)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Salary</dt>
              <dd className="mt-1 font-medium">{salary ?? "Not specified"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-muted">Posted</dt>
              <dd className="mt-1 font-medium">
                {formatPostedDate(job.published_at)}
              </dd>
            </div>
          </dl>

          {job.skills.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-xl font-bold">Skills</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <li
                    className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-primary"
                    key={skill}
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-9 max-w-3xl">
            <h2 className="text-2xl font-bold">About this role</h2>
            <div className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700">
              {job.description}
            </div>
          </section>
        </article>

        <aside>
          <div className="sticky top-24 rounded-xl border border-border bg-white p-5 shadow-sm">
            {!initialized ? (
              <div className="h-24 animate-pulse rounded-md bg-background" />
            ) : !user ? (
              <Link
                className="block w-full rounded-md bg-primary px-5 py-3 text-center font-bold text-white hover:bg-blue-700"
                to={`/login?next=/jobs/${job.id}`}
              >
                Sign in to apply
              </Link>
            ) : role === "job_seeker" ? (
              <SeekerJobActions job={job} userId={user.id} />
            ) : (
              <p className="rounded-md bg-background px-4 py-3 text-sm leading-6 text-muted">
                Recruiter and admin accounts cannot apply to jobs.
              </p>
            )}
          </div>
        </aside>
      </div>
    </Container>
  );
}
