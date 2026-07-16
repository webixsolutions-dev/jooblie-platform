export type SiteRegistryEntry = {
  id: number;
  slug: string;
  name: string;
  domain: string;
  siteType: "aggregator" | "sector" | "audience";
};

export const siteRegistry: SiteRegistryEntry[] = [
  {
    id: 1,
    slug: "jooblie",
    name: "Jooblie",
    domain: "jooblie.com",
    siteType: "aggregator",
  },
  {
    id: 2,
    slug: "it-jobs",
    name: "IT Jobs Jobline",
    domain: "it-jobs.placeholder.jooblie.com",
    siteType: "sector",
  },
  {
    id: 3,
    slug: "office-jobs",
    name: "Office Jobs Jobline",
    domain: "office-jobs.placeholder.jooblie.com",
    siteType: "sector",
  },
  {
    id: 4,
    slug: "hospitality-healthcare",
    name: "Hospitality & Healthcare Jobline",
    domain: "hospitality-healthcare.placeholder.jooblie.com",
    siteType: "sector",
  },
  {
    id: 5,
    slug: "transport-farming",
    name: "Transportation & Farming Jobline",
    domain: "transport-farming.placeholder.jooblie.com",
    siteType: "sector",
  },
  {
    id: 6,
    slug: "aboriginal",
    name: "Aboriginal Jobline",
    domain: "aboriginal.placeholder.jooblie.com",
    siteType: "audience",
  },
  {
    id: 7,
    slug: "newcomers",
    name: "New Comers Jobline",
    domain: "newcomers.placeholder.jooblie.com",
    siteType: "audience",
  },
];
