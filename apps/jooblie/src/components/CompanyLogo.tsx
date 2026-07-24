import { useState } from "react";
import { getSupabaseClient } from "@jooblie/core";

import { getCompanyInitials } from "../job-format";

type CompanyLogoProps = {
  readonly companyName: string;
  readonly logoPath: string | null;
  readonly size?: "sm" | "md";
};

const sizeClasses = {
  sm: "h-11 w-11 text-sm",
  md: "h-16 w-16 text-lg",
} as const;

export function CompanyLogo({
  companyName,
  logoPath,
  size = "sm",
}: CompanyLogoProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const publicUrl = logoPath
    ? getSupabaseClient().storage.from("company-logos").getPublicUrl(logoPath)
        .data.publicUrl
    : null;
  const className = `${sizeClasses[size]} shrink-0 rounded-lg border border-border bg-blue-50`;

  if (!publicUrl || imageFailed) {
    return (
      <div
        aria-hidden="true"
        className={`${className} flex items-center justify-center font-bold text-primary`}
      >
        {getCompanyInitials(companyName)}
      </div>
    );
  }

  return (
    <img
      alt={`${companyName} logo`}
      className={`${className} object-cover`}
      onError={() => setImageFailed(true)}
      src={publicUrl}
    />
  );
}
