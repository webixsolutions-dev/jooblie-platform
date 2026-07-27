import { useState } from "react";

import { getAdminErrorMessage } from "../admin-errors";
import { ExplorerFilters } from "../components/ExplorerFilters";
import { ExplorerPagination } from "../components/ExplorerPagination";
import {
  ExplorerTable,
  type ExplorerColumn,
} from "../components/ExplorerTable";
import {
  useCompaniesExplorer,
  useSetCompanyStatus,
  type CompanyExplorerFilters,
  type CompanyExplorerRow,
} from "../queries/companies";
import { EXPLORER_PAGE_SIZE } from "../queries/explorer";

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
});

type CompanyStatusConfirmation = {
  readonly companyId: string;
  readonly companyName: string;
  readonly nextStatus: CompanyExplorerRow["status"];
};

type ActionFeedback =
  | {
      readonly kind: "success";
      readonly message: string;
    }
  | {
      readonly kind: "error";
      readonly message: string;
    };

function createEmptyFilters(): CompanyExplorerFilters {
  return {
    companyId: "",
    createdFrom: "",
    createdTo: "",
    creatorId: "",
    name: "",
    status: "",
    verificationStatus: "",
  };
}

function normalizeFilters(
  filters: CompanyExplorerFilters,
): CompanyExplorerFilters {
  return {
    ...filters,
    companyId: filters.companyId.trim(),
    creatorId: filters.creatorId.trim(),
    name: filters.name.trim(),
  };
}

function hasFilters(filters: CompanyExplorerFilters): boolean {
  return Object.values(filters).some((value) => value !== "");
}

function formatDateTime(value: string | null): string {
  return value ? dateTimeFormatter.format(new Date(value)) : "—";
}

function formatStatus(value: string): string {
  return value.replaceAll("_", " ");
}

function getProfileLabel(
  profile: CompanyExplorerRow["creator"],
  fallbackId: string | null,
): string {
  return profile?.full_name ?? profile?.email ?? fallbackId ?? "—";
}

function getVerificationFilter(
  value: string,
): CompanyExplorerFilters["verificationStatus"] {
  return value === "pending" ||
    value === "verified" ||
    value === "rejected"
    ? value
    : "";
}

function getStatusFilter(
  value: string,
): CompanyExplorerFilters["status"] {
  return value === "active" || value === "suspended" ? value : "";
}

function StatusBadge({
  value,
}: {
  readonly value:
    | CompanyExplorerRow["status"]
    | CompanyExplorerRow["verification_status"];
}) {
  const tone =
    value === "active" || value === "verified"
      ? "bg-green-100 text-green-800"
      : value === "suspended" || value === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}
    >
      {formatStatus(value)}
    </span>
  );
}

function CompanyDetail({
  company,
  isSaving,
  onRequestStatusChange,
}: {
  readonly company: CompanyExplorerRow;
  readonly isSaving: boolean;
  readonly onRequestStatusChange: (company: CompanyExplorerRow) => void;
}) {
  const isDeleted = company.deleted_at !== null;
  const nextAction =
    company.status === "active" ? "Suspend company" : "Unsuspend company";

  return (
    <article className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Company detail
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {company.name}
          </h2>
          <p className="mt-2 break-all text-sm text-muted">{company.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={company.verification_status} />
          <StatusBadge value={company.status} />
        </div>
      </div>

      <dl className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Registration number
          </dt>
          <dd className="mt-1 text-sm font-medium">
            {company.registration_number}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Verified by
          </dt>
          <dd className="mt-1 break-words text-sm">
            {getProfileLabel(company.verifier, company.verified_by)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Updated
          </dt>
          <dd className="mt-1 text-sm">{formatDateTime(company.updated_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Deleted
          </dt>
          <dd className="mt-1 text-sm">{formatDateTime(company.deleted_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Logo
          </dt>
          <dd className="mt-1 text-sm">
            {company.logo_path ? "Present" : "Not provided"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Verification document
          </dt>
          <dd className="mt-1 text-sm">
            {company.verification_document_path ? "Present" : "Not provided"}
          </dd>
        </div>
        <div className="sm:col-span-2 xl:col-span-3">
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Description
          </dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm leading-6">
            {company.description || "No description provided."}
          </dd>
        </div>
        <div className="sm:col-span-2 xl:col-span-3">
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Rejection reason
          </dt>
          <dd className="mt-1 whitespace-pre-wrap text-sm leading-6">
            {company.rejection_reason || "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-6 border-t border-border pt-5">
        {isDeleted ? (
          <p className="text-sm text-muted">
            Status changes are unavailable for deleted companies.
          </p>
        ) : (
          <button
            className={
              company.status === "active"
                ? "rounded-md border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                : "rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            }
            disabled={isSaving}
            onClick={() => onRequestStatusChange(company)}
            type="button"
          >
            {isSaving ? "Saving…" : nextAction}
          </button>
        )}
      </div>
    </article>
  );
}

export function CompaniesPage() {
  const [draftFilters, setDraftFilters] =
    useState<CompanyExplorerFilters>(createEmptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<CompanyExplorerFilters>(createEmptyFilters);
  const [page, setPage] = useState(0);
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    string | null
  >(null);
  const [confirmation, setConfirmation] =
    useState<CompanyStatusConfirmation | null>(null);
  const [confirmationError, setConfirmationError] = useState<
    string | null
  >(null);
  const [actionFeedback, setActionFeedback] =
    useState<ActionFeedback | null>(null);
  const companiesQuery = useCompaniesExplorer(appliedFilters, page);
  const statusMutation = useSetCompanyStatus();
  const companies = companiesQuery.data?.rows ?? [];
  const totalCompanies = companiesQuery.data?.total ?? 0;
  const selectedCompany =
    companies.find((company) => company.id === selectedCompanyId) ??
    null;
  const queryError = companiesQuery.isError
    ? getAdminErrorMessage(
        companiesQuery.error,
        "Please try loading the companies explorer again.",
      )
    : null;

  const columns: readonly ExplorerColumn<CompanyExplorerRow>[] = [
    {
      key: "name",
      header: "Company",
      className: "min-w-56",
      cell: (company) => (
        <button
          className="text-left font-semibold text-primary hover:underline"
          onClick={() => {
            setSelectedCompanyId(company.id);
            setActionFeedback(null);
          }}
          type="button"
        >
          {company.name}
        </button>
      ),
    },
    {
      key: "verification_status",
      header: "Verification",
      cell: (company) => (
        <StatusBadge value={company.verification_status} />
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (company) => <StatusBadge value={company.status} />,
    },
    {
      key: "website",
      header: "Website",
      className: "min-w-52 max-w-64",
      cell: (company) => (
        <span className="block truncate" title={company.website}>
          {company.website}
        </span>
      ),
    },
    {
      key: "created_by",
      header: "Created by",
      className: "min-w-52",
      cell: (company) => (
        <div>
          <p className="font-medium">
            {getProfileLabel(company.creator, company.created_by)}
          </p>
          {company.creator?.full_name && company.creator.email ? (
            <p className="mt-1 text-xs text-muted">
              {company.creator.email}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      className: "min-w-44 whitespace-nowrap",
      cell: (company) => formatDateTime(company.created_at),
    },
    {
      key: "verified_at",
      header: "Verified",
      className: "min-w-44 whitespace-nowrap",
      cell: (company) => formatDateTime(company.verified_at),
    },
  ];

  const applyFilters = () => {
    const nextFilters = normalizeFilters(draftFilters);
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setPage(0);
    setSelectedCompanyId(null);
    setActionFeedback(null);
  };

  const clearFilters = () => {
    const emptyFilters = createEmptyFilters();
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
    setSelectedCompanyId(null);
    setActionFeedback(null);
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    setSelectedCompanyId(null);
    setActionFeedback(null);
  };

  const requestStatusChange = (company: CompanyExplorerRow) => {
    setConfirmation({
      companyId: company.id,
      companyName: company.name,
      nextStatus:
        company.status === "active" ? "suspended" : "active",
    });
    setConfirmationError(null);
    setActionFeedback(null);
  };

  const confirmStatusChange = async () => {
    if (!confirmation) {
      return;
    }

    setConfirmationError(null);

    try {
      const status = await statusMutation.mutateAsync({
        companyId: confirmation.companyId,
        status: confirmation.nextStatus,
      });
      setActionFeedback({
        kind: "success",
        message:
          status === "suspended"
            ? `${confirmation.companyName} suspended.`
            : `${confirmation.companyName} unsuspended.`,
      });
      setConfirmation(null);
    } catch (error) {
      setConfirmationError(
        getAdminErrorMessage(
          error,
          "We could not update this company. Please try again.",
        ),
      );
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
            Companies
          </h1>
          <p className="mt-2 text-sm text-muted">
            Explore company records and manage operational suspension.
          </p>
        </div>
        <p className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
          {totalCompanies} total
        </p>
      </div>

      {actionFeedback ? (
        <div
          className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
            actionFeedback.kind === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role={actionFeedback.kind === "error" ? "alert" : "status"}
        >
          {actionFeedback.message}
        </div>
      ) : null}

      <div className="mt-6">
        <ExplorerFilters
          hasActiveFilters={
            hasFilters(draftFilters) || hasFilters(appliedFilters)
          }
          isApplying={companiesQuery.isFetching}
          onApply={applyFilters}
          onClear={clearFilters}
        >
          <label className="text-sm font-semibold">
            Company name
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Search by name"
              type="search"
              value={draftFilters.name}
            />
          </label>
          <label className="text-sm font-semibold">
            Verification
            <select
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  verificationStatus: getVerificationFilter(
                    event.target.value,
                  ),
                }))
              }
              value={draftFilters.verificationStatus}
            >
              <option value="">All verification states</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Status
            <select
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  status: getStatusFilter(event.target.value),
                }))
              }
              value={draftFilters.status}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
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
            Exact creator ID
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  creatorId: event.target.value,
                }))
              }
              placeholder="Profile UUID"
              type="text"
              value={draftFilters.creatorId}
            />
          </label>
        </ExplorerFilters>
      </div>

      <div className="mt-6">
        <ExplorerTable
          ariaLabel="Companies explorer"
          columns={columns}
          emptyMessage="Try clearing or changing the applied filters."
          emptyTitle="No companies found"
          errorMessage={queryError}
          getRowKey={(company) => company.id}
          isLoading={companiesQuery.isLoading}
          loadingLabel="Loading companies…"
          onRetry={() => void companiesQuery.refetch()}
          rows={companies}
          selectedRowKey={selectedCompanyId}
        />
        {!companiesQuery.isLoading && !queryError ? (
          <ExplorerPagination
            disabled={companiesQuery.isFetching}
            onPageChange={changePage}
            page={page}
            pageSize={EXPLORER_PAGE_SIZE}
            totalRows={totalCompanies}
          />
        ) : null}
      </div>

      <div className="mt-6">
        {selectedCompany ? (
          <CompanyDetail
            company={selectedCompany}
            isSaving={statusMutation.isPending}
            onRequestStatusChange={requestStatusChange}
          />
        ) : (
          <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <div>
              <h2 className="text-lg font-semibold">
                Select a company to inspect
              </h2>
              <p className="mt-2 text-sm text-muted">
                Company details and status controls appear here.
              </p>
            </div>
          </div>
        )}
      </div>

      {confirmation ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
          role="presentation"
        >
          <div
            aria-describedby="company-status-confirmation-description"
            aria-labelledby="company-status-confirmation-title"
            aria-modal="true"
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            role="alertdialog"
          >
            <h2
              className="text-xl font-semibold"
              id="company-status-confirmation-title"
            >
              Confirm company status
            </h2>
            <p
              className="mt-3 text-sm leading-6 text-muted"
              id="company-status-confirmation-description"
            >
              {confirmation.nextStatus === "suspended"
                ? `Suspend ${confirmation.companyName}? Its jobs will no longer appear in public reads.`
                : `Unsuspend ${confirmation.companyName}? Its eligible jobs will be visible again.`}
            </p>
            {confirmationError ? (
              <p
                className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                {confirmationError}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-3">
              <button
                autoFocus
                className="rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={statusMutation.isPending}
                onClick={() => {
                  setConfirmation(null);
                  setConfirmationError(null);
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className={
                  confirmation.nextStatus === "suspended"
                    ? "rounded-md bg-red-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                    : "rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                }
                disabled={statusMutation.isPending}
                onClick={() => void confirmStatusChange()}
                type="button"
              >
                {statusMutation.isPending
                  ? "Saving…"
                  : confirmation.nextStatus === "suspended"
                    ? "Suspend company"
                    : "Unsuspend company"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
