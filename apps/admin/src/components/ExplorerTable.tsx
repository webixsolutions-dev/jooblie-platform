import type { ReactNode } from "react";

export type ExplorerColumn<Row> = {
  readonly cell: (row: Row) => ReactNode;
  readonly className?: string;
  readonly header: string;
  readonly key: string;
};

type ExplorerTableProps<Row> = {
  readonly ariaLabel: string;
  readonly columns: readonly ExplorerColumn<Row>[];
  readonly emptyMessage: string;
  readonly emptyTitle: string;
  readonly errorMessage: string | null;
  readonly getRowKey: (row: Row) => string;
  readonly isLoading: boolean;
  readonly loadingLabel: string;
  readonly onRetry: () => void;
  readonly rows: readonly Row[];
  readonly selectedRowKey?: string | null;
};

export function ExplorerTable<Row>({
  ariaLabel,
  columns,
  emptyMessage,
  emptyTitle,
  errorMessage,
  getRowKey,
  isLoading,
  loadingLabel,
  onRetry,
  rows,
  selectedRowKey,
}: ExplorerTableProps<Row>) {
  if (isLoading) {
    return (
      <div
        className="grid min-h-72 place-items-center rounded-xl border border-border bg-white shadow-sm"
        role="status"
      >
        <div className="text-center">
          <span
            aria-hidden="true"
            className="mx-auto block size-8 animate-spin rounded-full border-2 border-primary border-r-transparent"
          />
          <p className="mt-3 text-sm text-muted">{loadingLabel}</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 p-8 text-red-800"
        role="alert"
      >
        <h2 className="text-lg font-semibold">We couldn&apos;t load this explorer</h2>
        <p className="mt-2 text-sm">{errorMessage}</p>
        <button
          className="mt-5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-semibold">{emptyTitle}</h2>
        <p className="mt-2 text-sm text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <caption className="sr-only">{ariaLabel}</caption>
          <thead className="border-b border-border bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  className={`whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted ${
                    column.className ?? ""
                  }`}
                  key={column.key}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const rowKey = getRowKey(row);

              return (
                <tr
                  className={
                    rowKey === selectedRowKey
                      ? "bg-blue-50"
                      : "transition-colors hover:bg-slate-50"
                  }
                  key={rowKey}
                >
                  {columns.map((column) => (
                    <td
                      className={`px-4 py-3 align-top ${
                        column.className ?? ""
                      }`}
                      key={column.key}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
