import { useState } from "react";

import { getAdminErrorMessage } from "../admin-errors";
import {
  createVerificationDocumentSignedUrl,
  usePendingCompanies,
  useSetCompanyVerification,
  type CompanyVerificationResult,
  type PendingCompany,
} from "../queries/companies";

const submittedDateFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
});

type ActionFeedback =
  | {
      readonly kind: "success";
      readonly message: string;
      readonly storedReason?: string | null;
    }
  | {
      readonly kind: "error";
      readonly message: string;
    };

function formatSubmittedDate(createdAt: string): string {
  return submittedDateFormatter.format(new Date(createdAt));
}

function getWebsiteHref(website: string): string | null {
  const candidate = website.match(/^https?:\/\//i)
    ? website
    : `https://${website}`;

  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function getVerificationSuccess(
  result: CompanyVerificationResult,
): ActionFeedback {
  if (result.status === "rejected") {
    return {
      kind: "success",
      message: "Company rejected.",
      storedReason: result.rejectionReason,
    };
  }

  const { pendingJobCount } = result;
  return {
    kind: "success",
    message: `Company verified — ${pendingJobCount} pending ${
      pendingJobCount === 1 ? "job is" : "jobs are"
    } now live.`,
  };
}

export function VerificationPage() {
  const companiesQuery = usePendingCompanies();
  const verificationMutation = useSetCompanyVerification();
  const [selectedCompanyId, setSelectedCompanyId] = useState<
    string | null
  >(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionReasonError, setRejectionReasonError] = useState<
    string | null
  >(null);
  const [actionFeedback, setActionFeedback] =
    useState<ActionFeedback | null>(null);
  const [isOpeningDocument, setIsOpeningDocument] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(
    null,
  );
  const selectedCompany =
    companiesQuery.data?.find(
      (company) => company.id === selectedCompanyId,
    ) ?? null;
  const selectedWebsiteHref = selectedCompany
    ? getWebsiteHref(selectedCompany.website)
    : null;

  const selectCompany = (company: PendingCompany) => {
    setSelectedCompanyId(company.id);
    setRejectionReason("");
    setRejectionReasonError(null);
    setActionFeedback(null);
    setDocumentError(null);
  };

  const openVerificationDocument = async () => {
    if (!selectedCompany?.verification_document_path) {
      return;
    }

    setDocumentError(null);
    setIsOpeningDocument(true);
    const documentWindow = window.open("about:blank", "_blank");

    if (!documentWindow) {
      setDocumentError(
        "Your browser blocked the document window. Allow pop-ups and try again.",
      );
      setIsOpeningDocument(false);
      return;
    }

    documentWindow.opener = null;

    try {
      const signedUrl = await createVerificationDocumentSignedUrl(
        selectedCompany.verification_document_path,
      );
      documentWindow.location.replace(signedUrl);
    } catch (error) {
      documentWindow.close();
      setDocumentError(
        getAdminErrorMessage(
          error,
          "We could not open this verification document. Please try again.",
        ),
      );
    } finally {
      setIsOpeningDocument(false);
    }
  };

  const submitVerification = async (
    status: "verified" | "rejected",
  ) => {
    const company = selectedCompany;

    if (!company) {
      return;
    }

    const reason = rejectionReason.trim();

    if (status === "rejected" && reason === "") {
      setRejectionReasonError(
        "Enter a rejection reason before rejecting this company.",
      );
      return;
    }

    setActionFeedback(null);
    setRejectionReasonError(null);
    setDocumentError(null);

    try {
      const result = await verificationMutation.mutateAsync({
        companyId: company.id,
        status,
        reason: status === "rejected" ? reason : undefined,
      });
      setActionFeedback(getVerificationSuccess(result));
      setSelectedCompanyId(null);
      setRejectionReason("");
      setRejectionReasonError(null);
    } catch (error) {
      setActionFeedback({
        kind: "error",
        message: getAdminErrorMessage(
          error,
          "We could not update this company. Please try again.",
        ),
      });
    }
  };

  if (companiesQuery.isLoading) {
    return (
      <section aria-live="polite">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Verification
        </h1>
        <div
          className="mt-8 grid min-h-72 place-items-center rounded-xl border border-border bg-white shadow-sm"
          role="status"
        >
          <div className="text-center">
            <span
              aria-hidden="true"
              className="mx-auto block size-8 animate-spin rounded-full border-2 border-primary border-r-transparent"
            />
            <p className="mt-3 text-sm text-muted">
              Loading verification queue…
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (companiesQuery.isError && !companiesQuery.data) {
    return (
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Verification
        </h1>
        <div
          className="mt-8 rounded-xl border border-red-200 bg-red-50 p-8 text-red-800"
          role="alert"
        >
          <h2 className="text-lg font-semibold">
            We couldn&apos;t load the verification queue
          </h2>
          <p className="mt-2 text-sm">
            {getAdminErrorMessage(
              companiesQuery.error,
              "Please try loading the queue again.",
            )}
          </p>
          <button
            className="mt-5 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={() => void companiesQuery.refetch()}
            type="button"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  const companies = companiesQuery.data ?? [];

  return (
    <section>
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
        Admin
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Verification
          </h1>
          <p className="mt-2 text-sm text-muted">
            Review pending companies in submission order.
          </p>
        </div>
        <p className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
          {companies.length} pending
        </p>
      </div>

      {actionFeedback ? (
        <div
          className={`mt-6 rounded-lg border px-4 py-3 text-sm ${
            actionFeedback.kind === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role={actionFeedback.kind === "error" ? "alert" : "status"}
        >
          <p className="font-semibold">{actionFeedback.message}</p>
          {actionFeedback.kind === "success" &&
          actionFeedback.storedReason !== undefined ? (
            <p className="mt-1">
              Stored reason:{" "}
              {actionFeedback.storedReason ??
                "The stored reason could not be loaded."}
            </p>
          ) : null}
        </div>
      ) : null}

      {companies.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-white p-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold">
            No companies awaiting verification
          </h2>
          <p className="mt-2 text-sm text-muted">
            New company submissions will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]">
          <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold">Pending companies</h2>
              <p className="mt-1 text-xs text-muted">
                Oldest submissions appear first.
              </p>
            </div>
            <ul className="divide-y divide-border">
              {companies.map((company) => (
                <li key={company.id}>
                  <button
                    aria-pressed={selectedCompanyId === company.id}
                    className={`w-full px-5 py-4 text-left transition-colors ${
                      selectedCompanyId === company.id
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                    onClick={() => selectCompany(company)}
                    type="button"
                  >
                    <span className="block font-semibold">
                      {company.name}
                    </span>
                    <span className="mt-1 block truncate text-sm text-muted">
                      {company.website}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      Registration {company.registration_number}
                    </span>
                    <span className="mt-2 block text-xs text-muted">
                      Submitted {formatSubmittedDate(company.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {selectedCompany ? (
            <article className="rounded-xl border border-border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Pending review
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    {selectedCompany.name}
                  </h2>
                </div>
                <p className="text-sm text-muted">
                  Submitted{" "}
                  {formatSubmittedDate(selectedCompany.created_at)}
                </p>
              </div>

              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                    Website
                  </dt>
                  <dd className="mt-1 break-words text-sm">
                    {selectedWebsiteHref ? (
                      <a
                        className="font-semibold text-primary hover:underline"
                        href={selectedWebsiteHref}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {selectedCompany.website}
                      </a>
                    ) : (
                      selectedCompany.website
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                    Registration number
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {selectedCompany.registration_number}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                    Description
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {selectedCompany.description ||
                      "No description provided."}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                    Verification document
                  </dt>
                  <dd className="mt-2">
                    {selectedCompany.verification_document_path ? (
                      <button
                        className="rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isOpeningDocument}
                        onClick={() =>
                          void openVerificationDocument()
                        }
                        type="button"
                      >
                        {isOpeningDocument
                          ? "Opening document…"
                          : "View verification document"}
                      </button>
                    ) : (
                      <p className="text-sm text-muted">
                        No document provided
                      </p>
                    )}
                    {documentError ? (
                      <p
                        className="mt-2 text-sm text-red-700"
                        role="alert"
                      >
                        {documentError}
                      </p>
                    ) : null}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 border-t border-border pt-6">
                <label
                  className="block text-sm font-semibold"
                  htmlFor="rejection-reason"
                >
                  Rejection reason
                </label>
                <textarea
                  aria-describedby={
                    rejectionReasonError
                      ? "rejection-reason-error"
                      : undefined
                  }
                  aria-invalid={Boolean(rejectionReasonError)}
                  className="mt-2 min-h-28 w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
                  disabled={verificationMutation.isPending}
                  id="rejection-reason"
                  onChange={(event) => {
                    setRejectionReason(event.target.value);
                    if (event.target.value.trim()) {
                      setRejectionReasonError(null);
                    }
                  }}
                  placeholder="Required when rejecting a company"
                  value={rejectionReason}
                />
                {rejectionReasonError ? (
                  <p
                    className="mt-2 text-sm text-red-700"
                    id="rejection-reason-error"
                    role="alert"
                  >
                    {rejectionReasonError}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={verificationMutation.isPending}
                    onClick={() => void submitVerification("verified")}
                    type="button"
                  >
                    {verificationMutation.isPending
                      ? "Saving…"
                      : "Approve company"}
                  </button>
                  <button
                    className="rounded-md border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={verificationMutation.isPending}
                    onClick={() => void submitVerification("rejected")}
                    type="button"
                  >
                    {verificationMutation.isPending
                      ? "Saving…"
                      : "Reject company"}
                  </button>
                </div>
              </div>
            </article>
          ) : (
            <div className="grid min-h-80 place-items-center rounded-xl border border-dashed border-border bg-white p-8 text-center">
              <div>
                <h2 className="text-lg font-semibold">
                  Select a company to review
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Company details and verification actions appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
