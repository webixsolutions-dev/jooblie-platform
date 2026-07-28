import { getSupabaseClient } from "@jooblie/core";
import { useQuery } from "@tanstack/react-query";

import type { Enums } from "../../../../packages/core/src/database.types";

const DASHBOARD_STATS_QUERY_KEY = [
  "admin",
  "dashboard",
  "stats",
] as const;

type CompanyVerification = Enums<"company_verification">;
type JobStatus = Enums<"job_status">;
type ApplicationStatus = Enums<"application_status">;

const COMPANY_STATUSES = [
  "pending",
  "verified",
  "rejected",
] as const satisfies readonly CompanyVerification[];

const JOB_STATUSES = [
  "pending_review",
  "active",
  "closed",
  "expired",
  "removed",
] as const satisfies readonly JobStatus[];

const APPLICATION_STATUSES = [
  "submitted",
  "viewed",
  "shortlisted",
  "interviewing",
  "offered",
  "hired",
  "rejected",
  "withdrawn",
] as const satisfies readonly ApplicationStatus[];

export type DashboardStats = {
  readonly companies: {
    readonly total: number;
    readonly pending: number;
    readonly verified: number;
    readonly rejected: number;
  };
  readonly jobs: {
    readonly total: number;
    readonly pendingReview: number;
    readonly active: number;
    readonly closed: number;
    readonly expired: number;
    readonly removed: number;
  };
  readonly applications: {
    readonly total: number;
    readonly submitted: number;
    readonly viewed: number;
    readonly shortlisted: number;
    readonly interviewing: number;
    readonly offered: number;
    readonly hired: number;
    readonly rejected: number;
    readonly withdrawn: number;
  };
};

async function fetchCompanyCount(
  status: CompanyVerification,
): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from("companies")
    .select("id", { count: "exact", head: true })
    .eq("verification_status", status)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function fetchJobCount(status: JobStatus): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", status)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function fetchApplicationCount(
  status: ApplicationStatus,
): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("status", status)
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const [companyCounts, jobCounts, applicationCounts] =
    await Promise.all([
      Promise.all(COMPANY_STATUSES.map(fetchCompanyCount)),
      Promise.all(JOB_STATUSES.map(fetchJobCount)),
      Promise.all(APPLICATION_STATUSES.map(fetchApplicationCount)),
    ]);

  const pendingCompanies = companyCounts[0] ?? 0;
  const verifiedCompanies = companyCounts[1] ?? 0;
  const rejectedCompanies = companyCounts[2] ?? 0;
  const pendingReviewJobs = jobCounts[0] ?? 0;
  const activeJobs = jobCounts[1] ?? 0;
  const closedJobs = jobCounts[2] ?? 0;
  const expiredJobs = jobCounts[3] ?? 0;
  const removedJobs = jobCounts[4] ?? 0;
  const submittedApplications = applicationCounts[0] ?? 0;
  const viewedApplications = applicationCounts[1] ?? 0;
  const shortlistedApplications = applicationCounts[2] ?? 0;
  const interviewingApplications = applicationCounts[3] ?? 0;
  const offeredApplications = applicationCounts[4] ?? 0;
  const hiredApplications = applicationCounts[5] ?? 0;
  const rejectedApplications = applicationCounts[6] ?? 0;
  const withdrawnApplications = applicationCounts[7] ?? 0;

  return {
    companies: {
      total:
        pendingCompanies + verifiedCompanies + rejectedCompanies,
      pending: pendingCompanies,
      verified: verifiedCompanies,
      rejected: rejectedCompanies,
    },
    jobs: {
      total:
        pendingReviewJobs +
        activeJobs +
        closedJobs +
        expiredJobs +
        removedJobs,
      pendingReview: pendingReviewJobs,
      active: activeJobs,
      closed: closedJobs,
      expired: expiredJobs,
      removed: removedJobs,
    },
    applications: {
      total:
        submittedApplications +
        viewedApplications +
        shortlistedApplications +
        interviewingApplications +
        offeredApplications +
        hiredApplications +
        rejectedApplications +
        withdrawnApplications,
      submitted: submittedApplications,
      viewed: viewedApplications,
      shortlisted: shortlistedApplications,
      interviewing: interviewingApplications,
      offered: offeredApplications,
      hired: hiredApplications,
      rejected: rejectedApplications,
      withdrawn: withdrawnApplications,
    },
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: fetchDashboardStats,
  });
}
