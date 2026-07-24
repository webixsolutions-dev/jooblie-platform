import {
  env,
  resolveSite,
  toUserMessage,
  useCategories,
  useJobs,
  useSectors,
  type JobListRow,
} from "@jooblie/core";
import { useSearchParams } from "react-router-dom";

import { Container } from "../components/Container";
import { JobCard } from "../components/JobCard";
import { JobFilters } from "../components/JobFilters";

const PAGE_SIZE = 12;
type EmploymentType = JobListRow["employment_type"];
const employmentTypes = new Set<EmploymentType>([
  "full_time",
  "part_time",
  "contract",
  "temporary",
  "internship",
  "seasonal",
]);

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseNumberList(value: string | null): number[] {
  return (value?.split(",") ?? [])
    .map(Number)
    .filter((item) => Number.isInteger(item) && item > 0);
}

function parseEmploymentTypes(value: string | null): EmploymentType[] {
  return (value?.split(",") ?? []).filter(
    (item): item is EmploymentType =>
      employmentTypes.has(item as EmploymentType),
  );
}

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const categoryIds = parseNumberList(searchParams.get("categoryIds"));
  const selectedEmploymentTypes = parseEmploymentTypes(
    searchParams.get("employmentTypes"),
  );
  const siteId = resolveSite(env.appSlug)?.id ?? null;
  const jobsQuery = useJobs({
    categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
    city: searchParams.get("city") ?? undefined,
    employmentTypes:
      selectedEmploymentTypes.length > 0
        ? selectedEmploymentTypes
        : undefined,
    isRemote: searchParams.get("isRemote") === "true" ? true : undefined,
    page,
    pageSize: PAGE_SIZE,
    province: searchParams.get("province") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    siteId,
  });
  const sectorsQuery = useSectors();
  const categoriesQuery = useCategories();
  const total = jobsQuery.data?.total ?? 0;
  const firstResult = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(page * PAGE_SIZE, total);

  const setPage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
    window.scrollTo({ behavior: "smooth", top: 0 });
  };

  return (
    <Container className="py-10 sm:py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">
          Jooblie network
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Find your next job
        </h1>
        <p className="mt-3 leading-7 text-muted">
          Search active opportunities across Jooblie and our Canadian partner
          job sites.
        </p>
      </div>

      <div className="mt-8 grid gap-7 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside>
          {sectorsQuery.data && categoriesQuery.data ? (
            <JobFilters
              categories={categoriesQuery.data}
              currentParams={searchParams}
              key={searchParams.toString()}
              onApply={setSearchParams}
              sectors={sectorsQuery.data}
            />
          ) : (
            <div className="h-80 animate-pulse rounded-xl border border-border bg-white" />
          )}
        </aside>

        <section aria-live="polite">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Available jobs</h2>
              {!jobsQuery.isLoading && !jobsQuery.isError ? (
                <p className="mt-1 text-sm text-muted">
                  {total === 0
                    ? "No results"
                    : `Showing ${firstResult}–${lastResult} of ${total}`}
                </p>
              ) : null}
            </div>
          </div>

          {jobsQuery.isLoading ? (
            <div className="space-y-4" aria-label="Loading jobs">
              {["one", "two", "three", "four"].map((key) => (
                <div
                  className="h-52 animate-pulse rounded-xl border border-border bg-white"
                  key={key}
                />
              ))}
            </div>
          ) : null}

          {jobsQuery.isError ? (
            <div
              className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"
              role="alert"
            >
              <h2 className="font-bold">We couldn’t load jobs</h2>
              <p className="mt-2 text-sm">{toUserMessage(jobsQuery.error)}</p>
              <button
                className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-semibold"
                onClick={() => void jobsQuery.refetch()}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : null}

          {jobsQuery.data?.rows.length === 0 ? (
            <div className="rounded-xl border border-border bg-white p-8 text-center">
              <h2 className="text-xl font-bold">No jobs match your search</h2>
              <p className="mt-2 text-muted">
                Try removing a filter or searching with a broader keyword.
              </p>
              <button
                className="mt-5 rounded-md bg-primary px-5 py-2.5 font-semibold text-white"
                onClick={() => setSearchParams(new URLSearchParams())}
                type="button"
              >
                Clear all filters
              </button>
            </div>
          ) : null}

          {jobsQuery.data && jobsQuery.data.rows.length > 0 ? (
            <>
              <div className="space-y-4">
                {jobsQuery.data.rows.map((job) => (
                  <JobCard job={job} key={job.id} />
                ))}
              </div>
              <nav
                aria-label="Job results pages"
                className="mt-7 flex items-center justify-between rounded-xl border border-border bg-white p-4"
              >
                <button
                  className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  type="button"
                >
                  Previous
                </button>
                <span className="text-sm text-muted">Page {page}</span>
                <button
                  className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!jobsQuery.data.hasMore}
                  onClick={() => setPage(page + 1)}
                  type="button"
                >
                  Next
                </button>
              </nav>
            </>
          ) : null}
        </section>
      </div>
    </Container>
  );
}
