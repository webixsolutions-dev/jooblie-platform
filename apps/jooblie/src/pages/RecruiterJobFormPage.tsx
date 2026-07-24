import {
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  env,
  resolveSite,
  useCategories,
  useCreateJob,
  useMyCompany,
  useSectors,
  type CreateJobInput,
  type JobStatus,
} from "@jooblie/core";
import { Link, Navigate } from "react-router-dom";

import {
  inputClassName,
  primaryButtonClassName,
} from "../components/AuthCard";
import { Container } from "../components/Container";
import { LoadingPage } from "../components/LoadingPage";

type CreatedJob = {
  readonly id: string;
  readonly status: JobStatus;
};

const employmentTypes: ReadonlyArray<{
  readonly label: string;
  readonly value: CreateJobInput["employmentType"];
}> = [
  { label: "Full-time", value: "full_time" },
  { label: "Part-time", value: "part_time" },
  { label: "Contract", value: "contract" },
  { label: "Temporary", value: "temporary" },
  { label: "Internship", value: "internship" },
  { label: "Seasonal", value: "seasonal" },
];

const salaryPeriods: ReadonlyArray<{
  readonly label: string;
  readonly value: NonNullable<CreateJobInput["salaryPeriod"]>;
}> = [
  { label: "Hourly", value: "hourly" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

function parseOptionalNumber(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

export function RecruiterJobFormPage() {
  const companyQuery = useMyCompany();
  const sectorsQuery = useSectors();
  const categoriesQuery = useCategories();
  const createJobMutation = useCreateJob();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [employmentType, setEmploymentType] =
    useState<CreateJobInput["employmentType"]>("full_time");
  const [isRemote, setIsRemote] = useState(false);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("CAD");
  const [salaryPeriod, setSalaryPeriod] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdJob, setCreatedJob] = useState<CreatedJob | null>(null);
  const company = companyQuery.data?.companies ?? null;

  if (
    companyQuery.isLoading ||
    sectorsQuery.isLoading ||
    categoriesQuery.isLoading
  ) {
    return <LoadingPage />;
  }

  if (!company && !companyQuery.isError) {
    return <Navigate replace to="/recruiter/company/new" />;
  }

  if (
    company &&
    (company.verification_status === "rejected" ||
      company.status === "suspended")
  ) {
    return (
      <Container className="py-14">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 p-7 text-red-800">
          <h1 className="text-2xl font-bold">Job posting is unavailable</h1>
          <p className="mt-3 leading-7">
            Contact Jooblie support about your company status before posting
            another job.
          </p>
          <Link
            className="mt-5 inline-block font-bold underline underline-offset-4"
            to="/recruiter"
          >
            Return to recruiter dashboard
          </Link>
        </div>
      </Container>
    );
  }

  const addSkill = (rawSkill: string) => {
    const nextSkills = rawSkill
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    if (nextSkills.length === 0) {
      return;
    }

    setSkills((current) =>
      Array.from(new Set([...current, ...nextSkills])).slice(0, 20),
    );
    setSkillInput("");
  };

  const handleSkillKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" && event.key !== ",") {
      return;
    }

    event.preventDefault();
    addSkill(skillInput);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!company) {
      setFormError("Create your company profile before posting a job.");
      return;
    }

    const minimum = parseOptionalNumber(salaryMin);
    const maximum = parseOptionalNumber(salaryMax);

    if (
      (minimum !== undefined && !Number.isFinite(minimum)) ||
      (maximum !== undefined && !Number.isFinite(maximum))
    ) {
      setFormError("Salary values must be valid numbers.");
      return;
    }

    if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
      setFormError("Minimum salary cannot be greater than maximum salary.");
      return;
    }

    if (!title.trim() || !description.trim() || !categoryId) {
      setFormError("Complete the title, description, and category fields.");
      return;
    }

    const pendingSkill = skillInput.trim();
    const submittedSkills = Array.from(
      new Set([...skills, ...(pendingSkill ? [pendingSkill] : [])]),
    );

    try {
      const job = await createJobMutation.mutateAsync({
        companyId: company.id,
        originSiteId: resolveSite(env.appSlug)!.id,
        title: title.trim(),
        description: description.trim(),
        categoryId: Number(categoryId),
        employmentType,
        isRemote,
        province: province.trim() || undefined,
        city: city.trim() || undefined,
        salaryMin: minimum,
        salaryMax: maximum,
        salaryCurrency: salaryCurrency.trim().toUpperCase() || "CAD",
        salaryPeriod:
          (salaryPeriod ||
            undefined) as CreateJobInput["salaryPeriod"],
        skills: submittedSkills,
      });
      setCreatedJob({ id: job.id, status: job.status });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "We could not create this job. Please try again.",
      );
    }
  };

  if (createdJob) {
    const isLive = createdJob.status === "active";

    return (
      <Container className="py-14">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-white p-7 text-center shadow-sm sm:p-10">
          <p className="text-sm font-bold uppercase tracking-wider text-primary">
            Job created
          </p>
          <h1 className="mt-3 text-3xl font-bold">
            {isLive
              ? "Your job is live."
              : "Your job will go live once your company is verified."}
          </h1>
          <p className="mt-3 leading-7 text-muted">
            {isLive
              ? "Job seekers can now find and apply to this role."
              : "You can review the pending job from your recruiter workspace."}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {isLive ? (
              <Link
                className="rounded-md bg-primary px-5 py-3 font-bold text-white hover:bg-blue-700"
                to={`/jobs/${createdJob.id}`}
              >
                View public job
              </Link>
            ) : null}
            <Link
              className="rounded-md border border-border bg-white px-5 py-3 font-bold hover:border-primary"
              to="/recruiter/jobs"
            >
              View my jobs
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  const hasQueryError =
    companyQuery.isError || sectorsQuery.isError || categoriesQuery.isError;

  return (
    <Container className="py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          className="text-sm font-semibold text-primary hover:underline"
          to="/recruiter/jobs"
        >
          ← My jobs
        </Link>
        <p className="mt-6 text-sm font-bold uppercase tracking-wider text-primary">
          Recruiter workspace
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Post a job
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Add the role details job seekers need to decide whether to apply.
        </p>

        {hasQueryError ? (
          <div
            className="mt-7 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
            role="alert"
          >
            {companyQuery.error?.message ??
              sectorsQuery.error?.message ??
              categoriesQuery.error?.message}
          </div>
        ) : null}

        <form
          className="mt-8 space-y-6 rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8"
          onSubmit={handleSubmit}
        >
          <label className="block text-sm font-semibold">
            Job title
            <input
              className={inputClassName}
              maxLength={180}
              name="title"
              onChange={(event) => setTitle(event.target.value)}
              required
              type="text"
              value={title}
            />
          </label>

          <label className="block text-sm font-semibold">
            Description
            <textarea
              className={`${inputClassName} min-h-56 resize-y leading-7`}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              required
              value={description}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Category
              <select
                className={inputClassName}
                name="categoryId"
                onChange={(event) => setCategoryId(event.target.value)}
                required
                value={categoryId}
              >
                <option value="">Select a category</option>
                {sectorsQuery.data?.map((sector) => (
                  <optgroup key={sector.id} label={sector.name}>
                    {categoriesQuery.data
                      ?.filter((category) => category.sector_id === sector.id)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold">
              Employment type
              <select
                className={inputClassName}
                name="employmentType"
                onChange={(event) =>
                  setEmploymentType(
                    event.target.value as CreateJobInput["employmentType"],
                  )
                }
                value={employmentType}
              >
                {employmentTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 text-sm font-semibold">
            <input
              checked={isRemote}
              className="mt-0.5 size-4 accent-primary"
              name="isRemote"
              onChange={(event) => setIsRemote(event.target.checked)}
              type="checkbox"
            />
            <span>
              This role can be performed remotely
              <span className="mt-1 block font-normal text-muted">
                You can still add a province or city for location context.
              </span>
            </span>
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Province
              <input
                className={inputClassName}
                name="province"
                onChange={(event) => setProvince(event.target.value)}
                type="text"
                value={province}
              />
            </label>
            <label className="block text-sm font-semibold">
              City
              <input
                className={inputClassName}
                name="city"
                onChange={(event) => setCity(event.target.value)}
                type="text"
                value={city}
              />
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold">Salary</legend>
            <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-sm">
                Minimum
                <input
                  className={inputClassName}
                  min="0"
                  name="salaryMin"
                  onChange={(event) => setSalaryMin(event.target.value)}
                  step="any"
                  type="number"
                  value={salaryMin}
                />
              </label>
              <label className="text-sm">
                Maximum
                <input
                  className={inputClassName}
                  min="0"
                  name="salaryMax"
                  onChange={(event) => setSalaryMax(event.target.value)}
                  step="any"
                  type="number"
                  value={salaryMax}
                />
              </label>
              <label className="text-sm">
                Currency
                <input
                  className={inputClassName}
                  maxLength={3}
                  name="salaryCurrency"
                  onChange={(event) => setSalaryCurrency(event.target.value)}
                  type="text"
                  value={salaryCurrency}
                />
              </label>
              <label className="text-sm">
                Period
                <select
                  className={inputClassName}
                  name="salaryPeriod"
                  onChange={(event) => setSalaryPeriod(event.target.value)}
                  value={salaryPeriod}
                >
                  <option value="">Select</option>
                  {salaryPeriods.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          <div>
            <label className="block text-sm font-semibold" htmlFor="skills">
              Skills
            </label>
            <input
              className={inputClassName}
              id="skills"
              name="skills"
              onChange={(event) => setSkillInput(event.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder="Type a skill and press Enter"
              type="text"
              value={skillInput}
            />
            <p className="mt-1.5 text-xs text-muted">
              Add up to 20 skills. Commas also create tags.
            </p>
            {skills.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <button
                    aria-label={`Remove ${skill}`}
                    className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-800"
                    key={skill}
                    onClick={() =>
                      setSkills((current) =>
                        current.filter((item) => item !== skill),
                      )
                    }
                    type="button"
                  >
                    {skill} ×
                  </button>
                ))}
              </div>
            ) : null}
          </div>

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
            disabled={createJobMutation.isPending || hasQueryError}
            type="submit"
          >
            {createJobMutation.isPending ? "Posting job…" : "Post job"}
          </button>
        </form>
      </div>
    </Container>
  );
}
