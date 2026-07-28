import { getSiteById, siteRegistry } from "@jooblie/core";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { getAdminErrorMessage } from "../admin-errors";
import { ExplorerFilters } from "../components/ExplorerFilters";
import { ExplorerPagination } from "../components/ExplorerPagination";
import {
  ExplorerTable,
  type ExplorerColumn,
} from "../components/ExplorerTable";
import {
  useActivityExplorer,
  type ActivityExplorerFilters,
  type ActivityExplorerRow,
} from "../queries/activity";
import { EXPLORER_PAGE_SIZE } from "../queries/explorer";

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
});

function createEmptyFilters(): ActivityExplorerFilters {
  return {
    action: "",
    actorId: "",
    companyId: "",
    createdFrom: "",
    createdTo: "",
    entityId: "",
    entityType: "",
    siteId: "",
  };
}

function createFiltersFromSearchParams(
  searchParams: URLSearchParams,
): ActivityExplorerFilters {
  return {
    action: searchParams.get("action")?.trim() ?? "",
    actorId: searchParams.get("actor_id")?.trim() ?? "",
    companyId: searchParams.get("company_id")?.trim() ?? "",
    createdFrom: searchParams.get("created_from")?.trim() ?? "",
    createdTo: searchParams.get("created_to")?.trim() ?? "",
    entityId: searchParams.get("entity_id")?.trim() ?? "",
    entityType: searchParams.get("entity_type")?.trim() ?? "",
    siteId: searchParams.get("site_id")?.trim() ?? "",
  };
}

function normalizeFilters(
  filters: ActivityExplorerFilters,
): ActivityExplorerFilters {
  return {
    ...filters,
    action: filters.action.trim(),
    actorId: filters.actorId.trim(),
    companyId: filters.companyId.trim(),
    entityId: filters.entityId.trim(),
    entityType: filters.entityType.trim(),
  };
}

function getFilterSearchParams(
  filters: ActivityExplorerFilters,
): URLSearchParams {
  const searchParams = new URLSearchParams();
  const entries = [
    ["action", filters.action],
    ["actor_id", filters.actorId],
    ["company_id", filters.companyId],
    ["created_from", filters.createdFrom],
    ["created_to", filters.createdTo],
    ["entity_id", filters.entityId],
    ["entity_type", filters.entityType],
    ["site_id", filters.siteId],
  ] as const;

  for (const [key, value] of entries) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  return searchParams;
}

function hasFilters(filters: ActivityExplorerFilters): boolean {
  return Object.values(filters).some((value) => value !== "");
}

function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

function getActorLabel(activity: ActivityExplorerRow): string {
  if (activity.actor_id === null) {
    return "System";
  }

  return (
    activity.actor?.full_name ??
    activity.actor?.email ??
    activity.actor_id
  );
}

function getCompanyLabel(activity: ActivityExplorerRow): string {
  if (activity.company_id === null) {
    return "—";
  }

  return activity.company?.name ?? activity.company_id;
}

function getSiteLabel(siteId: number | null): string {
  if (siteId === null) {
    return "—";
  }

  return getSiteById(siteId)?.name ?? `Site ${siteId}`;
}

function formatData(data: ActivityExplorerRow["data"]): string {
  return JSON.stringify(data, null, 2) ?? "null";
}

export function ActivityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = createFiltersFromSearchParams(searchParams);
  const [draftFilters, setDraftFilters] =
    useState<ActivityExplorerFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<ActivityExplorerFilters>(initialFilters);
  const [page, setPage] = useState(0);
  const activityQuery = useActivityExplorer(appliedFilters, page);
  const activities = activityQuery.data?.rows ?? [];
  const totalActivities = activityQuery.data?.total ?? 0;
  const queryError = activityQuery.isError
    ? getAdminErrorMessage(
        activityQuery.error,
        "Please try loading the activity browser again.",
      )
    : null;

  const columns: readonly ExplorerColumn<ActivityExplorerRow>[] = [
    {
      key: "created_at",
      header: "Created",
      className: "min-w-44 whitespace-nowrap",
      cell: (activity) => formatDateTime(activity.created_at),
    },
    {
      key: "action",
      header: "Action",
      className: "min-w-52",
      cell: (activity) => (
        <span className="font-semibold">{activity.action}</span>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      className: "min-w-56",
      cell: (activity) => (
        <div>
          <p className="font-medium">{getActorLabel(activity)}</p>
          {activity.actor_id !== null &&
          activity.actor?.full_name &&
          activity.actor.email ? (
            <p className="mt-1 break-all text-xs text-muted">
              {activity.actor.email}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "entity_type",
      header: "Entity type",
      className: "min-w-40",
      cell: (activity) => activity.entity_type,
    },
    {
      key: "entity_id",
      header: "Entity ID",
      className: "min-w-64",
      cell: (activity) => (
        <span className="break-all font-mono text-xs">
          {activity.entity_id ?? "—"}
        </span>
      ),
    },
    {
      key: "company",
      header: "Company",
      className: "min-w-52",
      cell: getCompanyLabel,
    },
    {
      key: "site",
      header: "Site",
      className: "min-w-48",
      cell: (activity) => getSiteLabel(activity.site_id),
    },
    {
      key: "data",
      header: "Data",
      className: "min-w-72 max-w-xl",
      cell: (activity) => (
        <details>
          <summary className="cursor-pointer font-semibold text-primary">
            View JSON
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-950 p-3 text-xs leading-5 text-slate-100">
            {formatData(activity.data)}
          </pre>
        </details>
      ),
    },
    {
      key: "id",
      header: "Log ID",
      className: "min-w-64",
      cell: (activity) => (
        <span className="break-all font-mono text-xs">
          {activity.id}
        </span>
      ),
    },
  ];

  const applyFilters = () => {
    const nextFilters = normalizeFilters(draftFilters);
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setSearchParams(getFilterSearchParams(nextFilters), {
      replace: true,
    });
    setPage(0);
  };

  const clearFilters = () => {
    const emptyFilters = createEmptyFilters();
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearchParams({}, { replace: true });
    setPage(0);
  };

  return (
    <section>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
        Admin
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Activity
          </h1>
          <p className="mt-2 text-sm text-muted">
            Browse the append-only platform activity log.
          </p>
        </div>
        <p className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
          {totalActivities} total
        </p>
      </div>

      <div className="mt-6">
        <ExplorerFilters
          hasActiveFilters={
            hasFilters(draftFilters) || hasFilters(appliedFilters)
          }
          isApplying={activityQuery.isFetching}
          onApply={applyFilters}
          onClear={clearFilters}
        >
          <label className="text-sm font-semibold">
            Action
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  action: event.target.value,
                }))
              }
              placeholder="Search any action string"
              type="search"
              value={draftFilters.action}
            />
          </label>
          <label className="text-sm font-semibold">
            Entity type
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  entityType: event.target.value,
                }))
              }
              placeholder="application, job, company…"
              type="text"
              value={draftFilters.entityType}
            />
          </label>
          <label className="text-sm font-semibold">
            Exact entity ID
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  entityId: event.target.value,
                }))
              }
              placeholder="Entity UUID"
              type="text"
              value={draftFilters.entityId}
            />
          </label>
          <label className="text-sm font-semibold">
            Exact actor ID
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  actorId: event.target.value,
                }))
              }
              placeholder="Profile UUID"
              type="text"
              value={draftFilters.actorId}
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
              placeholder="Company UUID"
              type="text"
              value={draftFilters.companyId}
            />
          </label>
          <label className="text-sm font-semibold">
            Site
            <select
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  siteId: event.target.value,
                }))
              }
              value={draftFilters.siteId}
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
        </ExplorerFilters>
      </div>

      <div className="mt-6">
        <ExplorerTable
          ariaLabel="Activity log browser"
          columns={columns}
          emptyMessage="Try clearing or changing the applied filters."
          emptyTitle="No activity found"
          errorMessage={queryError}
          getRowKey={(activity) => activity.id}
          isLoading={activityQuery.isLoading}
          loadingLabel="Loading activity…"
          onRetry={() => void activityQuery.refetch()}
          rows={activities}
        />
        {!activityQuery.isLoading && !queryError ? (
          <ExplorerPagination
            disabled={activityQuery.isFetching}
            onPageChange={setPage}
            page={page}
            pageSize={EXPLORER_PAGE_SIZE}
            totalRows={totalActivities}
          />
        ) : null}
      </div>
    </section>
  );
}
