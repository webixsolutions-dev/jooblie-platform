import { useQuery } from "@tanstack/react-query";
import type {
  QueryData,
  SupabaseClient,
} from "@supabase/supabase-js";

import { getSupabaseClient } from "../client";
import type { Database } from "../database.types";
import {
  queryKeys,
  type CompanyDirectoryFilters,
} from "./query-keys";

const PUBLIC_COMPANY_SELECT = `
  id,
  name,
  website,
  logo_path,
  description,
  created_at
` as const;

const AUTHENTICATED_COMPANY_SELECT = `
  id,
  name,
  website,
  logo_path,
  description,
  created_at,
  verification_status,
  status,
  deleted_at
` as const;

const COMPANY_JOB_COUNT_SELECT = `
  id,
  company_id,
  job_sites!inner(site_id)
` as const;

const READ_BATCH_SIZE = 1_000;

function createPublicCompaniesQuery(client: SupabaseClient<Database>) {
  return client
    .from("companies")
    .select(PUBLIC_COMPANY_SELECT, { count: "exact" });
}

function createAuthenticatedCompaniesQuery(
  client: SupabaseClient<Database>,
) {
  return client.from("companies").select(AUTHENTICATED_COMPANY_SELECT);
}

function createCompanyJobCountQuery(client: SupabaseClient<Database>) {
  return client.from("jobs").select(COMPANY_JOB_COUNT_SELECT);
}

export type PublicCompany =
  QueryData<ReturnType<typeof createPublicCompaniesQuery>>[number];
type AuthenticatedCompany =
  QueryData<ReturnType<typeof createAuthenticatedCompaniesQuery>>[number];
type CompanyJobCountRow =
  QueryData<ReturnType<typeof createCompanyJobCountQuery>>[number];

export type CompanyDirectoryRow = PublicCompany & {
  readonly jobCount: number;
};

export type UseCompaniesDirectoryParams = CompanyDirectoryFilters & {
  readonly siteId: number | null;
};

export type CompaniesDirectoryResult = {
  readonly rows: CompanyDirectoryRow[];
  readonly total: number;
  readonly hasMore: boolean;
};

function toPublicCompany(company: AuthenticatedCompany): PublicCompany {
  return {
    created_at: company.created_at,
    description: company.description,
    id: company.id,
    logo_path: company.logo_path,
    name: company.name,
    website: company.website,
  };
}

function isPublicCompany(company: AuthenticatedCompany): boolean {
  return (
    company.verification_status === "verified" &&
    company.status === "active" &&
    company.deleted_at === null
  );
}

async function fetchAnonymousCompanies(
  client: SupabaseClient<Database>,
  filters: CompanyDirectoryFilters,
): Promise<{ readonly rows: PublicCompany[]; readonly total: number }> {
  const page = Math.max(1, Math.trunc(filters.page));
  const pageSize = Math.max(1, Math.trunc(filters.pageSize));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = createPublicCompaniesQuery(client);
  const search = filters.search?.trim();

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { count, data, error } = await query
    .order("name", { ascending: true })
    .range(from, to);

  if (error) {
    throw error;
  }

  return {
    rows: data ?? [],
    total: count ?? 0,
  };
}

async function fetchAuthenticatedCompanies(
  client: SupabaseClient<Database>,
  filters: CompanyDirectoryFilters,
): Promise<{ readonly rows: PublicCompany[]; readonly total: number }> {
  const search = filters.search?.trim();
  const visibleCompanies: PublicCompany[] = [];
  let from = 0;

  while (true) {
    let query = createAuthenticatedCompaniesQuery(client);

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query
      .order("name", { ascending: true })
      .range(from, from + READ_BATCH_SIZE - 1);

    if (error) {
      throw error;
    }

    const batch = data ?? [];

    for (const company of batch) {
      if (isPublicCompany(company)) {
        visibleCompanies.push(toPublicCompany(company));
      }
    }

    if (batch.length < READ_BATCH_SIZE) {
      break;
    }

    from += READ_BATCH_SIZE;
  }

  const page = Math.max(1, Math.trunc(filters.page));
  const pageSize = Math.max(1, Math.trunc(filters.pageSize));
  const pageStart = (page - 1) * pageSize;

  return {
    rows: visibleCompanies.slice(pageStart, pageStart + pageSize),
    total: visibleCompanies.length,
  };
}

async function fetchCompanyJobCounts(
  client: SupabaseClient<Database>,
  companyIds: readonly string[],
  siteId: number | null,
): Promise<ReadonlyMap<string, number>> {
  const jobCounts = new Map<string, number>();
  let from = 0;

  if (companyIds.length === 0) {
    return jobCounts;
  }

  while (true) {
    let query = createCompanyJobCountQuery(client)
      .in("company_id", [...companyIds])
      .eq("status", "active")
      .is("deleted_at", null);

    if (siteId !== null) {
      query = query.eq("job_sites.site_id", siteId);
    }

    const { data, error } = await query
      .order("id", { ascending: true })
      .range(from, from + READ_BATCH_SIZE - 1);

    if (error) {
      throw error;
    }

    const batch: CompanyJobCountRow[] = data ?? [];

    for (const job of batch) {
      jobCounts.set(job.company_id, (jobCounts.get(job.company_id) ?? 0) + 1);
    }

    if (batch.length < READ_BATCH_SIZE) {
      break;
    }

    from += READ_BATCH_SIZE;
  }

  return jobCounts;
}

export async function fetchCompaniesDirectory(
  client: SupabaseClient<Database>,
  params: UseCompaniesDirectoryParams,
): Promise<CompaniesDirectoryResult> {
  const { data: sessionData, error: sessionError } =
    await client.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const companyPage = sessionData.session
    ? await fetchAuthenticatedCompanies(client, params)
    : await fetchAnonymousCompanies(client, params);
  const companyIds = companyPage.rows.map((company) => company.id);
  const jobCounts = await fetchCompanyJobCounts(
    client,
    companyIds,
    params.siteId,
  );
  const rows = companyPage.rows.map((company) => ({
    ...company,
    jobCount: jobCounts.get(company.id) ?? 0,
  }));
  const page = Math.max(1, Math.trunc(params.page));
  const pageSize = Math.max(1, Math.trunc(params.pageSize));
  const from = (page - 1) * pageSize;

  return {
    rows,
    total: companyPage.total,
    hasMore: from + rows.length < companyPage.total,
  };
}

export function useCompaniesDirectory(params: UseCompaniesDirectoryParams) {
  const client = getSupabaseClient();
  const { siteId, ...filters } = params;

  return useQuery({
    queryKey: queryKeys.companies.directory(siteId, filters),
    queryFn: () => fetchCompaniesDirectory(client, params),
  });
}
