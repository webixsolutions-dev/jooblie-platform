import { useEffect, useState, type FormEvent } from "react";
import {
  useAuth,
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

type CompanyDraft = {
  readonly name: string;
  readonly website: string;
  readonly registrationNumber: string;
  readonly description: string;
};

type CompanyField = "name" | "website" | "registrationNumber";

type CompanyFieldErrors = Partial<Record<CompanyField, string>>;

const companyDraftsByUser = new Map<string, CompanyDraft>();

function isDuplicateCompanyError(error: Error): boolean {
  return (error as ErrorWithCause).cause?.code === "23505";
}

function isValidWebsite(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) {
    return false;
  }

  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

function validateCompanyFields(
  name: string,
  website: string,
  registrationNumber: string,
): CompanyFieldErrors {
  const errors: CompanyFieldErrors = {};

  if (!name.trim()) {
    errors.name = "Company name is required.";
  }

  if (!website.trim()) {
    errors.website = "Website is required.";
  } else if (!isValidWebsite(website.trim())) {
    errors.website = "Enter a valid http or https URL.";
  }

  if (!registrationNumber.trim()) {
    errors.registrationNumber = "Registration number is required.";
  }

  return errors;
}

export function CompanyCreationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const companyQuery = useMyCompany();
  const createCompanyMutation = useCreateCompany();
  const savedDraft = userId ? companyDraftsByUser.get(userId) : undefined;
  const [name, setName] = useState(() => savedDraft?.name ?? "");
  const [website, setWebsite] = useState(() => savedDraft?.website ?? "");
  const [registrationNumber, setRegistrationNumber] = useState(
    () => savedDraft?.registrationNumber ?? "",
  );
  const [description, setDescription] = useState(
    () => savedDraft?.description ?? "",
  );
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<CompanyField, boolean>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const fieldErrors = validateCompanyFields(
    name,
    website,
    registrationNumber,
  );
  const isFormValid = Object.keys(fieldErrors).length === 0;

  useEffect(() => {
    if (!userId) {
      return;
    }

    companyDraftsByUser.set(userId, {
      name,
      website,
      registrationNumber,
      description,
    });
  }, [description, name, registrationNumber, userId, website]);

  const markTouched = (field: CompanyField) => {
    setTouchedFields((current) => ({ ...current, [field]: true }));
  };

  if (companyQuery.isLoading) {
    return <LoadingPage />;
  }

  if (companyQuery.data) {
    return <Navigate replace to="/recruiter" />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setTouchedFields({
      name: true,
      website: true,
      registrationNumber: true,
    });

    if (!isFormValid) {
      return;
    }

    try {
      await createCompanyMutation.mutateAsync({
        name: name.trim(),
        website: website.trim(),
        registrationNumber: registrationNumber.trim(),
        description: description.trim() || undefined,
      });
      if (userId) {
        companyDraftsByUser.delete(userId);
      }
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
          noValidate
          onSubmit={handleSubmit}
        >
          <label className="block text-sm font-semibold">
            Company name
            <input
              aria-describedby={
                touchedFields.name && fieldErrors.name
                  ? "company-name-error"
                  : undefined
              }
              aria-invalid={Boolean(
                touchedFields.name && fieldErrors.name,
              )}
              autoComplete="organization"
              className={inputClassName}
              maxLength={160}
              name="name"
              onBlur={() => markTouched("name")}
              onChange={(event) => setName(event.target.value)}
              required
              type="text"
              value={name}
            />
            {touchedFields.name && fieldErrors.name ? (
              <span
                className="mt-1.5 block text-sm font-normal text-red-700"
                id="company-name-error"
              >
                {fieldErrors.name}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-semibold">
            Website
            <input
              aria-describedby={
                touchedFields.website && fieldErrors.website
                  ? "company-website-error"
                  : undefined
              }
              aria-invalid={Boolean(
                touchedFields.website && fieldErrors.website,
              )}
              autoComplete="url"
              className={inputClassName}
              name="website"
              onBlur={() => markTouched("website")}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://example.ca"
              required
              type="url"
              value={website}
            />
            {touchedFields.website && fieldErrors.website ? (
              <span
                className="mt-1.5 block text-sm font-normal text-red-700"
                id="company-website-error"
              >
                {fieldErrors.website}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-semibold">
            Registration number
            <input
              aria-describedby={
                touchedFields.registrationNumber &&
                fieldErrors.registrationNumber
                  ? "company-registration-number-error"
                  : undefined
              }
              aria-invalid={Boolean(
                touchedFields.registrationNumber &&
                  fieldErrors.registrationNumber,
              )}
              className={inputClassName}
              maxLength={100}
              name="registrationNumber"
              onBlur={() => markTouched("registrationNumber")}
              onChange={(event) => setRegistrationNumber(event.target.value)}
              required
              type="text"
              value={registrationNumber}
            />
            {touchedFields.registrationNumber &&
            fieldErrors.registrationNumber ? (
              <span
                className="mt-1.5 block text-sm font-normal text-red-700"
                id="company-registration-number-error"
              >
                {fieldErrors.registrationNumber}
              </span>
            ) : null}
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
              !isFormValid ||
              createCompanyMutation.isPending ||
              companyQuery.isError
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
