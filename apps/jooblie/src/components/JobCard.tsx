import type { ReactNode } from "react";
import type { JobListRow } from "@jooblie/core";
import { Link } from "react-router-dom";

import {
  formatEmploymentType,
  formatJobLocation,
  formatPostedDate,
  formatSalary,
} from "../job-format";
import { CompanyLogo } from "./CompanyLogo";

export type JobCardData = Pick<
  JobListRow,
  | "city"
  | "employment_type"
  | "id"
  | "is_remote"
  | "province"
  | "published_at"
  | "salary_currency"
  | "salary_max"
  | "salary_min"
  | "salary_period"
  | "title"
> & {
  readonly companies: {
    readonly logo_path: string | null;
    readonly name: string;
  };
  readonly categories: {
    readonly name: string;
    readonly slug: string;
  };
};

type JobCardProps = {
  readonly actions?: ReactNode;
  readonly headingLevel?: 2 | 3;
  readonly job: JobCardData;
  readonly variant?: "default" | "home";
};

export function JobCard({
  actions,
  headingLevel = 2,
  job,
  variant = "default",
}: JobCardProps) {
  const salary = formatSalary(job);
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const isHomeVariant = variant === "home";
  const metadata = [
    formatJobLocation(job),
    formatEmploymentType(job.employment_type),
    salary,
  ].filter((value): value is string => Boolean(value));

  return (
    <article
      className={
        isHomeVariant
          ? "group flex h-full flex-col rounded-xl border border-border bg-white p-5 shadow-sm transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md motion-reduce:transform-none motion-reduce:transition-none sm:p-6"
          : "group rounded-xl border border-border bg-white p-5 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md"
      }
    >
      <div className="flex gap-4">
        <CompanyLogo
          companyName={job.companies.name}
          logoPath={job.companies.logo_path}
        />
        <div className="min-w-0 flex-1">
          <p
            className={
              isHomeVariant
                ? "text-xs font-bold uppercase tracking-wider text-primary"
                : "text-sm font-medium text-primary"
            }
          >
            {job.categories.name}
          </p>
          <Heading
            className={
              isHomeVariant
                ? "mt-1.5 text-xl font-bold leading-7"
                : "mt-1 text-lg font-bold leading-6"
            }
          >
            <Link
              className="outline-none hover:text-primary focus-visible:rounded focus-visible:ring-2 focus-visible:ring-primary"
              to={`/jobs/${job.id}`}
            >
              {job.title}
            </Link>
          </Heading>
          <p
            className={
              isHomeVariant
                ? "mt-1.5 text-sm font-medium text-muted"
                : "mt-1 text-sm font-medium text-muted"
            }
          >
            {job.companies.name}
          </p>
        </div>
      </div>

      {isHomeVariant ? (
        <div className="mb-5 mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-muted">
          {metadata.map((item, index) => (
            <span className="flex items-center gap-2" key={`${item}-${index}`}>
              {index > 0 ? <span aria-hidden="true">·</span> : null}
              <span>{item}</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
          <span>{formatJobLocation(job)}</span>
          <span>{formatEmploymentType(job.employment_type)}</span>
          {salary ? (
            <span className="font-medium text-foreground">{salary}</span>
          ) : null}
        </div>
      )}

      <div
        className={
          isHomeVariant
            ? "mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
            : "mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
        }
      >
        <span className="text-xs text-muted">
          Posted {formatPostedDate(job.published_at)}
        </span>
        {actions}
      </div>
    </article>
  );
}
