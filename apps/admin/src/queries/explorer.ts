export const EXPLORER_PAGE_SIZE = 25;

export type ExplorerResult<Row> = {
  readonly rows: Row[];
  readonly total: number;
};

export function getExplorerQueryKey<Filters extends object>(
  resource: string,
  filters: Filters,
  page: number,
  sort: string,
) {
  return ["admin", resource, "explorer", filters, page, sort] as const;
}

export function getExplorerQueryPrefix(resource: string) {
  return ["admin", resource, "explorer"] as const;
}

export function getExplorerRange(page: number) {
  const from = Math.max(0, page) * EXPLORER_PAGE_SIZE;

  return {
    from,
    to: from + EXPLORER_PAGE_SIZE - 1,
  } as const;
}
