export function LoadingScreen() {
  return (
    <div
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-background"
      role="status"
    >
      <div className="text-center">
        <span
          aria-hidden="true"
          className="mx-auto block size-8 animate-spin rounded-full border-2 border-primary border-r-transparent"
        />
        <p className="mt-3 text-sm text-muted">Loading admin console…</p>
      </div>
    </div>
  );
}
