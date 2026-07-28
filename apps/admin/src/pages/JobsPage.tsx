import { getSiteById, siteRegistry } from "@jooblie/core";
import { useState } from "react";

import { getAdminErrorMessage } from "../admin-errors";
import { ExplorerFilters } from "../components/ExplorerFilters";
import { ExplorerPagination } from "../components/ExplorerPagination";
import {
  ExplorerTable,
  type ExplorerColumn,
} from "../components/ExplorerTable";
import { EXPLORER_PAGE_SIZE } from "../queries/explorer";
import {
  useJobsExplorer,
  type JobExplorerFilters,
  type JobExplorerRow,
} from "../queries/jobs";

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
});
const numberFormatter = new Intl.NumberFormat("en-CA", {
  maximumFractionDigits: 2,
});

function createEmptyFilters(): JobExplorerFilters {
  return {
    companyId: "",
    companyName: "",
    createdFrom: "",
    createdTo: "",
    originSiteId: "",
    publishedFrom: "",
    publishedTo: "",
    recruiterId: "",
    status: "",
    title: "",
  };
}

function normalizeFilters(
  filters: JobExplorerFilters,
): JobExplorerFilters {
  return {
    ...filters,
    companyId: filters.companyId.trim(),
    companyName: filters.companyName.trim(),
    recruiterId: filters.recruiterId.trim(),
    title: filters.title.trim(),
  };
}

function hasFilters(filters: JobExplorerFilters): boolean {
  return Object.values(filters).some((value) => value !== "");
}

function formatDateTime(value: string | null): string {
  return value ? dateTimeFormatter.format(new Date(value)) : "—";
}

function formatEnum(value: string): string {
  return value.replaceAll("_", " ");
}

function formatLocation(job: JobExplorerRow): string {
  const place = [job.city, job.province].filter(Boolean).join(", ");

  if (job.is_remote) {
    return place ? `${place} · Remote` : "Remote";
  }

  return place || "—";
}

function formatSalary(job: JobExplorerRow): string {
  if (job.salary_min === null && job.salary_max === null) {
    return "Not provided";
  }

  const minimum =
    job.salary_min === null
      ? null
      : numberFormatter.format(job.salary_min);
  const maximum =
    job.salary_max === null
      ? null
      : numberFormatter.format(job.salary_max);
  const range =
    minimum && maximum
      ? `${minimum}–${maximum}`
      : minimum
        ? `From ${minimum}`
        : `Up to ${maximum}`;
  const period = job.salary_period
    ? ` / ${formatEnum(job.salary_period)}`
    : "";

  return `${job.salary_currency} ${range}${period}`;
}

function getRecruiterLabel(job: JobExplorerRow): string {
  return (
    job.recruiter?.full_name ??
    job.recruiter?.email ??
    job.created_by
  );
}

function getSiteLabel(siteId: number): string {
  return getSiteById(siteId)?.name ?? `Site ${siteId}`;
}

function getJobStatus(
  value: string,
): JobExplorerFilters["status"] {
  return value === "pending_review" ||
    value === "active" ||
    value === "closed" ||
    value === "expired" ||
    value === "removed"
    ? value
    : "";
}

function JobStatusBadge({
  value,
}: {
  readonly value: JobExplorerRow["status"];
}) {
  const tone =
    value === "active"
      ? "bg-green-100 text-green-800"
      : value === "pending_review"
        ? "bg-amber-100 text-amber-800"
        : value === "removed"
          ? "bg-red-100 text-red-800"
          : "bg-slate-200 text-slate-800";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}
    >
      {formatEnum(value)}
    </span>
  );
}

function JobDetail({ job }: { readonly job: JobExplorerRow }) {
  return (
    <article className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Job detail
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
        {job.title}
      </h2>
      <p className="mt-2 break-all text-sm text-muted">{job.id}</p>

      <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Salary
          </dt>
          <dd className="mt-1 text-sm">{formatSalary(job)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Category ID
          </dt>
          <dd className="mt-1 text-sm">{job.category_id}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Updated
          </dt>
          <dd className="mt-1 text-sm">
            {formatDateTime(job.updated_at)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Deleted
          </dt>
          <dd className="mt-1 text-sm">
            {formatDateTime(job.deleted_at)}
          </dd>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Description
          </dt>
          <dd className="mt-2 whitespace-pre-wrap text-sm leading-6">
            {job.description || "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Skills
          </dt>
          <dd className="mt-2">
            {job.skills.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <li
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium"
                    key={`${skill}-${index}`}
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-sm">—</span>
            )}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Removed reason
          </dt>
          <dd className="mt-2 whitespace-pre-wrap text-sm">
            {job.removed_reason ?? "—"}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function JobsPage() {
  const [draftFilters, setDraftFilters] =
    useState<JobExplorerFilters>(createEmptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<JobExplorerFilters>(createEmptyFilters);
  const [page, setPage] = useState(0);
  const [selectedJobId, setSelectedJobId] = useState<
    string | null
  >(null);
  const jobsQuery = useJobsExplorer(appliedFilters, page);
  const jobs = jobsQuery.data?.rows ?? [];
  const totalJobs = jobsQuery.data?.total ?? 0;
  const selectedJob =
    jobs.find((job) => job.id === selectedJobId) ?? null;
  const queryError = jobsQuery.isError
    ? getAdminErrorMessage(
        jobsQuery.error,
        "Please try loading the jobs explorer again.",
      )
    : null;

  const columns: readonly ExplorerColumn<JobExplorerRow>[] = [
    {
      key: "title",
      header: "Job",
      className: "min-w-64",
      cell: (job) => (
        <button
          className="text-left font-semibold text-primary hover:underline"
          onClick={() => setSelectedJobId(job.id)}
          type="button"
        >
          {job.title}
        </button>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (job) => <JobStatusBadge value={job.status} />,
    },
    {
      key: "company",
      header: "Company",
      className: "min-w-52",
      cell: (job) => (
        <div>
          <p className="font-medium">{job.company.name}</p>
          <p className="mt-1 break-all text-xs text-muted">
            {job.company_id}
          </p>
        </div>
      ),
    },
    {
      key: "recruiter",
      header: "Recruiter",
      className: "min-w-52",
      cell: (job) => (
        <div>
          <p className="font-medium">{getRecruiterLabel(job)}</p>
          {job.recruiter?.full_name && job.recruiter.email ? (
            <p className="mt-1 text-xs text-muted">
              {job.recruiter.email}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "site",
      header: "Origin site",
      className: "min-w-48",
      cell: (job) => getSiteLabel(job.origin_site_id),
    },
    {
      key: "employment_type",
      header: "Employment",
      className: "whitespace-nowrap capitalize",
      cell: (job) => formatEnum(job.employment_type),
    },
    {
      key: "location",
      header: "Location",
      className: "min-w-48",
      cell: formatLocation,
    },
    {
      key: "published_at",
      header: "Published",
      className: "min-w-44 whitespace-nowrap",
      cell: (job) => formatDateTime(job.published_at),
    },
    {
      key: "expires_at",
      header: "Expires",
      className: "min-w-44 whitespace-nowrap",
      cell: (job) => formatDateTime(job.expires_at),
    },
    {
      key: "created_at",
      header: "Created",
      className: "min-w-44 whitespace-nowrap",
      cell: (job) => formatDateTime(job.created_at),
    },
  ];

  const applyFilters = () => {
    const nextFilters = normalizeFilters(draftFilters);
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setPage(0);
    setSelectedJobId(null);
  };

  const clearFilters = () => {
    const emptyFilters = createEmptyFilters();
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
    setSelectedJobId(null);
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    setSelectedJobId(null);
  };

  return (
    <section>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
        Admin
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-2 text-sm text-muted">
            Explore job records across every Jooblie site.
          </p>
        </div>
        <p className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
          {totalJobs} total
        </p>
      </div>

      <div className="mt-6">
        <ExplorerFilters
          hasActiveFilters={
            hasFilters(draftFilters) || hasFilters(appliedFilters)
          }
          isApplying={jobsQuery.isFetching}
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
                  title: event.target.value,
                }))
              }
              placeholder="Search by title"
              type="search"
              value={draftFilters.title}
            />
          </label>
          <label className="text-sm font-semibold">
            Status
            <select
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  status: getJobStatus(event.target.value),
                }))
              }
              value={draftFilters.status}
            >
              <option value="">All statuses</option>
              <option value="pending_review">Pending review</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="expired">Expired</option>
              <option value="removed">Removed</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Origin site
            <select
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  originSiteId: event.target.value,
                }))
              }
              value={draftFilters.originSiteId}
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
            Company name
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  companyName: event.target.value,
                }))
              }
              placeholder="Search joined company"
              type="search"
              value={draftFilters.companyName}
            />
          </label>
          <label className="text-sm font-semibold">
            Exact company ID
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  companyId: event.target.value,
                }))
              }
              placeholder="UUID"
              type="text"
              value={draftFilters.companyId}
            />
          </label>
          <label className="text-sm font-semibold">
            Exact recruiter ID
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  recruiterId: event.target.value,
                }))
              }
              placeholder="Profile UUID"
              type="text"
              value={draftFilters.recruiterId}
            />
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
            Published from
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  publishedFrom: event.target.value,
                }))
              }
              type="date"
              value={draftFilters.publishedFrom}
            />
          </label>
          <label className="text-sm font-semibold">
            Published to
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  publishedTo: event.target.value,
                }))
              }
              type="date"
              value={draftFilters.publishedTo}
            />
          </label>
        </ExplorerFilters>
      </div>

      <div className="mt-6">
        <ExplorerTable
          ariaLabel="Jobs explorer"
          columns={columns}
          emptyMessage="Try clearing or changing the applied filters."
          emptyTitle="No jobs found"
          errorMessage={queryError}
          getRowKey={(job) => job.id}
          isLoading={jobsQuery.isLoading}
          loadingLabel="Loading jobs…"
          onRetry={() => void jobsQuery.refetch()}
          rows={jobs}
          selectedRowKey={selectedJobId}
        />
        {!jobsQuery.isLoading && !queryError ? (
          <ExplorerPagination
            disabled={jobsQuery.isFetching}
            onPageChange={changePage}
            page={page}
            pageSize={EXPLORER_PAGE_SIZE}
            totalRows={totalJobs}
          />
        ) : null}
      </div>

      <div className="mt-6">
        {selectedJob ? (
          <JobDetail job={selectedJob} />
        ) : (
          <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <div>
              <h2 className="text-lg font-semibold">
                Select a job to inspect
              </h2>
              <p className="mt-2 text-sm text-muted">
                Job details appear here. This explorer is read-only.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
