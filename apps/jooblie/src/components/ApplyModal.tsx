import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  env,
  getSupabaseClient,
  resolveSite,
  useApply,
  type JobDetailRow,
} from "@jooblie/core";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";
const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type ApplyModalProps = {
  readonly job: JobDetailRow;
  readonly onApplied: (message?: string) => void;
  readonly onClose: () => void;
  readonly userId: string;
};

function sanitizeFilename(filename: string): string {
  const sanitized = filename
    .replace(/[\\/"'\s]+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-");

  return sanitized || "resume";
}

function validateResume(file: File | null): string | null {
  if (!file) {
    return "Choose a PDF or DOCX résumé to continue.";
  }

  const extension = file.name.toLowerCase().split(".").pop();
  const allowedExtension = extension === "pdf" || extension === "docx";
  const allowedType =
    file.type === PDF_MIME_TYPE ||
    file.type === DOCX_MIME_TYPE ||
    file.type === "";

  if (!allowedExtension || !allowedType) {
    return "Your résumé must be a PDF or DOCX file.";
  }

  if (file.size > MAX_RESUME_BYTES) {
    return "Your résumé must be 5 MB or smaller.";
  }

  return null;
}

export function ApplyModal({
  job,
  onApplied,
  onClose,
  userId,
}: ApplyModalProps) {
  const applyMutation = useApply();
  const [file, setFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedResumePath, setUploadedResumePath] = useState<string | null>(
    null,
  );
  const submitting = uploading || applyMutation.isPending;
  const currentSiteId = resolveSite(env.appSlug)?.id ?? 1;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setUploadedResumePath(null);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validateResume(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    let resumePath = uploadedResumePath;

    if (!resumePath && file) {
      setUploading(true);
      resumePath = `${userId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;

      const { error: uploadError } = await getSupabaseClient().storage
        .from("resumes")
        .upload(resumePath, file, {
          contentType: file.type || undefined,
          upsert: false,
        });

      setUploading(false);

      if (uploadError) {
        setError(
          `Résumé upload failed. Check that the file is a PDF or DOCX under 5 MB, then try again. (${uploadError.message})`,
        );
        return;
      }

      setUploadedResumePath(resumePath);
    }

    if (!resumePath) {
      setError("Choose a résumé to continue.");
      return;
    }

    try {
      await applyMutation.mutateAsync({
        appliedViaSiteId: currentSiteId,
        coverLetter: coverLetter.trim() || null,
        jobId: job.id,
        resumePath,
      });
      onApplied();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong. Please try again.";

      if (message.toLowerCase().includes("already applied")) {
        onApplied("You've already applied to this job.");
        return;
      }

      const permissionHint = message.toLowerCase().includes("permission")
        ? " Your account may be suspended, or this job may no longer be accepting applications."
        : "";

      setError(
        `Your résumé uploaded successfully, but the application could not be submitted.${permissionHint} ${message}`.trim(),
      );
    }
  };

  return (
    <div
      aria-labelledby="apply-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4"
      role="dialog"
    >
      <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-xl sm:rounded-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">
              {job.companies.name}
            </p>
            <h2
              className="mt-1 text-2xl font-bold tracking-tight"
              id="apply-dialog-title"
            >
              Apply for {job.title}
            </h2>
          </div>
          <button
            aria-label="Close application form"
            className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold hover:bg-background disabled:opacity-60"
            disabled={submitting}
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold">
            Résumé
            <input
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mt-2 block w-full rounded-md border border-border bg-background px-3 py-3 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-2 file:font-semibold file:text-white"
              disabled={submitting}
              onChange={handleFileChange}
              required
              type="file"
            />
            <span className="mt-2 block text-xs font-normal text-muted">
              PDF or DOCX, up to 5 MB. A fresh upload is required.
            </span>
          </label>

          <label className="block text-sm font-semibold">
            Cover letter <span className="font-normal text-muted">(optional)</span>
            <textarea
              className="mt-2 min-h-36 w-full rounded-md border border-border px-3 py-2.5 leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-blue-100"
              disabled={submitting}
              maxLength={5000}
              onChange={(event) => setCoverLetter(event.target.value)}
              placeholder="Tell the employer why you're a good fit."
              value={coverLetter}
            />
          </label>

          {error ? (
            <p
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            className="w-full rounded-md bg-primary px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {uploading
              ? "Uploading résumé…"
              : applyMutation.isPending
                ? "Submitting application…"
                : "Submit application"}
          </button>
        </form>
      </div>
    </div>
  );
}
