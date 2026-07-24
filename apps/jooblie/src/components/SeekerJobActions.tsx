import { useState } from "react";
import {
  env,
  resolveSite,
  toUserMessage,
  useMyApplications,
  useSavedJobs,
  useToggleSaveJob,
  type JobDetailRow,
} from "@jooblie/core";
import { Link } from "react-router-dom";

import { ApplyModal } from "./ApplyModal";

type SeekerJobActionsProps = {
  readonly job: JobDetailRow;
  readonly userId: string;
};

export function SeekerJobActions({
  job,
  userId,
}: SeekerJobActionsProps) {
  const applicationsQuery = useMyApplications();
  const savedJobsQuery = useSavedJobs();
  const toggleSaveMutation = useToggleSaveJob();
  const [applyOpen, setApplyOpen] = useState(false);
  const [optimisticallyApplied, setOptimisticallyApplied] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const application = applicationsQuery.data?.find(
    (item) => item.job_id === job.id,
  );
  const alreadyApplied = Boolean(application) || optimisticallyApplied;
  const isSaved =
    savedJobsQuery.data?.some((savedJob) => savedJob.job_id === job.id) ?? false;
  const currentSiteId = resolveSite(env.appSlug)?.id ?? 1;

  const handleSave = async () => {
    setActionMessage(null);

    try {
      await toggleSaveMutation.mutateAsync({
        jobId: job.id,
        saved: !isSaved,
        savedViaSiteId: currentSiteId,
      });
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : toUserMessage(error),
      );
    }
  };

  const handleApplied = (message?: string) => {
    setOptimisticallyApplied(true);
    setApplyOpen(false);
    setActionMessage(message ?? "Application submitted successfully.");
  };

  return (
    <div className="space-y-3">
      {job.status !== "active" ? (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          This job is no longer accepting applications.
        </p>
      ) : alreadyApplied ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
          <p className="font-bold text-green-800">Applied</p>
          <Link
            className="mt-1 inline-block text-sm font-semibold text-green-800 underline"
            to="/dashboard"
          >
            View your applications
          </Link>
        </div>
      ) : (
        <button
          className="w-full rounded-md bg-primary px-5 py-3 font-bold text-white hover:bg-blue-700"
          onClick={() => setApplyOpen(true)}
          type="button"
        >
          Apply now
        </button>
      )}

      <button
        className="w-full rounded-md border border-border bg-white px-5 py-3 font-semibold hover:bg-background disabled:opacity-60"
        disabled={toggleSaveMutation.isPending || savedJobsQuery.isLoading}
        onClick={() => void handleSave()}
        type="button"
      >
        {isSaved ? "Unsave job" : "Save job"}
      </button>

      {actionMessage ? (
        <p className="text-sm leading-6 text-muted" role="status">
          {actionMessage}
        </p>
      ) : null}

      {applyOpen ? (
        <ApplyModal
          job={job}
          onApplied={handleApplied}
          onClose={() => setApplyOpen(false)}
          userId={userId}
        />
      ) : null}
    </div>
  );
}
