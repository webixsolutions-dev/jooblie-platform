export type SiteRegistryEntry = {
  id: number;
  slug: string;
  name: string;
  domain: string;
  siteType: "aggregator" | "sector" | "audience";
  themeKey: string;
  launched: boolean;
};

export const siteRegistry: SiteRegistryEntry[] = [
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
];
