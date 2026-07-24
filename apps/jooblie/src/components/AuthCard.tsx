import type { ReactNode } from "react";

type AuthCardProps = {
  readonly children: ReactNode;
  readonly title: string;
  readonly description: string;
};

export const inputClassName =
  "mt-2 w-full rounded-md border border-border bg-white px-3 py-2.5 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-blue-100";

export const primaryButtonClassName =
  "w-full rounded-md bg-primary px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

export function AuthCard({
  children,
  title,
  description,
}: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-14 sm:py-20">
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
