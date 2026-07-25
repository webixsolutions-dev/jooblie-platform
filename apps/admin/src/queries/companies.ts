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

export const VERIFICATION_DOCUMENTS_BUCKET = "verification-docs";
export const VERIFICATION_DOCUMENT_URL_TTL_SECONDS = 60;

type CompanyRow = Tables<"companies">;
type CompanyVerification = Enums<"company_verification">;

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

export function usePendingCompanies() {
  return useQuery({
    queryKey: PENDING_COMPANIES_QUERY_KEY,
    queryFn: fetchPendingCompanies,
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
