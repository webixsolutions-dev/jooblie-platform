import { getAdminErrorMessage } from "../admin-errors";
import {
  type DashboardStats,
  useDashboardStats,
} from "../queries/dashboard";

type BreakdownItem = {
  readonly colorClass: string;
  readonly count: number;
  readonly label: string;
};

type BreakdownProps = {
  readonly items: readonly BreakdownItem[];
  readonly total: number;
};

type DonutSegment = BreakdownItem & {
  readonly offset: number;
  readonly percentage: number;
  readonly strokeClass: string;
};

function getPercentage(count: number, total: number): number {
  return total === 0 ? 0 : (count / total) * 100;
}

function Breakdown({ items, total }: BreakdownProps) {
  return (
    <div className="mt-6 space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between gap-4 text-sm">
            <span className="font-medium text-foreground">
              {item.label}
            </span>
            <span className="font-semibold tabular-nums">
              {item.count}
            </span>
          </div>
          <div
            aria-label={`${item.label}: ${item.count} of ${total}`}
            className="h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="img"
          >
            <div
              className={`h-full rounded-full ${item.colorClass}`}
              style={{
                width: `${getPercentage(item.count, total)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompaniesDonut({
  stats,
}: {
  readonly stats: DashboardStats["companies"];
}) {
  const baseSegments = [
    {
      colorClass: "bg-primary",
      count: stats.verified,
      label: "Verified",
      strokeClass: "stroke-primary",
    },
    {
      colorClass: "bg-slate-400",
      count: stats.pending,
      label: "Pending",
      strokeClass: "stroke-slate-400",
    },
    {
      colorClass: "bg-slate-700",
      count: stats.rejected,
      label: "Rejected",
      strokeClass: "stroke-slate-700",
    },
  ] as const;

  let offset = 0;
  const segments: DonutSegment[] = baseSegments.map((segment) => {
    const percentage = getPercentage(segment.count, stats.total);
    const donutSegment = {
      ...segment,
      offset,
      percentage,
    };
    offset += percentage;
    return donutSegment;
  });

  return (
    <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
      <svg
        aria-label={`Companies: ${stats.verified} verified, ${stats.pending} pending, ${stats.rejected} rejected`}
        className="h-40 w-40 shrink-0"
        role="img"
        viewBox="0 0 120 120"
      >
        <circle
          className="stroke-slate-100"
          cx="60"
          cy="60"
          fill="none"
          r="46"
          strokeWidth="12"
        />
        {segments.map((segment) =>
          segment.count > 0 ? (
            <circle
              className={segment.strokeClass}
              cx="60"
              cy="60"
              fill="none"
              key={segment.label}
              pathLength="100"
              r="46"
              strokeDasharray={`${segment.percentage} ${100 - segment.percentage}`}
              strokeDashoffset={-segment.offset}
              strokeWidth="12"
              transform="rotate(-90 60 60)"
            />
          ) : null,
        )}
        <text
          className="fill-brandNavy text-[1.35rem] font-bold"
          dominantBaseline="middle"
          textAnchor="middle"
          x="60"
          y="56"
        >
          {stats.total}
        </text>
        <text
          className="fill-slate-500 text-[0.5rem] font-semibold uppercase tracking-wider"
          dominantBaseline="middle"
          textAnchor="middle"
          x="60"
          y="73"
        >
          Total
        </text>
      </svg>

      <ul className="w-full space-y-3">
        {baseSegments.map((segment) => (
          <li
            className="flex items-center justify-between gap-4 text-sm"
            key={segment.label}
          >
            <span className="flex items-center gap-2 text-muted">
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 rounded-full ${segment.colorClass}`}
              />
              {segment.label}
            </span>
            <span className="font-semibold tabular-nums">
              {segment.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div
      aria-label="Loading dashboard statistics"
      className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3"
      role="status"
    >
      {[0, 1, 2].map((item) => (
        <div
          className="min-h-96 animate-pulse rounded-xl border border-border bg-white p-6 shadow-sm"
          key={item}
        >
          <div className="h-4 w-24 rounded bg-slate-100" />
          <div className="mt-4 h-10 w-20 rounded bg-slate-200" />
          <div className="mt-10 h-52 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const statsQuery = useDashboardStats();
  const queryError = statsQuery.isError
    ? getAdminErrorMessage(
        statsQuery.error,
        "Please try loading the dashboard statistics again.",
      )
    : null;

  if (statsQuery.isLoading) {
    return (
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <DashboardLoading />
      </section>
    );
  }

  if (queryError || !statsQuery.data) {
    return (
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Dashboard
        </h1>
        <div
          className="mt-8 rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-sm"
          role="alert"
        >
          <h2 className="text-lg font-semibold text-red-900">
            We could not load dashboard statistics
          </h2>
          <p className="mt-2 text-sm text-red-800">{queryError}</p>
          <button
            className="mt-5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={statsQuery.isFetching}
            onClick={() => void statsQuery.refetch()}
            type="button"
          >
            {statsQuery.isFetching ? "Retrying…" : "Try again"}
          </button>
        </div>
      </section>
    );
  }

  const { applications, companies, jobs } = statsQuery.data;
  const jobItems: readonly BreakdownItem[] = [
    {
      colorClass: "bg-primary",
      count: jobs.active,
      label: "Active",
    },
    {
      colorClass: "bg-slate-400",
      count: jobs.pendingReview,
      label: "Pending review",
    },
    {
      colorClass: "bg-slate-500",
      count: jobs.closed,
      label: "Closed",
    },
    {
      colorClass: "bg-slate-600",
      count: jobs.expired,
      label: "Expired",
    },
    {
      colorClass: "bg-slate-700",
      count: jobs.removed,
      label: "Removed",
    },
  ];
  const applicationItems: readonly BreakdownItem[] = [
    {
      colorClass: "bg-primary",
      count: applications.submitted,
      label: "Submitted",
    },
    {
      colorClass: "bg-slate-400",
      count:
        applications.viewed +
        applications.shortlisted +
        applications.interviewing,
      label: "In review",
    },
    {
      colorClass: "bg-slate-700",
      count:
        applications.offered +
        applications.hired +
        applications.rejected +
        applications.withdrawn,
      label: "Closed out",
    },
  ];

  return (
    <section>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
        Admin
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-muted">
        A current overview of non-deleted platform records.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Companies
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-4xl font-bold tracking-tight text-brandNavy tabular-nums">
                {companies.total}
              </p>
              <p className="mt-1 text-sm text-muted">Total companies</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary">
              Verification
            </span>
          </div>
          <CompaniesDonut stats={companies} />
        </article>

        <article className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Jobs
          </p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-brandNavy tabular-nums">
            {jobs.total}
          </p>
          <p className="mt-1 text-sm text-muted">
            Total jobs across all statuses
          </p>
          <Breakdown items={jobItems} total={jobs.total} />
        </article>

        <article className="rounded-xl border border-border bg-white p-6 shadow-sm lg:col-span-2 xl:col-span-1">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Applications
          </p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-brandNavy tabular-nums">
            {applications.total}
          </p>
          <p className="mt-1 text-sm text-muted">
            Total applications across all jobs
          </p>
          <Breakdown
            items={applicationItems}
            total={applications.total}
          />
          <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted">
            In review combines viewed, shortlisted, and interviewing.
            Closed out combines offered, hired, rejected, and withdrawn.
          </p>
        </article>
      </div>
    </section>
  );
}
