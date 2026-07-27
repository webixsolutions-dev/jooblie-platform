import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getSupabaseClient } from "@jooblie/core";

import type {
  Enums,
  Tables,
} from "../../../../packages/core/src/database.types";
import {
  getExplorerQueryKey,
  getExplorerQueryPrefix,
  getExplorerRange,
  type ExplorerResult,
} from "./explorer";

const PENDING_COMPANIES_QUERY_KEY = [
  "admin",
  "companies",
  "pending",
] as const;
const PENDING_COMPANY_SELECT = `
  id,
  name,
  website,
  registration_number,
  verification_document_path,
  description,
  created_at
` as const;
const COMPANY_EXPLORER_SORT = "created_at-desc";
const COMPANY_EXPLORER_SELECT = `
  id,
  name,
  verification_status,
  status,
  website,
  created_by,
  created_at,
  verified_at,
  registration_number,
  description,
  verified_by,
  rejection_reason,
  updated_at,
  deleted_at,
  logo_path,
  verification_document_path,
  creator:profiles!companies_created_by_fkey(full_name, email),
  verifier:profiles!companies_verified_by_fkey(full_name, email)
` as const;
const ACTIVITY_QUERY_PREFIX = ["admin", "activity"] as const;

export const VERIFICATION_DOCUMENTS_BUCKET = "verification-docs";
export const VERIFICATION_DOCUMENT_URL_TTL_SECONDS = 60;

type CompanyRow = Tables<"companies">;
type CompanyVerification = Enums<"company_verification">;
type CompanyStatus = Enums<"company_status">;
type ProfileRow = Tables<"profiles">;
type ProfileSummary = Pick<ProfileRow, "email" | "full_name">;

export type PendingCompany = Pick<
  CompanyRow,
  | "id"
  | "name"
  | "website"
  | "registration_number"
  | "verification_document_path"
  | "description"
  | "created_at"
>;

export type SetCompanyVerificationInput = {
  readonly companyId: CompanyRow["id"];
  readonly status: Extract<
    CompanyVerification,
    "verified" | "rejected"
  >;
  readonly reason?: string;
};

export type CompanyVerificationResult =
  | {
      readonly status: "verified";
      readonly pendingJobCount: number;
    }
  | {
      readonly status: "rejected";
      readonly rejectionReason: CompanyRow["rejection_reason"];
    };

export type CompanyExplorerFilters = {
  readonly companyId: string;
  readonly createdFrom: string;
  readonly createdTo: string;
  readonly creatorId: string;
  readonly name: string;
  readonly status: "" | CompanyStatus;
  readonly verificationStatus: "" | CompanyVerification;
};

export type CompanyExplorerRow = Pick<
  CompanyRow,
  | "created_at"
  | "created_by"
  | "deleted_at"
  | "description"
  | "id"
  | "logo_path"
  | "name"
  | "registration_number"
  | "rejection_reason"
  | "status"
  | "updated_at"
  | "verification_document_path"
  | "verification_status"
  | "verified_at"
  | "verified_by"
  | "website"
> & {
  readonly creator: ProfileSummary | null;
  readonly verifier: ProfileSummary | null;
};

export type SetCompanyStatusInput = {
  readonly companyId: CompanyRow["id"];
  readonly status: CompanyStatus;
};

export async function fetchPendingCompanies(): Promise<
  PendingCompany[]
> {
  const { data, error } = await getSupabaseClient()
    .from("companies")
    .select(PENDING_COMPANY_SELECT)
    .eq("verification_status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function createVerificationDocumentSignedUrl(
  documentPath: string,
): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .storage.from(VERIFICATION_DOCUMENTS_BUCKET)
    .createSignedUrl(
      documentPath,
      VERIFICATION_DOCUMENT_URL_TTL_SECONDS,
    );

  if (error) {
    throw error;
  }

  return data.signedUrl;
}

function getStartOfDay(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function getEndOfDay(date: string): string {
  return `${date}T23:59:59.999Z`;
}

async function fetchCompaniesExplorer(
  filters: CompanyExplorerFilters,
  page: number,
): Promise<ExplorerResult<CompanyExplorerRow>> {
  const { from, to } = getExplorerRange(page);
  let query = getSupabaseClient()
    .from("companies")
    .select(COMPANY_EXPLORER_SELECT, { count: "exact" });

  if (filters.verificationStatus) {
    query = query.eq(
      "verification_status",
      filters.verificationStatus,
    );
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.createdFrom) {
    query = query.gte("created_at", getStartOfDay(filters.createdFrom));
  }

  if (filters.createdTo) {
    query = query.lte("created_at", getEndOfDay(filters.createdTo));
  }

  if (filters.name) {
    query = query.ilike("name", `%${filters.name}%`);
  }

  if (filters.companyId) {
    query = query.eq("id", filters.companyId);
  }

  if (filters.creatorId) {
    query = query.eq("created_by", filters.creatorId);
  }

  const { count, data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) {
    throw error;
  }

  return {
    rows: data,
    total: count ?? 0,
  };
}

async function countPendingJobs(companyId: string): Promise<number> {
  const { count, error } = await getSupabaseClient()
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "pending_review")
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function setCompanyVerification(
  input: SetCompanyVerificationInput,
): Promise<CompanyVerificationResult> {
  const client = getSupabaseClient();
  const pendingJobCount =
    input.status === "verified"
      ? await countPendingJobs(input.companyId)
      : null;
  const reason =
    input.status === "rejected" ? input.reason?.trim() : undefined;
  const { error } = await client.rpc(
    "admin_set_company_verification",
    {
      _company_id: input.companyId,
      _status: input.status,
      _reason: reason,
    },
  );

  if (error) {
    throw error;
  }

  if (input.status === "verified") {
    return {
      status: "verified",
      pendingJobCount: pendingJobCount ?? 0,
    };
  }

  const { data: company } = await client
    .from("companies")
    .select("rejection_reason")
    .eq("id", input.companyId)
    .maybeSingle();

  return {
    status: "rejected",
    rejectionReason: company?.rejection_reason ?? null,
  };
}

async function setCompanyStatus(
  input: SetCompanyStatusInput,
): Promise<CompanyStatus> {
  const { error } = await getSupabaseClient().rpc(
    "admin_set_company_status",
    {
      _company_id: input.companyId,
      _status: input.status,
    },
  );

  if (error) {
    throw error;
  }

  return input.status;
}

export function usePendingCompanies() {
  return useQuery({
    queryKey: PENDING_COMPANIES_QUERY_KEY,
    queryFn: fetchPendingCompanies,
  });
}

export function useCompaniesExplorer(
  filters: CompanyExplorerFilters,
  page: number,
) {
  return useQuery({
    queryKey: getExplorerQueryKey(
      "companies",
      filters,
      page,
      COMPANY_EXPLORER_SORT,
    ),
    queryFn: () => fetchCompaniesExplorer(filters, page),
  });
}

export function useSetCompanyVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setCompanyVerification,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PENDING_COMPANIES_QUERY_KEY,
      });
    },
  });
}

export function useSetCompanyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setCompanyStatus,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getExplorerQueryPrefix("companies"),
        }),
        queryClient.invalidateQueries({
          queryKey: ACTIVITY_QUERY_PREFIX,
        }),
      ]);
    },
  });
}
