export function getRedirectUrl(path = "/auth/callback"): string {
  if (!path.startsWith("/")) {
    throw new Error("Redirect paths must start with '/'.");
  }

  return `${window.location.origin}${path}`;
}
