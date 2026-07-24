import {
  toUserMessage,
  useMyApplications,
  useSavedJobs,
  useToggleSaveJob,
  useUpdateApplicationStatus,
  type ApplicationStatus,
} from "@jooblie/core";
import { Link } from "react-router-dom";

import { Container } from "../components/Container";
import { JobCard } from "../components/JobCard";
import {
  applicationStatusLabels,
  formatPostedDate,
} from "../job-format";

type DashboardPageProps = {
  readonly focus?: "applications" | "saved";
};

const terminalStatuses = new Set<ApplicationStatus>([
  "hired",
  "rejected",
  "withdrawn",
]);

const statusClasses: Readonly<Record<ApplicationStatus, string>> = {
  submitted: "bg-blue-50 text-blue-800",
  viewed: "bg-cyan-50 text-cyan-800",
  shortlisted: "bg-indigo-50 text-indigo-800",
  interviewing: "bg-violet-50 text-violet-800",
  offered: "bg-amber-50 text-amber-900",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-slate-200 text-slate-700",
};

export function DashboardPage({
  focus = "applications",
}: DashboardPageProps) {
  const applicationsQuery = useMyApplications();
  const savedJobsQuery = useSavedJobs();
  const updateStatusMutation = useUpdateApplicationStatus();
  const toggleSaveMutation = useToggleSaveJob();

  const withdraw = (applicationId: string) => {
    const confirmed = window.confirm(
      "Withdraw this application? This cannot be undone, and you cannot re-apply to this job in Jooblie v1.",
    );

    if (!confirmed) {
      return;
    }

    updateStatusMutation.mutate({
      applicationId,
      status: "withdrawn",
    });
  };

  const unsave = (jobId: string, siteId: number) => {
    toggleSaveMutation.mutate({
      jobId,
      saved: false,
      savedViaSiteId: siteId,
    });
  };

  const hasError = applicationsQuery.isError || savedJobsQuery.isError;

  return (
    <Container className="py-10 sm:py-14">
      <p className="text-sm font-bold uppercase tracking-wider text-primary">
        Job seeker account
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        {focus === "saved" ? "Saved jobs" : "Your dashboard"}
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted">
        Track applications across the Jooblie network and return to jobs you
        saved for later.
      </p>

      <nav className="mt-7 flex gap-3" aria-label="Dashboard sections">
        <Link
          className={`rounded-md px-4 py-2 text-sm font-bold ${
            focus === "applications"
              ? "bg-brandNavy text-white"
              : "border border-border bg-white"
          }`}
          to="/dashboard"
        >
          Applications
        </Link>
        <Link
          className={`rounded-md px-4 py-2 text-sm font-bold ${
            focus === "saved"
              ? "bg-brandNavy text-white"
              : "border border-border bg-white"
          }`}
          to="/saved"
        >
          Saved jobs
        </Link>
      </nav>

      {hasError ? (
        <div
          className="mt-7 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
          role="alert"
        >
          {toUserMessage(
            applicationsQuery.error ?? savedJobsQuery.error,
          )}
        </div>
      ) : null}

      {focus === "applications" ? (
        <section className="mt-9">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold">Applications</h2>
            {applicationsQuery.data ? (
              <span className="text-sm text-muted">
                {applicationsQuery.data.length} total
              </span>
            ) : null}
          </div>

          {applicationsQuery.isLoading ? (
            <div className="mt-4 space-y-3">
              {["application-one", "application-two"].map((key) => (
                <div
                  className="h-36 animate-pulse rounded-xl border border-border bg-white"
                  key={key}
                />
              ))}
            </div>
          ) : null}

          {applicationsQuery.data?.length === 0 ? (
            <div className="mt-4 rounded-xl border border-border bg-white p-8 text-center">
              <h3 className="text-xl font-bold">No applications yet</h3>
              <p className="mt-2 text-muted">
                Browse active roles and submit your first application.
              </p>
              <Link
                className="mt-5 inline-block rounded-md bg-primary px-5 py-2.5 font-bold text-white"
                to="/jobs"
              >
                Browse jobs
              </Link>
            </div>
          ) : null}

          {applicationsQuery.data && applicationsQuery.data.length > 0 ? (
            <div className="mt-4 space-y-3">
              {applicationsQuery.data.map((application) => (
                <article
                  className="rounded-xl border border-border bg-white p-5 shadow-sm"
                  key={application.id}
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-sm font-medium text-muted">
                        {application.jobs.companies.name}
                      </p>
                      <h3 className="mt-1 text-lg font-bold">
                        <Link
                          className="hover:text-primary"
                          to={`/jobs/${application.job_id}`}
                        >
                          {application.jobs.title}
                        </Link>
                      </h3>
                      <p className="mt-2 text-sm text-muted">
                        Applied {formatPostedDate(application.created_at)}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${statusClasses[application.status]}`}
                    >
                      {applicationStatusLabels[application.status]}
                    </span>
                  </div>

                  {!terminalStatuses.has(application.status) ? (
                    <div className="mt-4 border-t border-border pt-4">
                      <button
                        className="text-sm font-semibold text-red-700 underline underline-offset-4 disabled:opacity-50"
                        disabled={
                          updateStatusMutation.isPending &&
                          updateStatusMutation.variables?.applicationId ===
                            application.id
                        }
                        onClick={() => withdraw(application.id)}
                        type="button"
                      >
                        {updateStatusMutation.isPending &&
                        updateStatusMutation.variables?.applicationId ===
                          application.id
                          ? "Withdrawing…"
                          : "Withdraw application"}
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}

          {updateStatusMutation.isError ? (
            <p className="mt-4 text-sm text-red-700" role="alert">
              {updateStatusMutation.error.message}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className={focus === "saved" ? "mt-9" : "mt-14"} id="saved">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Saved jobs</h2>
          {savedJobsQuery.data ? (
            <span className="text-sm text-muted">
              {savedJobsQuery.data.length} total
            </span>
          ) : null}
        </div>

        {savedJobsQuery.isLoading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {["saved-one", "saved-two"].map((key) => (
              <div
                className="h-52 animate-pulse rounded-xl border border-border bg-white"
                key={key}
              />
            ))}
          </div>
        ) : null}

        {savedJobsQuery.data?.length === 0 ? (
          <div className="mt-4 rounded-xl border border-border bg-white p-8 text-center">
            <h3 className="text-xl font-bold">No saved jobs</h3>
            <p className="mt-2 text-muted">
              Save interesting roles while browsing, then return to them here.
            </p>
            <Link
              className="mt-5 inline-block font-bold text-primary underline"
              to="/jobs"
            >
              Browse jobs
            </Link>
          </div>
        ) : null}

        {savedJobsQuery.data && savedJobsQuery.data.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {savedJobsQuery.data.map((savedJob) => (
              <JobCard
                actions={
                  <button
                    className="text-sm font-semibold text-red-700 underline disabled:opacity-50"
                    disabled={
                      toggleSaveMutation.isPending &&
                      toggleSaveMutation.variables?.jobId === savedJob.job_id
                    }
                    onClick={() =>
                      unsave(savedJob.job_id, savedJob.saved_via_site_id)
                    }
                    type="button"
                  >
                    {toggleSaveMutation.isPending &&
                    toggleSaveMutation.variables?.jobId === savedJob.job_id
                      ? "Removing…"
                      : "Unsave"}
                  </button>
                }
                job={savedJob.jobs}
                key={savedJob.job_id}
              />
            ))}
          </div>
        ) : null}

        {toggleSaveMutation.isError ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {toggleSaveMutation.error.message}
          </p>
        ) : null}
      </section>
    </Container>
  );
}
