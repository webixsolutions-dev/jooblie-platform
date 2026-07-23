export type SiteRegistryEntry = {
  readonly id: number;
  readonly slug: string;
  readonly name: string;
  readonly domain: string;
  readonly siteType: "aggregator" | "sector" | "audience";
  readonly themeKey: string;
  readonly launched: boolean;
};

export const siteRegistry = [
  {
    id: 1,
    slug: "jooblie",
    name: "Jooblie",
    domain: "jooblie.com",
    siteType: "aggregator",
    themeKey: "jooblie",
    launched: true,
  },
  {
    id: 2,
    slug: "office-jobs",
    name: "Office Jobs Jobline",
    domain: "office-jobline.vercel.app",
    siteType: "sector",
    themeKey: "office-jobs",
    launched: false,
  },
  {
    id: 3,
    slug: "it-jobs",
    name: "IT Jobs Jobline",
    domain: "it-jobs.placeholder.jooblie.com",
    siteType: "sector",
    themeKey: "it-jobs",
    launched: false,
  },
  {
    id: 4,
    slug: "hospitality-healthcare",
    name: "Hospitality & Healthcare Jobline",
    domain: "hospitality-healthcare.placeholder.jooblie.com",
    siteType: "sector",
    themeKey: "hospitality-healthcare",
    launched: false,
  },
  {
    id: 5,
    slug: "transport-farming",
    name: "Transportation & Farming Jobline",
    domain: "transport-farming.placeholder.jooblie.com",
    siteType: "sector",
    themeKey: "transport-farming",
    launched: false,
  },
  {
    id: 6,
    slug: "aboriginal",
    name: "Aboriginal Jobline",
    domain: "aboriginal.placeholder.jooblie.com",
    siteType: "audience",
    themeKey: "aboriginal",
    launched: false,
  },
  {
    id: 7,
    slug: "newcomers",
    name: "New Comers Jobline",
    domain: "newcomers.placeholder.jooblie.com",
    siteType: "audience",
    themeKey: "newcomers",
    launched: false,
  },
] as const satisfies readonly SiteRegistryEntry[];

export type SiteSlug = (typeof siteRegistry)[number]["slug"];
export type AppSlug = SiteSlug | "admin";

export function isSiteSlug(slug: string): slug is SiteSlug {
  return siteRegistry.some((site) => site.slug === slug);
}

export function isAppSlug(slug: string): slug is AppSlug {
  return slug === "admin" || isSiteSlug(slug);
}

export function getSiteBySlug(slug: SiteSlug): SiteRegistryEntry {
  const site = siteRegistry.find((entry) => entry.slug === slug);

  if (!site) {
    throw new Error(`Site registry invariant violated for slug: ${slug}`);
  }

  return site;
}

export function getSiteById(id: number): SiteRegistryEntry | undefined {
  return siteRegistry.find((site) => site.id === id);
}

export function resolveSite(appSlug: AppSlug): SiteRegistryEntry | null {
  return appSlug === "admin" ? null : getSiteBySlug(appSlug);
}
