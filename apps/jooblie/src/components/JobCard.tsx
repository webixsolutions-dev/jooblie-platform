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
  readonly job: JobCardData;
};

export function JobCard({ actions, job }: JobCardProps) {
  const salary = formatSalary(job);

  return (
    <article className="group rounded-xl border border-border bg-white p-5 shadow-sm transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex gap-4">
        <CompanyLogo
          companyName={job.companies.name}
          logoPath={job.companies.logo_path}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary">
            {job.categories.name}
          </p>
          <h2 className="mt-1 text-lg font-bold leading-6">
            <Link
              className="outline-none hover:text-primary focus-visible:rounded focus-visible:ring-2 focus-visible:ring-primary"
              to={`/jobs/${job.id}`}
            >
              {job.title}
            </Link>
          </h2>
          <p className="mt-1 text-sm font-medium text-muted">
            {job.companies.name}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
        <span>{formatJobLocation(job)}</span>
        <span>{formatEmploymentType(job.employment_type)}</span>
        {salary ? <span className="font-medium text-foreground">{salary}</span> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-xs text-muted">
          Posted {formatPostedDate(job.published_at)}
        </span>
        {actions}
      </div>
    </article>
  );
}
