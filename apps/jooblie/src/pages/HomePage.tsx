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
      <section className="bg-brandNavy text-white">
        <Container className="py-16 sm:py-24">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">
              Canada’s connected job network
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              One search across the Jooblie network.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
              Find current opportunities from Jooblie and our focused Canadian
              partner job sites, all in one place.
            </p>

            <form
              className="mt-8 grid gap-3 rounded-xl bg-white p-3 text-foreground shadow-lg sm:grid-cols-[1fr_0.7fr_auto]"
              onSubmit={handleSearch}
            >
              <label className="sr-only" htmlFor="home-keywords">
                Keywords
              </label>
              <input
                className="rounded-md border border-border px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
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
                className="rounded-md border border-border px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                id="home-location"
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
                type="text"
                value={city}
              />
              <button
                className="rounded-md bg-primary px-6 py-3 font-bold text-white hover:bg-blue-700"
                type="submit"
              >
                Search jobs
              </button>
            </form>
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-16">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-primary">
                Browse by category
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                Find work in your field
              </h2>
            </div>
            <Link className="font-bold text-primary underline" to="/jobs">
              View all jobs
            </Link>
          </div>

          {sectorsQuery.isLoading || categoriesQuery.isLoading ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["category-one", "category-two", "category-three"].map(
                (key) => (
                  <div
                    className="h-40 animate-pulse rounded-xl border border-border bg-white"
                    key={key}
                  />
                ),
              )}
            </div>
          ) : null}

          {sectorsQuery.data && categoriesQuery.data ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sectorsQuery.data.map((sector) => {
                const sectorCategories = categoriesQuery.data.filter(
                  (category) => category.sector_id === sector.id,
                );

                return (
                  <article
                    className="rounded-xl border border-border bg-white p-5 shadow-sm"
                    key={sector.id}
                  >
                    <h3 className="text-lg font-bold">{sector.name}</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {sectorCategories.map((category) => (
                        <Link
                          className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
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

      <section className="border-y border-border bg-white py-14">
        <Container>
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              Just posted
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Recent active jobs
            </h2>
          </div>

          {recentJobsQuery.isLoading ? (
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {["recent-one", "recent-two", "recent-three", "recent-four"].map(
                (key) => (
                  <div
                    className="h-52 animate-pulse rounded-xl border border-border bg-background"
                    key={key}
                  />
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
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                {recentJobsQuery.data.rows.map((job) => (
                  <JobCard job={job} key={job.id} />
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-xl border border-border bg-background p-6 text-muted">
                No active jobs are available right now. Please check back soon.
              </p>
            )
          ) : null}
        </Container>
      </section>

      {recentJobsQuery.data && recentJobsQuery.data.rows.length > 0 ? (
        <section className="bg-blue-50 py-12">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-primary">
                  Recommended for you
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  More recent opportunities
                </h2>
                <p className="mt-1 text-sm text-muted">
                  A simple selection of recent jobs — not personalised.
                </p>
              </div>
              <Link className="font-bold text-primary underline" to="/jobs">
                Browse all
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {recentJobsQuery.data.rows.slice(0, 4).map((job) => (
                <JobCard job={job} key={`recommended-${job.id}`} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="py-14 sm:py-16">
        <Container>
          <div className="rounded-2xl bg-brandNavy px-6 py-10 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-10">
            <div>
              <h2 className="text-3xl font-bold">Hiring across Canada?</h2>
              <p className="mt-3 max-w-2xl leading-7 text-slate-200">
                Create a recruiter account to start building your company
                workspace on Jooblie.
              </p>
            </div>
            <Link
              className="mt-6 inline-flex shrink-0 rounded-md bg-primary px-5 py-3 font-bold text-white hover:bg-blue-700 sm:mt-0"
              to="/signup?role=recruiter"
            >
              For Employers
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
