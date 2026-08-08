import type { FC, SVGProps } from "react";

type IconComponent = FC<SVGProps<SVGSVGElement>>;

interface Feature {
  icon: IconComponent;
  title: string;
  desc: string;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  image: string;
}

const SEEKER_POINTS: string[] = [
  "Discover office jobs that match your skills and career goals.",
  "Apply easily with a simple, streamlined application process.",
  "Set job alerts and never miss new opportunities that fit you.",
];

const EMPLOYER_POINTS: string[] = [
  "Post jobs in minutes and reach the right office talent.",
  "Connect with qualified candidates across Canada.",
  "Manage applicants easily with our employer dashboard.",
];

// Inline icon components (replacing react-icons/fi)
const ShieldIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const SettingsIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const TrendingUpIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const UserIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SearchIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ArrowRightIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const BuildingOffice2Icon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
  </svg>
);

// Font Awesome-style solid icons (quote-left, star)
const QuoteLeftIcon: IconComponent = (props) => (
  <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M0 216C0 149.7 53.7 96 120 96h8c17.7 0 32 14.3 32 32s-14.3 32-32 32h-8c-30.9 0-56 25.1-56 56v8h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V216zm256 0c0-66.3 53.7-120 120-120h8c17.7 0 32 14.3 32 32s-14.3 32-32 32h-8c-30.9 0-56 25.1-56 56v8h64c35.3 0 64 28.7 64 64v64c0 35.3-28.7 64-64 64h-64c-35.3 0-64-28.7-64-64V216z" />
  </svg>
);

const StarIcon: IconComponent = (props) => (
  <svg viewBox="0 0 576 512" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L150.9 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.2 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0z" />
  </svg>
);

// GiMapleLeaf replacement
const MapleLeafIcon: IconComponent = (props) => (
  <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M478.13 433.6l-79.9-14.9 22.6-59.4c3.3-8.7-2.7-18.1-12-18.1h-64.7l68.9-97.4c5.6-7.9-.1-18.8-9.7-18.8h-45.6l55.7-91.7c5.1-8.4-1-19.2-10.8-19.2h-31.3l31.6-64.4c4.7-9.6-2.3-20.7-13-20.7-3.3 0-6.5 1.1-9.1 3.1L256 96.9 132.9 33c-2.6-2-5.8-3.1-9.1-3.1-10.7 0-17.7 11.1-13 20.7l31.6 64.4h-31.3c-9.8 0-15.9 10.8-10.8 19.2l55.7 91.7h-45.6c-9.6 0-15.3 10.9-9.7 18.8l68.9 97.4H104c-9.3 0-15.3 9.4-12 18.1l22.6 59.4-79.9 14.9c-9.6 1.8-13.1 13.7-6.2 20.5l43.1 42.4c2.3 2.3 5.4 3.5 8.6 3.5.9 0 1.8-.1 2.7-.3l87.8-18.6-5.6 55.6c-.9 8.9 8 15.6 16.1 12.1l74.8-32.3 74.8 32.3c8.1 3.5 17-3.2 16.1-12.1l-5.6-55.6 87.8 18.6c.9.2 1.8.3 2.7.3 3.2 0 6.3-1.3 8.6-3.5l43.1-42.4c6.8-6.8 3.3-18.7-6.3-20.5z" />
  </svg>
);

const FEATURES: Feature[] = [
  {
    icon: ShieldIcon,
    title: "Verified Listings",
    desc: "All job postings are reviewed for quality and legitimacy so you can apply or hire with confidence.",
  },
  {
    icon: SettingsIcon,
    title: "Easy Hiring Tools",
    desc: "Powerful tools and dashboards that simplify hiring and save time for employers.",
  },
  {
    icon: TrendingUpIcon,
    title: "Career Growth Support",
    desc: "Resources, tips, and guidance to help office professionals grow their careers and reach their goals.",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Office Jobline made it so easy to find the right opportunity. I set up job alerts and found a great role in just two weeks!",
    name: "Jessica H.",
    role: "Toronto, ON",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "We found qualified candidates quickly and the hiring tools are incredibly easy to use. Highly recommend!",
    name: "Mark D.",
    role: "Vancouver, BC",
    image:
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&q=80",
  },
];

export default function HowWeHelp() {
  return (
    <section className="bg-offwhite">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-extrabold text-[#06152B] sm:text-4xl">
            How We Help Job Seekers &amp; Employers
          </h2>
          <p className="mt-3 text-base text-muted sm:text-lg">
            Simple solutions that connect office talent with opportunities
            across Canada.
          </p>
        </div>

        {/* Two panels */}
        <div className="relative mt-10 grid grid-cols-1 gap-5 rounded-2xl bg-white p-2 shadow-sm sm:grid-cols-2 sm:gap-0 sm:p-0">
          <span className="absolute inset-y-6 left-1/2 hidden w-px -translate-x-1/2 bg-gray-200 sm:block" />

          {/* Job seekers */}
          <div className="rounded-xl bg-teal-light p-6 sm:rounded-l-2xl sm:rounded-r-none sm:p-10">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white">
                <span className="relative flex h-8 w-8 items-center justify-center">
                  <UserIcon className="h-8 w-8 text-teal" />
                  <SearchIcon className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-teal-light text-teal" />
                </span>
              </span>
              <h3 className="font-display text-xl font-extrabold text-[#06152B] sm:text-2xl">
                For Job Seekers
              </h3>
            </div>
            <ul className="mt-6 space-y-3">
              {SEEKER_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal text-xs text-white">
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed text-[#06152B]/80 sm:text-base">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="#browse-jobs"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
            >
              Browse Office Jobs
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>

          {/* Employers */}
          <div className="rounded-xl bg-gold/10 p-6 sm:rounded-l-none sm:rounded-r-2xl sm:p-10">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white">
                <BuildingOffice2Icon className="h-8 w-8 text-gold-dark" />
              </span>
              <h3 className="font-display text-xl font-extrabold text-[#06152B] sm:text-2xl">
                For Employers
              </h3>
            </div>
            <ul className="mt-6 space-y-3">
              {EMPLOYER_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-xs text-[#06152B]">
                    ✓
                  </span>
                  <span className="text-sm leading-relaxed text-[#06152B]/80 sm:text-base">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
            <a
              href="/post-job"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-[#06152B] transition-colors hover:bg-gold-dark"
            >
              Post a Job
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
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

        {/* Quote divider */}
        <div className="mt-14 flex items-center gap-4">
          <span className="h-px flex-1 bg-gold" />
          <QuoteLeftIcon className="h-5 w-5 shrink-0 text-gold" />
          <span className="h-px flex-1 bg-gold" />
        </div>

        {/* Testimonials */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {TESTIMONIALS.map(({ quote, name, role, image }) => (
            <div
              key={name}
              className="flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <img
                src={image}
                alt={name}
                className="h-14 w-14 shrink-0 rounded-full object-cover"
              />
              <div>
                <p className="text-sm italic leading-relaxed text-[#06152B]/80 sm:text-base">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="mt-3 flex text-gold">
                  <StarIcon className="h-4 w-4" />
                  <StarIcon className="h-4 w-4" />
                  <StarIcon className="h-4 w-4" />
                  <StarIcon className="h-4 w-4" />
                  <StarIcon className="h-4 w-4" />
                </div>
                <p className="mt-2 font-display text-sm font-bold text-[#06152B]">
                  {name}
                </p>
                <p className="text-xs text-muted">{role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom divider */}
        <div className="mt-14 flex items-center gap-4">
          <span className="h-px flex-1 bg-gold" />
          <MapleLeafIcon className="h-5 w-5 shrink-0 text-gold" />
          <span className="h-px flex-1 bg-gold" />
        </div>
      </div>
    </section>
  );
}