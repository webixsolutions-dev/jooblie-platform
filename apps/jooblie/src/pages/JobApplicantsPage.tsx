import { useState } from "react";
import {
  getSupabaseClient,
  useJobApplicants,
  useMyCompany,
  useMyJobs,
  useUpdateApplicationStatus,
  type ApplicationStatus,
} from "@jooblie/core";
import { Link, useParams } from "react-router-dom";

import { Container } from "../components/Container";
import { LoadingPage } from "../components/LoadingPage";
import {
  applicationStatusLabels,
} from "../job-format";
import {
  formatDate,
  getRecruiterStatusOptions,
} from "../recruiter-format";

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

export function JobApplicantsPage() {
  const { id = "" } = useParams();
  const companyQuery = useMyCompany();
  const companyId = companyQuery.data?.companies.id ?? null;
  const jobsQuery = useMyJobs(companyId);
  const job = jobsQuery.data?.find((candidate) => candidate.id === id) ?? null;
  const applicantsQuery = useJobApplicants(job?.id ?? null);
  const updateStatusMutation = useUpdateApplicationStatus();
  const [openingResumeId, setOpeningResumeId] = useState<string | null>(null);
  const [resumeErrors, setResumeErrors] = useState<
    Readonly<Record<string, string>>
  >({});

  if (
    companyQuery.isLoading ||
    jobsQuery.isLoading ||
    (job && applicantsQuery.isLoading)
  ) {
    return <LoadingPage />;
  }

  const openResume = async (
    applicationId: string,
    resumePath: string,
  ) => {
    setOpeningResumeId(applicationId);
    setResumeErrors((current) => {
      const next = { ...current };
      delete next[applicationId];
      return next;
    });

    try {
      const { data, error } = await getSupabaseClient()
        .storage.from("resumes")
        .createSignedUrl(resumePath, 60);

      if (error) {
        throw error;
      }

      window.location.assign(data.signedUrl);
    } catch {
      setResumeErrors((current) => ({
        ...current,
        [applicationId]:
          "We could not open this résumé. You may not have access to this file.",
      }));
    } finally {
      setOpeningResumeId(null);
    }
  };

  const updateStatus = (
    applicationId: string,
    status: ApplicationStatus,
  ) => {
    updateStatusMutation.mutate({ applicationId, status });
  };

  const hasQueryError =
    companyQuery.isError || jobsQuery.isError || applicantsQuery.isError;

  if (!job && !jobsQuery.isLoading && !hasQueryError) {
    return (
      <Container className="py-14">
        <div className="rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold">Job not found</h1>
          <p className="mt-2 text-muted">
            This job does not belong to your company or is no longer
            available.
          </p>
          <Link
            className="mt-5 inline-block font-bold text-primary underline underline-offset-4"
            to="/recruiter/jobs"
          >
            Return to my jobs
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10 sm:py-14">
      <Link
        className="text-sm font-semibold text-primary hover:underline"
        to="/recruiter/jobs"
      >
        ← My jobs
      </Link>
      <p className="mt-6 text-sm font-bold uppercase tracking-wider text-primary">
        Applicants
      </p>
      <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {job?.title}
          </h1>
          <p className="mt-3 text-muted">
            Review candidates and move them through the hiring process.
          </p>
        </div>
        {applicantsQuery.data ? (
          <p className="text-sm font-semibold text-muted">
            {applicantsQuery.data.length}{" "}
            {applicantsQuery.data.length === 1 ? "applicant" : "applicants"}
          </p>
        ) : null}
      </div>

      {hasQueryError ? (
        <div
          className="mt-7 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700"
          role="alert"
        >
          {companyQuery.error?.message ??
            jobsQuery.error?.message ??
            applicantsQuery.error?.message}
        </div>
      ) : null}

      {applicantsQuery.data?.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold">No applicants yet</h2>
          <p className="mt-2 text-muted">
            New applications for this job will appear here.
          </p>
        </div>
      ) : null}

      {applicantsQuery.data && applicantsQuery.data.length > 0 ? (
        <div className="mt-8 space-y-4">
          {applicantsQuery.data.map((application) => {
            const statusOptions = getRecruiterStatusOptions(
              application.status,
            );
            const isUpdating =
              updateStatusMutation.isPending &&
              updateStatusMutation.variables?.applicationId ===
                application.id;

            return (
              <article
                className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6"
                key={application.id}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <h2 className="text-xl font-bold">
                      {application.profiles.full_name ?? "Applicant"}
                    </h2>
                    {application.profiles.headline ? (
                      <p className="mt-1 text-muted">
                        {application.profiles.headline}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted">
                      Applied {formatDate(application.created_at)}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${statusClasses[application.status]}`}
                  >
                    {applicationStatusLabels[application.status]}
                  </span>
                </div>

                {application.profiles.skills?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {application.profiles.skills.map((skill) => (
                      <span
                        className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted"
                        key={skill}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : null}

                {application.cover_letter ? (
                  <details className="mt-5 rounded-lg border border-border bg-background p-4">
                    <summary className="cursor-pointer font-semibold">
                      Cover letter
                    </summary>
                    <p className="mt-3 whitespace-pre-line leading-7 text-muted">
                      {application.cover_letter}
                    </p>
                  </details>
                ) : null}

                <div className="mt-5 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <button
                      className="font-bold text-primary underline underline-offset-4 disabled:opacity-50"
                      disabled={openingResumeId === application.id}
                      onClick={() =>
                        void openResume(
                          application.id,
                          application.resume_path,
                        )
                      }
                      type="button"
                    >
                      {openingResumeId === application.id
                        ? "Opening résumé…"
                        : "Open résumé"}
                    </button>
                    {resumeErrors[application.id] ? (
                      <p
                        className="mt-2 max-w-sm text-sm text-red-700"
                        role="alert"
                      >
                        {resumeErrors[application.id]}
                      </p>
                    ) : null}
                  </div>

                  {statusOptions.length > 0 ? (
                    <label className="block text-sm font-semibold">
                      Update status
                      <select
                        className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-blue-100 sm:w-52"
                        disabled={isUpdating}
                        key={application.status}
                        onChange={(event) => {
                          const nextStatus = event.target
                            .value as ApplicationStatus;
                          if (nextStatus) {
                            updateStatus(application.id, nextStatus);
                          }
                        }}
                        value=""
                      >
                        <option value="">
                          {isUpdating ? "Updating…" : "Choose next status"}
                        </option>
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {applicationStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <p className="text-sm font-semibold text-muted">
                      No further actions
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {updateStatusMutation.isError ? (
        <p
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          role="alert"
        >
          {updateStatusMutation.error.message}
        </p>
      ) : null}
    </Container>
  );
}
