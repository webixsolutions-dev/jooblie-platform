import { describe, expect, it } from "vitest";

import { createQueryClient } from "./query-client";
import { queryKeys, type JobListFilters } from "./query-keys";
import { requireMutationData } from "./shared";

describe("query client defaults", () => {
  it("uses the shared low-churn job-board defaults", () => {
    const queryClient = createQueryClient();

    expect(queryClient.getDefaultOptions()).toMatchObject({
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    });
  });
});

describe("query key registry", () => {
  it("includes site, filters, and pagination in job list keys", () => {
    const filters: JobListFilters = {
      search: "react developer",
      categoryIds: [201],
      page: 2,
      pageSize: 20,
    };

    expect(queryKeys.jobs.list(2, filters)).toEqual([
      "jobs",
      "list",
      2,
      filters,
    ]);
    expect(queryKeys.jobs.list(null, filters)).not.toEqual(
      queryKeys.jobs.list(2, filters),
    );
  });

  it("provides stable prefixes for precise invalidation", () => {
    expect(queryKeys.jobs.lists()).toEqual(["jobs", "list"]);
    expect(queryKeys.applications.forJob("job-id")).toEqual([
      "applications",
      "for-job",
      "job-id",
    ]);
    expect(queryKeys.notifications.unreadCount()).toEqual([
      "notifications",
      "unread-count",
    ]);
  });
});

describe("mutation result normalization", () => {
  it("returns successful mutation data unchanged", () => {
    const row = { id: "row-id" };

    expect(requireMutationData(row, null)).toBe(row);
  });

  it.each([
    ["23505", "You've already applied to this job"],
    ["42501", "You don't have permission to do that"],
    ["JB008", "That application status change isn't allowed"],
  ])("maps %s through the shared error catalog", (code, message) => {
    expect(() =>
      requireMutationData(null, { code }),
    ).toThrowError(message);
  });
});
