import { useState, type FormEvent } from "react";
import {
  useCreateCompany,
  useMyCompany,
} from "@jooblie/core";
import { Link, Navigate, useNavigate } from "react-router-dom";

import {
  inputClassName,
  primaryButtonClassName,
} from "../components/AuthCard";
import { Container } from "../components/Container";
import { LoadingPage } from "../components/LoadingPage";

type ErrorWithCause = Error & {
  readonly cause?: {
    readonly code?: unknown;
  };
};

function isDuplicateCompanyError(error: Error): boolean {
  return (error as ErrorWithCause).cause?.code === "23505";
}

export function CompanyCreationPage() {
  const navigate = useNavigate();
  const companyQuery = useMyCompany();
  const createCompanyMutation = useCreateCompany();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (companyQuery.isLoading) {
    return <LoadingPage />;
  }

  if (companyQuery.data) {
    return <Navigate replace to="/recruiter" />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      await createCompanyMutation.mutateAsync({
        name: name.trim(),
        website: website.trim(),
        registrationNumber: registrationNumber.trim(),
        description: description.trim() || undefined,
      });
      navigate("/recruiter", { replace: true });
    } catch (error) {
      if (error instanceof Error && isDuplicateCompanyError(error)) {
        setFormError("A company with this name already exists.");
        return;
      }

      setFormError(
        error instanceof Error
          ? error.message
          : "We could not create your company. Please try again.",
      );
    }
  };

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Link
          className="text-sm font-semibold text-primary hover:underline"
          to="/recruiter"
        >
          ← Recruiter dashboard
        </Link>
        <p className="mt-6 text-sm font-bold uppercase tracking-wider text-primary">
          Company profile
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Tell us about your company
        </h1>
        <p className="mt-3 max-w-xl leading-7 text-muted">
          A company profile is required before you can post jobs. New
          companies are reviewed by Jooblie after creation.
        </p>

        {companyQuery.isError ? (
          <div
            className="mt-7 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            {companyQuery.error.message}
          </div>
        ) : null}

        <form
          className="mt-8 space-y-5 rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8"
          onSubmit={handleSubmit}
        >
          <label className="block text-sm font-semibold">
            Company name
            <input
              autoComplete="organization"
              className={inputClassName}
              maxLength={160}
              name="name"
              onChange={(event) => setName(event.target.value)}
              required
              type="text"
              value={name}
            />
          </label>

          <label className="block text-sm font-semibold">
            Website
            <input
              autoComplete="url"
              className={inputClassName}
              name="website"
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://example.ca"
              required
              type="url"
              value={website}
            />
          </label>

          <label className="block text-sm font-semibold">
            Registration number
            <input
              className={inputClassName}
              maxLength={100}
              name="registrationNumber"
              onChange={(event) => setRegistrationNumber(event.target.value)}
              required
              type="text"
              value={registrationNumber}
            />
          </label>

          <label className="block text-sm font-semibold">
            Description{" "}
            <span className="font-normal text-muted">(optional)</span>
            <textarea
              className={`${inputClassName} min-h-32 resize-y`}
              maxLength={3000}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              value={description}
            />
          </label>

          {formError ? (
            <p
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          <button
            className={primaryButtonClassName}
            disabled={
              createCompanyMutation.isPending || companyQuery.isError
            }
            type="submit"
          >
            {createCompanyMutation.isPending
              ? "Creating company…"
              : "Create company profile"}
          </button>
        </form>
      </div>
    </Container>
  );
}
