import type { Database } from "../database.types";

type EmploymentType = Database["public"]["Enums"]["employment_type"];

export type JobListFilters = {
  readonly search?: string;
  readonly categoryIds?: readonly number[];
  readonly employmentTypes?: readonly EmploymentType[];
  readonly isRemote?: boolean;
  readonly province?: string;
  readonly city?: string;
  readonly salaryMin?: number;
  readonly page: number;
  readonly pageSize: number;
};

export const queryKeys = {
  jobs: {
    all: ["jobs"] as const,
    lists: () => ["jobs", "list"] as const,
    list: (siteId: number | null, filters: JobListFilters) =>
      ["jobs", "list", siteId, filters] as const,
    details: () => ["jobs", "detail"] as const,
    detail: (id: string) => ["jobs", "detail", id] as const,
    mine: (companyId: string | null) =>
      ["jobs", "mine", companyId] as const,
  },
  taxonomy: {
    all: ["taxonomy"] as const,
    sectors: () => ["taxonomy", "sectors"] as const,
    categories: () => ["taxonomy", "categories"] as const,
  },
  applications: {
    all: ["applications"] as const,
    mine: () => ["applications", "mine"] as const,
    details: () => ["applications", "detail"] as const,
    detail: (id: string) => ["applications", "detail", id] as const,
    forJob: (jobId: string | null) =>
      ["applications", "for-job", jobId] as const,
  },
  savedJobs: {
    all: ["saved-jobs"] as const,
    list: () => ["saved-jobs", "list"] as const,
  },
  company: {
    all: ["company"] as const,
    mine: () => ["company", "mine"] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: () => ["notifications", "list"] as const,
    unreadCount: () => ["notifications", "unread-count"] as const,
  },
} as const;
