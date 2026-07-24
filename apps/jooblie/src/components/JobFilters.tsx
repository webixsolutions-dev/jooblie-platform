import type { FormEvent } from "react";
import type { JobListRow } from "@jooblie/core";

type EmploymentType = JobListRow["employment_type"];

type Sector = {
  readonly id: number;
  readonly name: string;
};

type Category = {
  readonly id: number;
  readonly name: string;
  readonly sector_id: number;
};

type JobFiltersProps = {
  readonly categories: readonly Category[];
  readonly currentParams: URLSearchParams;
  readonly onApply: (params: URLSearchParams) => void;
  readonly sectors: readonly Sector[];
};

const employmentTypes: ReadonlyArray<{
  readonly label: string;
  readonly value: EmploymentType;
}> = [
  { label: "Full-time", value: "full_time" },
  { label: "Part-time", value: "part_time" },
  { label: "Contract", value: "contract" },
  { label: "Temporary", value: "temporary" },
  { label: "Internship", value: "internship" },
  { label: "Seasonal", value: "seasonal" },
];

const fieldClassName =
  "mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-blue-100";

export function JobFilters({
  categories,
  currentParams,
  onApply,
  sectors,
}: JobFiltersProps) {
  const selectedCategories = new Set(
    currentParams.get("categoryIds")?.split(",").filter(Boolean) ?? [],
  );
  const selectedEmploymentTypes = new Set(
    currentParams.get("employmentTypes")?.split(",").filter(Boolean) ?? [],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextParams = new URLSearchParams();
    const copyValue = (key: string) => {
      const value = String(data.get(key) ?? "").trim();

      if (value) {
        nextParams.set(key, value);
      }
    };

    copyValue("search");
    copyValue("province");
    copyValue("city");

    const categoryIds = data.getAll("categoryIds").map(String);
    const selectedTypes = data.getAll("employmentTypes").map(String);

    if (categoryIds.length > 0) {
      nextParams.set("categoryIds", categoryIds.join(","));
    }

    if (selectedTypes.length > 0) {
      nextParams.set("employmentTypes", selectedTypes.join(","));
    }

    if (data.get("isRemote") === "true") {
      nextParams.set("isRemote", "true");
    }

    onApply(nextParams);
  };

  return (
    <details
      className="rounded-xl border border-border bg-white p-4 lg:block"
      open
    >
      <summary className="cursor-pointer font-bold lg:hidden">
        Search and filters
      </summary>
      <form className="mt-4 space-y-5 lg:mt-0" onSubmit={handleSubmit}>
        <label className="block text-sm font-semibold">
          Keywords
          <input
            className={fieldClassName}
            defaultValue={currentParams.get("search") ?? ""}
            name="search"
            placeholder="Job title or skills"
            type="search"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <label className="block text-sm font-semibold">
            Province
            <input
              className={fieldClassName}
              defaultValue={currentParams.get("province") ?? ""}
              name="province"
              placeholder="Ontario"
              type="text"
            />
          </label>
          <label className="block text-sm font-semibold">
            City
            <input
              className={fieldClassName}
              defaultValue={currentParams.get("city") ?? ""}
              name="city"
              placeholder="Toronto"
              type="text"
            />
          </label>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold">Employment type</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {employmentTypes.map((employmentType) => (
              <label
                className="flex items-center gap-2 text-sm text-muted"
                key={employmentType.value}
              >
                <input
                  defaultChecked={selectedEmploymentTypes.has(
                    employmentType.value,
                  )}
                  name="employmentTypes"
                  type="checkbox"
                  value={employmentType.value}
                />
                {employmentType.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            defaultChecked={currentParams.get("isRemote") === "true"}
            name="isRemote"
            type="checkbox"
            value="true"
          />
          Remote jobs only
        </label>

        <fieldset>
          <legend className="text-sm font-semibold">Categories</legend>
          <div className="mt-2 max-h-72 space-y-4 overflow-y-auto pr-2">
            {sectors.map((sector) => {
              const sectorCategories = categories.filter(
                (category) => category.sector_id === sector.id,
              );

              if (sectorCategories.length === 0) {
                return null;
              }

              return (
                <div key={sector.id}>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted">
                    {sector.name}
                  </p>
                  <div className="mt-2 space-y-2">
                    {sectorCategories.map((category) => (
                      <label
                        className="flex items-start gap-2 text-sm"
                        key={category.id}
                      >
                        <input
                          defaultChecked={selectedCategories.has(
                            String(category.id),
                          )}
                          name="categoryIds"
                          type="checkbox"
                          value={category.id}
                        />
                        <span>{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>

        <div className="flex gap-3">
          <button
            className="flex-1 rounded-md bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            type="submit"
          >
            Apply filters
          </button>
          <button
            className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-background"
            onClick={() => onApply(new URLSearchParams())}
            type="button"
          >
            Clear
          </button>
        </div>
      </form>
    </details>
  );
}
