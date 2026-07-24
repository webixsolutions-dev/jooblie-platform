import type {
  ApplicationStatus,
  JobListRow,
} from "@jooblie/core";

type JobDisplayData = Pick<
  JobListRow,
  | "city"
  | "employment_type"
  | "is_remote"
  | "province"
  | "published_at"
  | "salary_currency"
  | "salary_max"
  | "salary_min"
  | "salary_period"
>;

const employmentTypeLabels: Readonly<Record<JobListRow["employment_type"], string>> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  temporary: "Temporary",
  internship: "Internship",
  seasonal: "Seasonal",
};

export const applicationStatusLabels: Readonly<
  Record<ApplicationStatus, string>
> = {
  submitted: "Submitted",
  viewed: "Viewed",
  shortlisted: "Shortlisted",
  interviewing: "Interviewing",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export function formatEmploymentType(
  employmentType: JobListRow["employment_type"],
): string {
  return employmentTypeLabels[employmentType];
}

export function formatJobLocation(job: JobDisplayData): string {
  if (job.is_remote) {
    return "Remote";
  }

  return [job.city, job.province].filter(Boolean).join(", ") || "Location not specified";
}

export function formatPostedDate(publishedAt: string | null): string {
  if (!publishedAt) {
    return "Recently posted";
  }

  return new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(publishedAt));
}

export function formatSalary(job: JobDisplayData): string | null {
  if (job.salary_min === null && job.salary_max === null) {
    return null;
  }

  const formatter = new Intl.NumberFormat("en-CA", {
    currency: job.salary_currency,
    maximumFractionDigits: 0,
    style: "currency",
  });
  const period = job.salary_period ? ` / ${job.salary_period}` : "";

  if (job.salary_min !== null && job.salary_max !== null) {
    return `${formatter.format(job.salary_min)}–${formatter.format(job.salary_max)}${period}`;
  }

  return `${formatter.format(job.salary_min ?? job.salary_max ?? 0)}${period}`;
}

export function getCompanyInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}
