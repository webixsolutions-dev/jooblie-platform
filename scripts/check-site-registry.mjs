import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = path.join(rootDir, "packages/core/src/site-registry.ts");
const appsDir = path.join(rootDir, "apps");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function loadSiteRegistry() {
  const source = await readFile(registryPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: registryPath,
    reportDiagnostics: true,
  });

  const errors = transpiled.diagnostics?.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );

  assert(!errors?.length, "site-registry.ts could not be transpiled");

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(
    transpiled.outputText,
  ).toString("base64")}`;
  const registryModule = await import(moduleUrl);

  assert(
    Array.isArray(registryModule.siteRegistry),
    "site-registry.ts must export a siteRegistry array",
  );

  return registryModule.siteRegistry;
}

async function verifyApp(site) {
  const appDir = path.join(appsDir, site.slug);
  const envPath = path.join(appDir, ".env.example");
  const packagePath = path.join(appDir, "package.json");

  await access(appDir);
  await access(packagePath);

  const env = await readFile(envPath, "utf8");
  const configuredSlug = env
    .split(/\r?\n/)
    .find((line) => line.startsWith("VITE_SITE_SLUG="))
    ?.slice("VITE_SITE_SLUG=".length);

  assert(
    configuredSlug === site.slug,
    `${path.relative(rootDir, envPath)} must set VITE_SITE_SLUG=${site.slug}`,
  );
}

async function main() {
  const registry = await loadSiteRegistry();
  const ids = registry.map((site) => site.id);
  const slugs = registry.map((site) => site.slug);
  const domains = registry.map((site) => site.domain);
  const expectedIds = [1, 2, 3, 4, 5, 6, 7];

  assert(registry.length === 7, "site registry must contain exactly seven public sites");
  assert(new Set(ids).size === ids.length, "site registry IDs must be unique");
  assert(new Set(slugs).size === slugs.length, "site registry slugs must be unique");
  assert(new Set(domains).size === domains.length, "site registry domains must be unique");
  assert(
    ids.every((id, index) => id === expectedIds[index]),
    "site registry IDs must be ordered and fixed from 1 through 7",
  );
  assert(
    registry[0]?.slug === "jooblie" &&
      registry[0]?.siteType === "aggregator",
    "site ID 1 must be the Jooblie aggregator",
  );
  assert(
    registry.slice(1).every((site) => site.siteType !== "aggregator"),
    "only Jooblie may be marked as an aggregator",
  );

  await Promise.all(registry.map(verifyApp));

  const appDirectories = (await readdir(appsDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const expectedAppDirectories = [...slugs, "admin"].sort();

  assert(
    JSON.stringify(appDirectories) === JSON.stringify(expectedAppDirectories),
    `apps/ must contain exactly: ${expectedAppDirectories.join(", ")}`,
  );

  console.log(
    `Site registry contract verified for ${registry.length} public sites and the admin app.`,
  );
  console.log("Database seed comparison will activate with migration 0014 in Phase 1.9.");
}

main().catch((error) => {
  console.error(`Site registry verification failed: ${error.message}`);
  process.exitCode = 1;
});
