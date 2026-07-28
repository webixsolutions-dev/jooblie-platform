import { getSiteById, siteRegistry } from "@jooblie/core";
import { useState } from "react";
import { Link } from "react-router-dom";

import { getAdminErrorMessage } from "../admin-errors";
import { ExplorerFilters } from "../components/ExplorerFilters";
import { ExplorerPagination } from "../components/ExplorerPagination";
import {
  ExplorerTable,
  type ExplorerColumn,
} from "../components/ExplorerTable";
import {
  createApplicationResumeSignedUrl,
  useApplicationsExplorer,
  type ApplicationExplorerFilters,
  type ApplicationExplorerRow,
} from "../queries/applications";
import { EXPLORER_PAGE_SIZE } from "../queries/explorer";

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
});

function createEmptyFilters(): ApplicationExplorerFilters {
  return {
    applicantId: "",
    appliedViaSiteId: "",
    createdFrom: "",
    createdTo: "",
    jobId: "",
    jobTitle: "",
    status: "",
    statusUpdatedFrom: "",
    statusUpdatedTo: "",
  };
}

function normalizeFilters(
  filters: ApplicationExplorerFilters,
): ApplicationExplorerFilters {
  return {
    ...filters,
    applicantId: filters.applicantId.trim(),
    jobId: filters.jobId.trim(),
    jobTitle: filters.jobTitle.trim(),
  };
}

function hasFilters(filters: ApplicationExplorerFilters): boolean {
  return Object.values(filters).some((value) => value !== "");
}

function formatDateTime(value: string | null): string {
  return value ? dateTimeFormatter.format(new Date(value)) : "—";
}

function formatEnum(value: string): string {
  return value.replaceAll("_", " ");
}

function formatShortId(value: string): string {
  return `${value.slice(0, 8)}…`;
}

function getSiteLabel(siteId: number): string {
  return getSiteById(siteId)?.name ?? `Site ${siteId}`;
}

function getApplicantLabel(
  application: ApplicationExplorerRow,
): string {
  return (
    application.applicant.full_name ??
    application.applicant.email ??
    application.applicant_id
  );
}

function getApplicationStatus(
  value: string,
): ApplicationExplorerFilters["status"] {
  return value === "submitted" ||
    value === "viewed" ||
    value === "shortlisted" ||
    value === "interviewing" ||
    value === "offered" ||
    value === "hired" ||
    value === "rejected" ||
    value === "withdrawn"
    ? value
    : "";
}

function ApplicationStatusBadge({
  value,
}: {
  readonly value: ApplicationExplorerRow["status"];
}) {
  const tone =
    value === "hired" || value === "offered"
      ? "bg-green-100 text-green-800"
      : value === "rejected" || value === "withdrawn"
        ? "bg-red-100 text-red-800"
        : value === "submitted"
          ? "bg-blue-100 text-blue-800"
          : "bg-amber-100 text-amber-800";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}
    >
      {formatEnum(value)}
    </span>
  );
}

function ApplicationDetail({
  application,
  isOpeningResume,
  onViewResume,
  resumeError,
}: {
  readonly application: ApplicationExplorerRow;
  readonly isOpeningResume: boolean;
  readonly onViewResume: (application: ApplicationExplorerRow) => void;
  readonly resumeError: string | null;
}) {
  const historySearch = new URLSearchParams({
    entity_type: "application",
    entity_id: application.id,
  });

  return (
    <article className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Application detail
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {application.job.title}
          </h2>
          <p className="mt-2 break-all text-sm text-muted">
            {application.id}
          </p>
        </div>
        <Link
          className="rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-slate-50"
          to={`/activity?${historySearch.toString()}`}
        >
          View history
        </Link>
      </div>

      <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Updated
          </dt>
          <dd className="mt-1 text-sm">
            {formatDateTime(application.updated_at)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Deleted
          </dt>
          <dd className="mt-1 text-sm">
            {formatDateTime(application.deleted_at)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Résumé
          </dt>
          <dd className="mt-2">
            <button
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isOpeningResume}
              onClick={() => onViewResume(application)}
              type="button"
            >
              {isOpeningResume ? "Opening résumé…" : "View résumé"}
            </button>
            {resumeError ? (
              <p
                className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                role="alert"
              >
                {resumeError}
              </p>
            ) : null}
          </dd>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Cover letter
          </dt>
          <dd className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {application.cover_letter ?? "—"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function ApplicationsPage() {
  const [draftFilters, setDraftFilters] =
    useState<ApplicationExplorerFilters>(createEmptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ApplicationExplorerFilters>(createEmptyFilters);
  const [page, setPage] = useState(0);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);
  const [openingResumeId, setOpeningResumeId] = useState<
    string | null
  >(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const applicationsQuery = useApplicationsExplorer(
    appliedFilters,
    page,
  );
  const applications = applicationsQuery.data?.rows ?? [];
  const totalApplications = applicationsQuery.data?.total ?? 0;
  const selectedApplication =
    applications.find(
      (application) => application.id === selectedApplicationId,
    ) ?? null;
  const queryError = applicationsQuery.isError
    ? getAdminErrorMessage(
        applicationsQuery.error,
        "Please try loading the applications explorer again.",
      )
    : null;

  const selectApplication = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setResumeError(null);
  };

  const columns: readonly ExplorerColumn<ApplicationExplorerRow>[] = [
    {
      key: "id",
      header: "Application",
      className: "whitespace-nowrap",
      cell: (application) => (
        <button
          className="font-mono text-xs font-semibold text-primary hover:underline"
          onClick={() => selectApplication(application.id)}
          title={application.id}
          type="button"
        >
          {formatShortId(application.id)}
        </button>
      ),
    },
    {
      key: "job",
      header: "Job",
      className: "min-w-64",
      cell: (application) => (
        <div>
          <p className="font-semibold">{application.job.title}</p>
          <p className="mt-1 text-xs text-muted">
            {application.job.company.name}
          </p>
        </div>
      ),
    },
    {
      key: "applicant",
      header: "Applicant",
      className: "min-w-56",
      cell: (application) => (
        <div>
          <p className="font-medium">
            {getApplicantLabel(application)}
          </p>
          {application.applicant.full_name &&
          application.applicant.email ? (
            <p className="mt-1 break-all text-xs text-muted">
              {application.applicant.email}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (application) => (
        <ApplicationStatusBadge value={application.status} />
      ),
    },
    {
      key: "status_updated_at",
      header: "Status updated",
      className: "min-w-44 whitespace-nowrap",
      cell: (application) =>
        formatDateTime(application.status_updated_at),
    },
    {
      key: "site",
      header: "Applied via",
      className: "min-w-48",
      cell: (application) =>
        getSiteLabel(application.applied_via_site_id),
    },
    {
      key: "created_at",
      header: "Created",
      className: "min-w-44 whitespace-nowrap",
      cell: (application) => formatDateTime(application.created_at),
    },
  ];

  const applyFilters = () => {
    const nextFilters = normalizeFilters(draftFilters);
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setPage(0);
    setSelectedApplicationId(null);
    setResumeError(null);
  };

  const clearFilters = () => {
    const emptyFilters = createEmptyFilters();
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
    setSelectedApplicationId(null);
    setResumeError(null);
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    setSelectedApplicationId(null);
    setResumeError(null);
  };

  const viewResume = async (
    application: ApplicationExplorerRow,
  ) => {
    const resumeWindow = window.open("about:blank", "_blank");
    if (resumeWindow) {
      resumeWindow.opener = null;
    }

    setOpeningResumeId(application.id);
    setResumeError(null);

    try {
      const signedUrl = await createApplicationResumeSignedUrl(
        application.resume_path,
      );

      if (resumeWindow) {
        resumeWindow.location.replace(signedUrl);
      } else {
        const fallbackWindow = window.open(
          signedUrl,
          "_blank",
          "noopener,noreferrer",
        );

        if (!fallbackWindow) {
          throw new Error("The résumé window was blocked.");
        }
      }
    } catch {
      resumeWindow?.close();
      setResumeError(
        "This résumé was removed or is currently unavailable.",
      );
    } finally {
      setOpeningResumeId(null);
    }
  };

  return (
    <section>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
        Admin
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Applications
          </h1>
          <p className="mt-2 text-sm text-muted">
            Explore application records across every Jooblie site.
          </p>
        </div>
        <p className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
          {totalApplications} total
        </p>
      </div>

      <div className="mt-6">
        <ExplorerFilters
          hasActiveFilters={
            hasFilters(draftFilters) || hasFilters(appliedFilters)
          }
          isApplying={applicationsQuery.isFetching}
          onApply={applyFilters}
          onClear={clearFilters}
        >
          <label className="text-sm font-semibold">
            Job title
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  jobTitle: event.target.value,
                }))
              }
              placeholder="Search joined job title"
              type="search"
              value={draftFilters.jobTitle}
            />
          </label>
          <label className="text-sm font-semibold">
            Exact job ID
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  jobId: event.target.value,
                }))
              }
              placeholder="Job UUID"
              type="text"
              value={draftFilters.jobId}
            />
          </label>
          <label className="text-sm font-semibold">
            Exact applicant ID
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  applicantId: event.target.value,
                }))
              }
              placeholder="Profile UUID"
              type="text"
              value={draftFilters.applicantId}
            />
          </label>
          <label className="text-sm font-semibold">
            Status
            <select
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  status: getApplicationStatus(event.target.value),
                }))
              }
              value={draftFilters.status}
            >
              <option value="">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="viewed">Viewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interviewing">Interviewing</option>
              <option value="offered">Offered</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Applied via site
            <select
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  appliedViaSiteId: event.target.value,
                }))
              }
              value={draftFilters.appliedViaSiteId}
            >
              <option value="">All sites</option>
              {siteRegistry.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold">
            Created from
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  createdFrom: event.target.value,
                }))
              }
              type="date"
              value={draftFilters.createdFrom}
            />
          </label>
          <label className="text-sm font-semibold">
            Created to
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  createdTo: event.target.value,
                }))
              }
              type="date"
              value={draftFilters.createdTo}
            />
          </label>
          <label className="text-sm font-semibold">
            Status updated from
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  statusUpdatedFrom: event.target.value,
                }))
              }
              type="date"
              value={draftFilters.statusUpdatedFrom}
            />
          </label>
          <label className="text-sm font-semibold">
            Status updated to
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  statusUpdatedTo: event.target.value,
                }))
              }
              type="date"
              value={draftFilters.statusUpdatedTo}
            />
          </label>
        </ExplorerFilters>
      </div>

      <div className="mt-6">
        <ExplorerTable
          ariaLabel="Applications explorer"
          columns={columns}
          emptyMessage="Try clearing or changing the applied filters."
          emptyTitle="No applications found"
          errorMessage={queryError}
          getRowKey={(application) => application.id}
          isLoading={applicationsQuery.isLoading}
          loadingLabel="Loading applications…"
          onRetry={() => void applicationsQuery.refetch()}
          rows={applications}
          selectedRowKey={selectedApplicationId}
        />
        {!applicationsQuery.isLoading && !queryError ? (
          <ExplorerPagination
            disabled={applicationsQuery.isFetching}
            onPageChange={changePage}
            page={page}
            pageSize={EXPLORER_PAGE_SIZE}
            totalRows={totalApplications}
          />
        ) : null}
      </div>

      <div className="mt-6">
        {selectedApplication ? (
          <ApplicationDetail
            application={selectedApplication}
            isOpeningResume={
              openingResumeId === selectedApplication.id
            }
            onViewResume={(application) => void viewResume(application)}
            resumeError={resumeError}
          />
        ) : (
          <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <div>
              <h2 className="text-lg font-semibold">
                Select an application to inspect
              </h2>
              <p className="mt-2 text-sm text-muted">
                Application details and on-demand résumé access appear
                here.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
