import { useState, type FormEvent } from "react";
import {
  env,
  resolveSite,
  toUserMessage,
  useCategories,
  useJobs,
  useSectors,
} from "@jooblie/core";
import { Link, useNavigate } from "react-router-dom";

import { Container } from "../components/Container";
import { JobCard } from "../components/JobCard";

export function HomePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const siteId = resolveSite(env.appSlug)?.id ?? null;
  const sectorsQuery = useSectors();
  const categoriesQuery = useCategories();
  const recentJobsQuery = useJobs({
    page: 1,
    pageSize: 8,
    siteId,
  });

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (city.trim()) {
      params.set("city", city.trim());
    }

    navigate(`/jobs${params.size > 0 ? `?${params.toString()}` : ""}`);
  };

  return (
    <>
      <section
        aria-labelledby="home-hero-heading"
        className="relative isolate overflow-hidden bg-brandNavy bg-cover bg-center text-white"
        style={{ backgroundImage: "url('/images/hero-workplace.jpg')" }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-brandNavy/80"
        />
        <Container className="py-20 sm:py-28 lg:py-32">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/80">
              Canada’s connected job network
            </p>
            <h1
              className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl"
              id="home-hero-heading"
            >
              One search across the Jooblie network.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/80">
              Find current opportunities from Jooblie and our focused Canadian
              partner job sites, all in one place.
            </p>

            <form
              className="mt-9 grid min-w-0 gap-3 rounded-xl bg-white p-3 text-foreground shadow-lg sm:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_auto]"
              onSubmit={handleSearch}
            >
              <label className="sr-only" htmlFor="home-keywords">
                Keywords
              </label>
              <input
                className="min-w-0 rounded-md border border-border px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                id="home-keywords"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Job title, skill, or keyword"
                type="search"
                value={search}
              />
              <label className="sr-only" htmlFor="home-location">
                City
              </label>
              <input
                className="min-w-0 rounded-md border border-border px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                id="home-location"
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
                type="text"
                value={city}
              />
              <button
                className="rounded-md bg-primary px-6 py-3 font-bold text-white outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60"
                type="submit"
              >
                Search jobs
              </button>
            </form>
          </div>
        </Container>
      </section>

      <section
        aria-labelledby="home-categories-heading"
        className="py-14 sm:py-20"
      >
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-primary">
                Browse by category
              </p>
              <h2
                className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
                id="home-categories-heading"
              >
                Find work in your field
              </h2>
            </div>
            <Link
              className="rounded font-bold text-primary underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-primary"
              to="/jobs"
            >
              View all jobs
            </Link>
          </div>

          {sectorsQuery.isLoading || categoriesQuery.isLoading ? (
            <div
              aria-label="Loading job categories"
              className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              role="status"
            >
              {[
                "category-one",
                "category-two",
                "category-three",
                "category-four",
                "category-five",
                "category-six",
              ].map((key) => (
                <div
                  className="h-48 animate-pulse rounded-xl border border-border bg-white motion-reduce:animate-none"
                  key={key}
                />
              ))}
            </div>
          ) : null}

          {sectorsQuery.data && categoriesQuery.data ? (
            <div className="mt-8 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sectorsQuery.data.map((sector) => {
                const sectorCategories = categoriesQuery.data.filter(
                  (category) => category.sector_id === sector.id,
                );

                return (
                  <article
                    className="h-full rounded-xl border border-border bg-white p-6 shadow-sm transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none"
                    key={sector.id}
                  >
                    <h3 className="text-xl font-bold tracking-tight">
                      {sector.name}
                    </h3>
                    <div className="mt-5 flex flex-wrap gap-2.5">
                      {sectorCategories.map((category) => (
                        <Link
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium outline-none transition-colors hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none"
                          key={category.id}
                          to={`/jobs?categoryIds=${category.id}`}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </Container>
      </section>

      <section
        aria-labelledby="home-recent-jobs-heading"
        className="border-y border-border bg-white py-14 sm:py-20"
      >
        <Container>
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Just posted
            </p>
            <h2
              className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
              id="home-recent-jobs-heading"
            >
              Recent active jobs
            </h2>
          </div>

          {recentJobsQuery.isLoading ? (
            <div
              aria-label="Loading recent jobs"
              className="mt-8 grid gap-5 md:grid-cols-2"
              role="status"
            >
              {["recent-one", "recent-two", "recent-three", "recent-four"].map(
                (key) => (
                  <div
                    className="h-60 animate-pulse rounded-xl border border-border bg-background p-6 motion-reduce:animate-none"
                    key={key}
                  >
                    <div className="h-3 w-28 rounded bg-border" />
                    <div className="mt-4 h-6 w-3/4 rounded bg-border" />
                    <div className="mt-3 h-4 w-1/2 rounded bg-border" />
                    <div className="mt-8 h-4 w-5/6 rounded bg-border" />
                    <div className="mt-8 h-px bg-border" />
                  </div>
                ),
              )}
            </div>
          ) : null}

          {recentJobsQuery.isError ? (
            <p className="mt-6 text-red-700" role="alert">
              {toUserMessage(recentJobsQuery.error)}
            </p>
          ) : null}

          {recentJobsQuery.data ? (
            recentJobsQuery.data.rows.length > 0 ? (
              <div className="mt-8 grid items-stretch gap-5 md:grid-cols-2">
                {recentJobsQuery.data.rows.map((job) => (
                  <JobCard
                    headingLevel={3}
                    job={job}
                    key={job.id}
                    variant="home"
                  />
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-border bg-background px-6 py-10 text-center">
                <h3 className="text-lg font-bold">No jobs to show right now</h3>
                <p className="mt-2 text-sm text-muted">
                  Please check back soon for new opportunities.
                </p>
              </div>
            )
          ) : null}
        </Container>
      </section>

      {!recentJobsQuery.isError ? (
        <section
          aria-labelledby="home-more-jobs-heading"
          className="bg-background py-14 sm:py-20"
        >
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-primary">
                  Recommended for you
                </p>
                <h2
                  className="mt-2 text-3xl font-bold tracking-tight"
                  id="home-more-jobs-heading"
                >
                  More recent opportunities
                </h2>
                <p className="mt-1 text-sm text-muted">
                  A simple selection of recent jobs — not personalised.
                </p>
              </div>
              <Link
                className="rounded font-bold text-primary underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                to="/jobs"
              >
                Browse all
              </Link>
            </div>

            {recentJobsQuery.isLoading ? (
              <div
                aria-label="Loading more recent jobs"
                className="mt-8 grid gap-5 md:grid-cols-2"
                role="status"
              >
                {["more-one", "more-two", "more-three", "more-four"].map(
                  (key) => (
                    <div
                      className="h-60 animate-pulse rounded-xl border border-border bg-white p-6 motion-reduce:animate-none"
                      key={key}
                    >
                      <div className="h-3 w-28 rounded bg-border" />
                      <div className="mt-4 h-6 w-3/4 rounded bg-border" />
                      <div className="mt-3 h-4 w-1/2 rounded bg-border" />
                      <div className="mt-8 h-4 w-5/6 rounded bg-border" />
                      <div className="mt-8 h-px bg-border" />
                    </div>
                  ),
                )}
              </div>
            ) : null}

            {recentJobsQuery.data &&
            recentJobsQuery.data.rows.length > 0 ? (
              <div className="mt-8 grid items-stretch gap-5 md:grid-cols-2">
                {recentJobsQuery.data.rows.slice(0, 4).map((job) => (
                  <JobCard
                    headingLevel={3}
                    job={job}
                    key={`recommended-${job.id}`}
                    variant="home"
                  />
                ))}
              </div>
            ) : null}

            {recentJobsQuery.data &&
            recentJobsQuery.data.rows.length === 0 ? (
              <div className="mt-8 rounded-xl border border-border bg-white px-6 py-10 text-center">
                <h3 className="text-lg font-bold">No jobs to show right now</h3>
                <p className="mt-2 text-sm text-muted">
                  Please check back soon for new opportunities.
                </p>
              </div>
            ) : null}
          </Container>
        </section>
      ) : null}

      <section
        aria-labelledby="home-employer-heading"
        className="bg-brandNavy py-12 text-white sm:py-16"
      >
        <Container className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <h2
              className="text-3xl font-bold tracking-tight sm:text-4xl"
              id="home-employer-heading"
            >
              Hiring across Canada?
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/75">
              Create a recruiter account to start building your company
              workspace on Jooblie.
            </p>
          </div>
          <Link
            className="inline-flex shrink-0 rounded-md bg-primary px-5 py-3 font-bold text-white outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brandNavy"
            to="/signup?role=recruiter"
          >
            For Employers
          </Link>
        </Container>
      </section>
    </>
  );
}
