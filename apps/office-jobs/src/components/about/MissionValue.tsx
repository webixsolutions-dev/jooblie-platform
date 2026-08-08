import type { FC, SVGProps } from "react";

type IconComponent = FC<SVGProps<SVGSVGElement>>;

interface ValueItem {
  icon: IconComponent;
  title: string;
  desc: string;
}

interface StatItem {
  icon: IconComponent;
  value: string;
  label: string;
  desc: string;
}

// Inline icon components (replacing react-icons/fi, react-icons/hi2, react-icons/gi)
const ShieldIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UserGroupIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const CheckCircleIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const TrendingUpIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const BriefcaseIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
);

const BuildingOffice2Icon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
  </svg>
);

const ArrowRightIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const MapleLeafIcon: IconComponent = (props) => (
  <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M478.13 433.6l-79.9-14.9 22.6-59.4c3.3-8.7-2.7-18.1-12-18.1h-64.7l68.9-97.4c5.6-7.9-.1-18.8-9.7-18.8h-45.6l55.7-91.7c5.1-8.4-1-19.2-10.8-19.2h-31.3l31.6-64.4c4.7-9.6-2.3-20.7-13-20.7-3.3 0-6.5 1.1-9.1 3.1L256 96.9 132.9 33c-2.6-2-5.8-3.1-9.1-3.1-10.7 0-17.7 11.1-13 20.7l31.6 64.4h-31.3c-9.8 0-15.9 10.8-10.8 19.2l55.7 91.7h-45.6c-9.6 0-15.3 10.9-9.7 18.8l68.9 97.4H104c-9.3 0-15.3 9.4-12 18.1l22.6 59.4-79.9 14.9c-9.6 1.8-13.1 13.7-6.2 20.5l43.1 42.4c2.3 2.3 5.4 3.5 8.6 3.5.9 0 1.8-.1 2.7-.3l87.8-18.6-5.6 55.6c-.9 8.9 8 15.6 16.1 12.1l74.8-32.3 74.8 32.3c8.1 3.5 17-3.2 16.1-12.1l-5.6-55.6 87.8 18.6c.9.2 1.8.3 2.7.3 3.2 0 6.3-1.3 8.6-3.5l43.1-42.4c6.8-6.8 3.3-18.7-6.3-20.5z" />
  </svg>
);

const VALUES: ValueItem[] = [
  {
    icon: ShieldIcon,
    title: "Trust",
    desc: "We're committed to transparency, fairness, and protecting the trust of our community.",
  },
  {
    icon: UserGroupIcon,
    title: "Inclusion",
    desc: "We welcome talent from all backgrounds and believe diverse teams build stronger workplaces.",
  },
  {
    icon: CheckCircleIcon,
    title: "Simplicity",
    desc: "We make the job search and hiring process straightforward and stress-free.",
  },
  {
    icon: TrendingUpIcon,
    title: "Growth",
    desc: "We support career growth and help businesses and people move forward.",
  },
];

const STATS: StatItem[] = [
  {
    icon: BriefcaseIcon,
    value: "10,000+",
    label: "Office Jobs",
    desc: "New opportunities added every week",
  },
  {
    icon: UserGroupIcon,
    value: "2,000+",
    label: "Employers",
    desc: "Trusted by organizations across Canada",
  },
  {
    icon: MapleLeafIcon,
    value: "Canada-Wide Reach",
    label: "",
    desc: "Opportunities in cities, towns, and communities coast to coast",
  },
];

export default function MissionValues() {
  return (
    <section className="bg-offwhite">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Eyebrow */}
        <div className="flex flex-col items-center text-center">
          <div className="flex w-full max-w-md items-center gap-4">
            <span className="h-px flex-1 bg-gold" />
            <BuildingOffice2Icon className="h-7 w-7 shrink-0 text-gold" />
            <span className="h-px flex-1 bg-gold" />
          </div>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-teal">
            Our Mission &amp; Values
          </p>
          <h2
            id="mission"
            className="mt-2 font-display text-3xl font-extrabold text-[#06152B] sm:text-4xl"
          >
            Our Mission
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Office Jobline connects office professionals with meaningful
            opportunities and helps employers find the talent they
            need—across cities, towns, and communities in Canada.
          </p>
        </div>

        {/* Mission image + vision */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="h-64 w-full overflow-hidden rounded-2xl sm:h-80 lg:h-96">
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
              alt="Team collaborating over a laptop in the office"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-display text-2xl font-extrabold text-[#06152B] sm:text-3xl">
              Our Vision
            </h3>
            <span className="mt-2 block h-1 w-14 rounded-full bg-gold" />
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
              To be Canada's most trusted platform for office and
              administrative careers—empowering people and organizations to
              build stronger, more connected workplaces.
            </p>
            <a
              href="/browse"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
            >
              Explore Jobs
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Values */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-light">
                <Icon className="h-6 w-6 text-teal" />
              </span>
              <p className="mt-4 font-display text-base font-bold text-[#06152B]">
                {title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-10 grid grid-cols-1 divide-y divide-gray-200 rounded-2xl bg-white p-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:p-8">
          {STATS.map(({ icon: Icon, value, label, desc }) => (
            <div
              key={value}
              className="flex items-start gap-4 py-4 first:pt-0 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal">
                <Icon className="h-6 w-6 text-white" />
              </span>
              <div>
                <p className="font-display text-xl font-extrabold text-[#06152B]">
                  {value}
                </p>
                {label && (
                  <p className="text-sm font-semibold text-[#06152B]">{label}</p>
                )}
                <p className="mt-1 text-sm text-muted">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}