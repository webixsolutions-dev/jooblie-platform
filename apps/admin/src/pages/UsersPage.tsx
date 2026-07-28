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
  useUsersExplorer,
  type UserExplorerFilters,
  type UserExplorerRow,
} from "../queries/users";

const dateTimeFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
});

function createEmptyFilters(): UserExplorerFilters {
  return {
    createdFrom: "",
    createdTo: "",
    role: "",
    search: "",
    signupSiteId: "",
    status: "",
    userId: "",
  };
}

function normalizeFilters(
  filters: UserExplorerFilters,
): UserExplorerFilters {
  return {
    ...filters,
    search: filters.search.trim(),
    userId: filters.userId.trim(),
  };
}

function hasFilters(filters: UserExplorerFilters): boolean {
  return Object.values(filters).some((value) => value !== "");
}

function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

function formatEnum(value: string): string {
  return value.replaceAll("_", " ");
}

function formatLocation(user: UserExplorerRow): string {
  return (
    [user.location_city, user.location_province]
      .filter(Boolean)
      .join(", ") || "—"
  );
}

function getSiteLabel(siteId: number): string {
  return getSiteById(siteId)?.name ?? `Site ${siteId}`;
}

function getUserRole(
  value: string,
): UserExplorerFilters["role"] {
  return value === "job_seeker" ||
    value === "recruiter" ||
    value === "admin"
    ? value
    : "";
}

function getUserStatus(
  value: string,
): UserExplorerFilters["status"] {
  return value === "active" ||
    value === "suspended" ||
    value === "deleted"
    ? value
    : "";
}

function UserStatusBadge({
  value,
}: {
  readonly value: UserExplorerRow["status"];
}) {
  const tone =
    value === "active"
      ? "bg-green-100 text-green-800"
      : value === "suspended"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-200 text-slate-800";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${tone}`}
    >
      {formatEnum(value)}
    </span>
  );
}

function UserDetail({ user }: { readonly user: UserExplorerRow }) {
  return (
    <article className="rounded-xl border border-border bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        User detail
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">
        {user.full_name ?? user.email}
      </h2>
      <p className="mt-2 break-all text-sm text-muted">{user.id}</p>

      <dl className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Phone
          </dt>
          <dd className="mt-1 text-sm">{user.phone ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Résumé
          </dt>
          <dd className="mt-1 text-sm">
            {user.default_resume_path ? "Provided" : "Not provided"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Updated
          </dt>
          <dd className="mt-1 text-sm">
            {formatDateTime(user.updated_at)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Signup site
          </dt>
          <dd className="mt-1 text-sm">
            {getSiteLabel(user.signup_site_id)}
          </dd>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Headline
          </dt>
          <dd className="mt-2 whitespace-pre-wrap text-sm">
            {user.headline ?? "—"}
          </dd>
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <dt className="text-xs font-bold uppercase tracking-wider text-muted">
            Skills
          </dt>
          <dd className="mt-2">
            {user.skills && user.skills.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
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
      </dl>
    </article>
  );
}

export function UsersPage() {
  const [draftFilters, setDraftFilters] =
    useState<UserExplorerFilters>(createEmptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<UserExplorerFilters>(createEmptyFilters);
  const [page, setPage] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<
    string | null
  >(null);
  const usersQuery = useUsersExplorer(appliedFilters, page);
  const users = usersQuery.data?.rows ?? [];
  const totalUsers = usersQuery.data?.total ?? 0;
  const selectedUser =
    users.find((user) => user.id === selectedUserId) ?? null;
  const queryError = usersQuery.isError
    ? getAdminErrorMessage(
        usersQuery.error,
        "Please try loading the users explorer again.",
      )
    : null;

  const columns: readonly ExplorerColumn<UserExplorerRow>[] = [
    {
      key: "full_name",
      header: "User",
      className: "min-w-56",
      cell: (user) => (
        <button
          className="text-left font-semibold text-primary hover:underline"
          onClick={() => setSelectedUserId(user.id)}
          type="button"
        >
          {user.full_name ?? "Unnamed user"}
        </button>
      ),
    },
    {
      key: "email",
      header: "Email",
      className: "min-w-56",
      cell: (user) => (
        <span className="break-all">{user.email}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      className: "whitespace-nowrap capitalize",
      cell: (user) => formatEnum(user.role),
    },
    {
      key: "status",
      header: "Status",
      cell: (user) => <UserStatusBadge value={user.status} />,
    },
    {
      key: "site",
      header: "Signup site",
      className: "min-w-48",
      cell: (user) => getSiteLabel(user.signup_site_id),
    },
    {
      key: "location",
      header: "Location",
      className: "min-w-48",
      cell: formatLocation,
    },
    {
      key: "created_at",
      header: "Created",
      className: "min-w-44 whitespace-nowrap",
      cell: (user) => formatDateTime(user.created_at),
    },
  ];

  const applyFilters = () => {
    const nextFilters = normalizeFilters(draftFilters);
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setPage(0);
    setSelectedUserId(null);
  };

  const clearFilters = () => {
    const emptyFilters = createEmptyFilters();
    setDraftFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
    setSelectedUserId(null);
  };

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    setSelectedUserId(null);
  };

  return (
    <section>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
        Admin
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Users
          </h1>
          <p className="mt-2 text-sm text-muted">
            Explore user profiles across every Jooblie site.
          </p>
        </div>
        <p className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
          {totalUsers} total
        </p>
      </div>

      <div className="mt-6">
        <ExplorerFilters
          hasActiveFilters={
            hasFilters(draftFilters) || hasFilters(appliedFilters)
          }
          isApplying={usersQuery.isFetching}
          onApply={applyFilters}
          onClear={clearFilters}
        >
          <label className="text-sm font-semibold">
            Name or email
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Search name or email"
              type="search"
              value={draftFilters.search}
            />
          </label>
          <label className="text-sm font-semibold">
            Role
            <select
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  role: getUserRole(event.target.value),
                }))
              }
              value={draftFilters.role}
            >
              <option value="">All roles</option>
              <option value="job_seeker">Job seeker</option>
              <option value="recruiter">Recruiter</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Status
            <select
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  status: getUserStatus(event.target.value),
                }))
              }
              value={draftFilters.status}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Signup site
            <select
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  signupSiteId: event.target.value,
                }))
              }
              value={draftFilters.signupSiteId}
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
            Exact user ID
            <input
              className="mt-2 block w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  userId: event.target.value,
                }))
              }
              placeholder="Profile UUID"
              type="text"
              value={draftFilters.userId}
            />
          </label>
        </ExplorerFilters>
      </div>

      <div className="mt-6">
        <ExplorerTable
          ariaLabel="Users explorer"
          columns={columns}
          emptyMessage="Try clearing or changing the applied filters."
          emptyTitle="No users found"
          errorMessage={queryError}
          getRowKey={(user) => user.id}
          isLoading={usersQuery.isLoading}
          loadingLabel="Loading users…"
          onRetry={() => void usersQuery.refetch()}
          rows={users}
          selectedRowKey={selectedUserId}
        />
        {!usersQuery.isLoading && !queryError ? (
          <ExplorerPagination
            disabled={usersQuery.isFetching}
            onPageChange={changePage}
            page={page}
            pageSize={EXPLORER_PAGE_SIZE}
            totalRows={totalUsers}
          />
        ) : null}
      </div>

      <div className="mt-6">
        {selectedUser ? (
          <UserDetail user={selectedUser} />
        ) : (
          <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-border bg-white p-8 text-center">
            <div>
              <h2 className="text-lg font-semibold">
                Select a user to inspect
              </h2>
              <p className="mt-2 text-sm text-muted">
                User details appear here. This explorer is read-only.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
