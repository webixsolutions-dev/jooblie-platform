type ExplorerPaginationProps = {
  readonly disabled?: boolean;
  readonly onPageChange: (page: number) => void;
  readonly page: number;
  readonly pageSize: number;
  readonly totalRows: number;
};

export function ExplorerPagination({
  disabled = false,
  onPageChange,
  page,
  pageSize,
  totalRows,
}: ExplorerPaginationProps) {
  if (totalRows === 0) {
    return null;
  }

  const pageCount = Math.ceil(totalRows / pageSize);
  const firstRow = page * pageSize + 1;
  const lastRow = Math.min(firstRow + pageSize - 1, totalRows);

  return (
    <nav
      aria-label="Explorer pagination"
      className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-5 py-4 shadow-sm"
    >
      <p className="text-sm text-muted">
        Showing{" "}
        <span className="font-semibold text-foreground">
          {firstRow}–{lastRow}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-foreground">{totalRows}</span>
      </p>
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted">
          Page {page + 1} of {pageCount}
        </p>
        <button
          className="rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || page === 0}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          Previous
        </button>
        <button
          className="rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || page + 1 >= pageCount}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
