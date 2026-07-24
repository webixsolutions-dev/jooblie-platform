export function LoadingPage() {
  return (
    <div
      className="grid min-h-[50vh] place-items-center"
      role="status"
      aria-live="polite"
    >
      <div className="text-center">
        <span
          className="mx-auto block size-7 rounded-full border-2 border-primary border-r-transparent"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm text-muted">Loading…</p>
      </div>
    </div>
  );
}
