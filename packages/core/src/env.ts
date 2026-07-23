import { isAppSlug, type AppSlug } from "./site-registry";

type ViteEnvironment = Readonly<Record<string, string | boolean | undefined>>;

function readRequiredEnv(name: string, environment: ViteEnvironment): string {
  const value = environment[name];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `Missing required environment variable ${name}. Add it to the app's .env file.`,
    );
  }

  return value.trim();
}

function readSupabaseUrl(environment: ViteEnvironment): string {
  const value = readRequiredEnv("VITE_SUPABASE_URL", environment);

  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    throw new Error(
      "VITE_SUPABASE_URL must be a valid http:// or https:// URL.",
    );
  }

  return value;
}

function readAppSlug(environment: ViteEnvironment): AppSlug {
  const value = readRequiredEnv("VITE_SITE_SLUG", environment);

  if (!isAppSlug(value)) {
    throw new Error(
      `Unknown VITE_SITE_SLUG "${value}". Use a registered site slug or "admin".`,
    );
  }

  return value;
}

const viteEnvironment = (
  import.meta as ImportMeta & { readonly env?: ViteEnvironment }
).env;

if (!viteEnvironment) {
  throw new Error(
    "Vite environment variables are unavailable. @jooblie/core must run in a Vite application.",
  );
}

export const env = Object.freeze({
  supabaseUrl: readSupabaseUrl(viteEnvironment),
  supabaseAnonKey: readRequiredEnv(
    "VITE_SUPABASE_ANON_KEY",
    viteEnvironment,
  ),
  appSlug: readAppSlug(viteEnvironment),
});

export type CoreEnvironment = typeof env;
