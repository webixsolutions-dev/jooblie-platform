import {
  env,
  resolveSite,
  toUserMessage,
  useCompaniesDirectory,
  type CompanyDirectoryRow,
} from "@jooblie/core";
import {
  Link,
  useSearchParams,
} from "react-router-dom";

import { CompanyLogo } from "../components/CompanyLogo";
import { Container } from "../components/Container";

const PAGE_SIZE = 9;

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getWebsiteDetails(website: string): {
  readonly href: string;
  readonly label: string;
} | null {
  try {
    const url = new URL(website);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return {
      href: url.toString(),
      label: url.hostname.replace(/^www\./, ""),
    };
  } catch {
    return null;
  }
}

function CompanyCard({ company }: { readonly company: CompanyDirectoryRow }) {
  const website = getWebsiteDetails(company.website);
  const jobLabel = `${company.jobCount} ${
    company.jobCount === 1 ? "active job" : "active jobs"
  }`;

  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-white p-6 shadow-sm transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none">
      <div className="flex items-start gap-4">
        <CompanyLogo
          companyName={company.name}
          logoPath={company.logo_path}
          size="md"
        />
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-primary">
            <svg
              aria-hidden="true"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
            Verified employer
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-brandNavy">
            {company.name}
          </h2>
        </div>
      </div>

      <p className="mt-5 line-clamp-4 flex-1 leading-7 text-muted">
        {company.description?.trim() ||
          "No company description has been provided yet."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary">
          {jobLabel}
        </span>
        {website ? (
          <a
            className="max-w-full truncate rounded text-sm font-semibold text-brandNavy outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            href={website.href}
            rel="noreferrer"
            target="_blank"
          >
            {website.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <span className="text-sm text-muted">Website unavailable</span>
        )}
      </div>
    </article>
  );
}

export function CompaniesDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parsePositiveInteger(searchParams.get("page"), 1);
  const search = searchParams.get("search")?.trim() ?? "";
  const siteId = resolveSite(env.appSlug)?.id ?? null;
  const companiesQuery = useCompaniesDirectory({
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    siteId,
  });
  const total = companiesQuery.data?.total ?? 0;
  const firstResult = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastResult = Math.min(page * PAGE_SIZE, total);

  const setPage = (nextPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("page", String(nextPage));
    setSearchParams(nextParams);
    window.scrollTo({ behavior: "smooth", top: 0 });
  };

  const clearSearch = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <>
      <section
        aria-labelledby="companies-hero-heading"
        className="relative isolate overflow-hidden border-b border-white/15 bg-brandNavy bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/images/companies-hero.jpg')" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-brandNavy/80"
        />
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              Verified employers
            </p>
            <h1
              className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl"
              id="companies-hero-heading"
            >
              Discover companies hiring across Canada.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">
              Browse verified employers and see how many active opportunities
              each company has on the Jooblie network.
            </p>

            <form
              className="mx-auto mt-9 flex max-w-2xl flex-col gap-3 rounded-xl bg-white p-3 shadow-xl sm:flex-row"
              key={search}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const nextSearch = String(formData.get("search") ?? "").trim();
                const nextParams = new URLSearchParams();

                if (nextSearch) {
                  nextParams.set("search", nextSearch);
                }

                setSearchParams(nextParams);
              }}
            >
              <label className="sr-only" htmlFor="company-search">
                Search companies by name
              </label>
              <div className="relative min-w-0 flex-1">
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
                <input
                  className="min-h-12 w-full rounded-md border border-border bg-white py-3 pl-12 pr-4 text-foreground outline-none placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  defaultValue={search}
                  id="company-search"
                  name="search"
                  placeholder="Search by company name"
                  type="search"
                />
              </div>
              <button
                className="min-h-12 rounded-md bg-primary px-6 py-3 font-bold text-white outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={companiesQuery.isFetching}
                type="submit"
              >
                Search companies
              </button>
            </form>
          </div>
        </Container>
      </section>

      <section
        aria-labelledby="companies-results-heading"
        aria-live="polite"
        className="py-14 sm:py-20"
      >
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-primary">
                Jooblie company directory
              </p>
              <h2
                className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
                id="companies-results-heading"
              >
                {search ? `Results for “${search}”` : "Verified companies"}
              </h2>
              {!companiesQuery.isLoading && !companiesQuery.isError ? (
                <p className="mt-3 text-muted">
                  {total === 0
                    ? "No companies found"
                    : `Showing ${firstResult}–${lastResult} of ${total}`}
                </p>
              ) : null}
            </div>
            {search ? (
              <button
                className="rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold text-brandNavy outline-none hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                onClick={clearSearch}
                type="button"
              >
                Clear search
              </button>
            ) : null}
          </div>

          {companiesQuery.isLoading ? (
            <div
              aria-label="Loading companies"
              className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {["one", "two", "three", "four", "five", "six"].map((key) => (
                <div
                  className="h-72 animate-pulse rounded-xl border border-border bg-white"
                  key={key}
                />
              ))}
            </div>
          ) : null}

          {companiesQuery.isError ? (
            <div
              className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"
              role="alert"
            >
              <h2 className="font-bold">We couldn’t load companies</h2>
              <p className="mt-2 text-sm">
                {toUserMessage(companiesQuery.error)}
              </p>
              <button
                className="mt-4 rounded-md border border-red-300 px-4 py-2 text-sm font-semibold outline-none hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-500"
                onClick={() => void companiesQuery.refetch()}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : null}

          {companiesQuery.data?.rows.length === 0 ? (
            <div className="mt-8 rounded-xl border border-border bg-white p-8 text-center shadow-sm">
              <h2 className="text-xl font-bold">
                {search
                  ? "No verified companies match that name"
                  : "No verified companies are listed yet"}
              </h2>
              <p className="mx-auto mt-3 max-w-xl leading-7 text-muted">
                {search
                  ? "Try a shorter company name or clear the search to browse every verified employer."
                  : "Please check back as more verified employers join the Jooblie network."}
              </p>
              {search ? (
                <button
                  className="mt-5 rounded-md bg-primary px-5 py-2.5 font-semibold text-white outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  onClick={clearSearch}
                  type="button"
                >
                  Browse all companies
                </button>
              ) : null}
            </div>
          ) : null}

          {companiesQuery.data && companiesQuery.data.rows.length > 0 ? (
            <>
              <div className="mt-8 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {companiesQuery.data.rows.map((company) => (
                  <CompanyCard company={company} key={company.id} />
                ))}
              </div>

              <nav
                aria-label="Company directory pages"
                className="mt-8 flex items-center justify-between rounded-xl border border-border bg-white p-4 shadow-sm"
              >
                <button
                  className="rounded-md border border-border px-4 py-2 text-sm font-semibold outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  type="button"
                >
                  Previous
                </button>
                <span className="text-sm text-muted">Page {page}</span>
                <button
                  className="rounded-md border border-border px-4 py-2 text-sm font-semibold outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!companiesQuery.data.hasMore}
                  onClick={() => setPage(page + 1)}
                  type="button"
                >
                  Next
                </button>
              </nav>
            </>
          ) : null}
        </Container>
      </section>

      <section
        aria-labelledby="companies-cta-heading"
        className="border-t border-border bg-white py-14 sm:py-20"
      >
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 rounded-2xl bg-brandNavy p-7 text-white shadow-lg sm:p-10 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-wider text-primary">
                Join the directory
              </p>
              <h2
                className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
                id="companies-cta-heading"
              >
                Hiring in Canada?
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-white/75">
                Create an employer account, complete company verification and
                publish your next opportunity on Jooblie.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:shrink-0">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-5 py-3 font-bold text-white outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brandNavy"
                to="/signup?role=recruiter"
              >
                Post a job
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/30 px-5 py-3 font-bold text-white outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brandNavy"
                to="/jobs"
              >
                Browse jobs
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
