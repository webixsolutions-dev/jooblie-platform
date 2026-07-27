import type { FormEvent, ReactNode } from "react";

type ExplorerFiltersProps = {
  readonly children: ReactNode;
  readonly hasActiveFilters: boolean;
  readonly isApplying?: boolean;
  readonly onApply: () => void;
  readonly onClear: () => void;
};

export function ExplorerFilters({
  children,
  hasActiveFilters,
  isApplying = false,
  onApply,
  onClear,
}: ExplorerFiltersProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  return (
    <form
      className="rounded-xl border border-border bg-white p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Filters</h2>
          <p className="mt-1 text-xs text-muted">
            Filters run on the server when applied.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-md border border-border bg-white px-3 py-2 text-sm font-semibold text-foreground hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasActiveFilters || isApplying}
            onClick={onClear}
            type="button"
          >
            Clear
          </button>
          <button
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isApplying}
            type="submit"
          >
            {isApplying ? "Applying…" : "Apply filters"}
          </button>
        </div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </form>
  );
}
