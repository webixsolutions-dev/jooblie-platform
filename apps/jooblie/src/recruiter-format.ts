import type {
  ApplicationStatus,
  JobStatus,
} from "@jooblie/core";

export const companyVerificationLabels = {
  pending: "Pending verification",
  rejected: "Verification rejected",
  verified: "Verified",
} as const;

export const jobStatusLabels: Readonly<Record<JobStatus, string>> = {
  active: "Active",
  closed: "Closed",
  expired: "Expired",
  pending_review: "Pending review",
  removed: "Removed",
};

export const jobStatusClasses: Readonly<Record<JobStatus, string>> = {
  active: "bg-green-100 text-green-800",
  closed: "bg-slate-200 text-slate-700",
  expired: "bg-amber-100 text-amber-900",
  pending_review: "bg-blue-100 text-blue-800",
  removed: "bg-red-100 text-red-800",
};

const recruiterStatusTransitions: Readonly<
  Record<ApplicationStatus, readonly ApplicationStatus[]>
> = {
  submitted: [
    "viewed",
    "shortlisted",
    "interviewing",
    "offered",
    "rejected",
  ],
  viewed: ["shortlisted", "interviewing", "offered", "rejected"],
  shortlisted: ["interviewing", "offered", "rejected"],
  interviewing: ["offered", "rejected"],
  offered: ["hired", "rejected"],
  hired: [],
  rejected: [],
  withdrawn: [],
};

export function getRecruiterStatusOptions(
  status: ApplicationStatus,
): readonly ApplicationStatus[] {
  return recruiterStatusTransitions[status];
}

export function formatDate(
  value: string | null,
  fallback = "Not set",
): string {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
