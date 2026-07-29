import { Link } from "react-router-dom";

import { Container } from "../components/Container";

// PLACEHOLDER — swap with verified client content before production.
const ABOUT_CONTENT = {
  hero: {
    eyebrow: "About Jooblie",
    heading: "Better connections between Canadian talent and employers.",
    lead: "Jooblie is a Canadian job board helping people discover relevant opportunities and helping employers reach qualified candidates nationwide.",
    intro:
      "We are building a simpler, more transparent place to search, post and connect — from first jobs and skilled trades to professional and specialized roles.",
    actions: {
      browseJobs: "Browse Jobs",
      postJob: "Post a Job",
    },
  },
  purpose: {
    eyebrow: "Why we exist",
    heading: "A straightforward job marketplace built around trust.",
    intro:
      "Our focus is practical: make opportunities easier to find, make hiring easier to manage, and keep the experience clear for both sides.",
    cards: [
      {
        title: "Our mission",
        description:
          "Give Canadians a dependable place to discover work and give employers a clear, credible way to reach people who fit their needs.",
        icon: "mission",
      },
      {
        title: "Our vision",
        description:
          "Become a trusted nationwide destination for employment discovery, supporting stronger matches across provinces, industries and career stages.",
        icon: "vision",
      },
    ],
  },
  audiences: {
    eyebrow: "Who we serve",
    heading: "One platform, different hiring needs.",
    cards: [
      {
        number: "01",
        title: "Job seekers",
        description:
          "Search relevant roles, compare opportunities and move from discovery to application with less friction.",
      },
      {
        number: "02",
        title: "Employers",
        description:
          "Publish openings, strengthen employer visibility and reach candidates across Canada.",
      },
      {
        number: "03",
        title: "Growing teams",
        description:
          "Support recurring hiring with a simple destination for active roles and employer information.",
      },
      {
        number: "04",
        title: "Local communities",
        description:
          "Make regional opportunities easier to discover, from major cities to smaller Canadian markets.",
      },
    ],
  },
  stats: {
    ariaLabel: "Jooblie platform statistics",
    items: [
      { value: "18K+", label: "jobs posted" },
      { value: "2.4K", label: "employers represented" },
      { value: "75K+", label: "candidate profiles" },
      { value: "13", label: "provinces & territories covered" },
    ],
  },
  closing: {
    eyebrow: "Move forward with Jooblie",
    heading: "Find the right next step — or the right next hire.",
    description:
      "Explore active opportunities across Canada or introduce your next opening to candidates already looking.",
    actions: {
      browseJobs: "Browse Jobs",
      postJob: "Post a Job",
    },
  },
} as const;

type PurposeIcon = (typeof ABOUT_CONTENT.purpose.cards)[number]["icon"];

function PurposeCardIcon({ icon }: { readonly icon: PurposeIcon }) {
  return (
    <div
      aria-hidden="true"
      className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary"
    >
      {icon === "mission" ? (
        <svg
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ) : (
        <svg
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M3 12h18M12 3v18" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
    </div>
  );
}

const primaryActionClass =
  "inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-5 py-3 font-bold text-white outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";
const secondaryActionClass =
  "inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-white px-5 py-3 font-bold text-brandNavy outline-none hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export function AboutPage() {
  return (
    <>
      <section
        aria-labelledby="about-hero-heading"
        className="border-b border-border bg-white"
      >
        <Container className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:gap-16 lg:py-24">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              {ABOUT_CONTENT.hero.eyebrow}
            </p>
            <h1
              className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl"
              id="about-hero-heading"
            >
              {ABOUT_CONTENT.hero.heading}
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-foreground/80 sm:text-xl">
              {ABOUT_CONTENT.hero.lead}
            </p>
            <p className="mt-4 max-w-3xl leading-7 text-muted">
              {ABOUT_CONTENT.hero.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={primaryActionClass} to="/jobs">
                {ABOUT_CONTENT.hero.actions.browseJobs}
              </Link>
              <Link
                className={secondaryActionClass}
                to="/signup?role=recruiter"
              >
                {ABOUT_CONTENT.hero.actions.postJob}
              </Link>
            </div>
          </div>

          <div className="relative min-h-72 overflow-hidden rounded-2xl border border-border sm:min-h-80">
            <img
              alt="Coworkers celebrating together in an office"
              className="absolute inset-0 size-full object-cover"
              src="/images/about-hero.jpg"
            />
          </div>
        </Container>
      </section>

      <section aria-labelledby="about-purpose-heading" className="py-14 sm:py-20">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              {ABOUT_CONTENT.purpose.eyebrow}
            </p>
            <h2
              className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
              id="about-purpose-heading"
            >
              {ABOUT_CONTENT.purpose.heading}
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-muted">
              {ABOUT_CONTENT.purpose.intro}
            </p>
          </div>

          <div className="mt-8 grid items-stretch gap-5 md:grid-cols-2">
            {ABOUT_CONTENT.purpose.cards.map((card) => (
              <article
                className="rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8"
                key={card.title}
              >
                <PurposeCardIcon icon={card.icon} />
                <h3 className="mt-5 text-xl font-bold tracking-tight">
                  {card.title}
                </h3>
                <p className="mt-3 leading-7 text-muted">{card.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section
        aria-labelledby="about-audiences-heading"
        className="border-y border-border bg-white py-14 sm:py-20"
      >
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              {ABOUT_CONTENT.audiences.eyebrow}
            </p>
            <h2
              className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
              id="about-audiences-heading"
            >
              {ABOUT_CONTENT.audiences.heading}
            </h2>
          </div>

          <div className="mt-8 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ABOUT_CONTENT.audiences.cards.map((card) => (
              <article
                className="rounded-xl border border-border bg-white p-6 shadow-sm"
                key={card.number}
              >
                <p className="text-sm font-extrabold tracking-[0.14em] text-primary">
                  {card.number}
                </p>
                <h3 className="mt-3 text-xl font-bold tracking-tight">
                  {card.title}
                </h3>
                <p className="mt-3 leading-7 text-muted">{card.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section
        aria-label={ABOUT_CONTENT.stats.ariaLabel}
        className="bg-brandNavy py-10 text-white sm:py-12"
      >
        <Container className="grid grid-cols-2 gap-y-8 md:grid-cols-4 md:gap-y-0">
          {ABOUT_CONTENT.stats.items.map((stat, index) => (
            <div
              className={`px-4 first:pl-0 md:px-6 md:first:pl-0 ${
                index % 2 === 0
                  ? "border-r border-white/15"
                  : "md:border-r md:border-white/15"
              } ${index === ABOUT_CONTENT.stats.items.length - 1 ? "md:border-r-0 md:pr-0" : ""}`}
              key={stat.label}
            >
              <p className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {stat.label}
              </p>
            </div>
          ))}
        </Container>
      </section>

      <section
        aria-labelledby="about-closing-heading"
        className="py-14 sm:py-20"
      >
        <Container>
          <div className="flex flex-col items-start justify-between gap-8 rounded-2xl border border-border bg-white p-7 shadow-lg sm:p-10 lg:flex-row lg:items-center">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-wider text-primary">
                {ABOUT_CONTENT.closing.eyebrow}
              </p>
              <h2
                className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
                id="about-closing-heading"
              >
                {ABOUT_CONTENT.closing.heading}
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-muted">
                {ABOUT_CONTENT.closing.description}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:shrink-0">
              <Link className={primaryActionClass} to="/jobs">
                {ABOUT_CONTENT.closing.actions.browseJobs}
              </Link>
              <Link
                className={secondaryActionClass}
                to="/signup?role=recruiter"
              >
                {ABOUT_CONTENT.closing.actions.postJob}
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
