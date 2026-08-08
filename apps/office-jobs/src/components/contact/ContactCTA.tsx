import type { FC, SVGProps } from "react";
import { useNavigate } from "react-router-dom";

type IconComponent = FC<SVGProps<SVGSVGElement>>;

// Inline icon components (replacing react-icons/fi, react-icons/hi2, react-icons/gi)
const SearchIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

const MapleLeafIcon: IconComponent = (props) => (
  <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M478.13 433.6l-79.9-14.9 22.6-59.4c3.3-8.7-2.7-18.1-12-18.1h-64.7l68.9-97.4c5.6-7.9-.1-18.8-9.7-18.8h-45.6l55.7-91.7c5.1-8.4-1-19.2-10.8-19.2h-31.3l31.6-64.4c4.7-9.6-2.3-20.7-13-20.7-3.3 0-6.5 1.1-9.1 3.1L256 96.9 132.9 33c-2.6-2-5.8-3.1-9.1-3.1-10.7 0-17.7 11.1-13 20.7l31.6 64.4h-31.3c-9.8 0-15.9 10.8-10.8 19.2l55.7 91.7h-45.6c-9.6 0-15.3 10.9-9.7 18.8l68.9 97.4H104c-9.3 0-15.3 9.4-12 18.1l22.6 59.4-79.9 14.9c-9.6 1.8-13.1 13.7-6.2 20.5l43.1 42.4c2.3 2.3 5.4 3.5 8.6 3.5.9 0 1.8-.1 2.7-.3l87.8-18.6-5.6 55.6c-.9 8.9 8 15.6 16.1 12.1l74.8-32.3 74.8 32.3c8.1 3.5 17-3.2 16.1-12.1l-5.6-55.6 87.8 18.6c.9.2 1.8.3 2.7.3 3.2 0 6.3-1.3 8.6-3.5l43.1-42.4c6.8-6.8 3.3-18.7-6.3-20.5z" />
  </svg>
);

export default function CTASection() {
  const navigate = useNavigate();

  const handleBrowseJobs = () => {
    navigate("/browse");
  };

  const handlePostJob = () => {
    navigate("/post-a-job");
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6 sm:pb-20 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl bg-[#1a2a4a] px-6 py-14 text-center shadow-lg sm:px-10 sm:py-16">
        <BuildingOffice2Icon className="pointer-events-none absolute -right-6 bottom-0 hidden h-64 w-64 text-white/5 sm:block" />
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#0d9488]/10 blur-2xl" />
        <div className="relative">
          <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
            Ready to Find Office Opportunities or Hire Great Talent?
          </h2>
          <div className="mt-5 flex items-center justify-center gap-4">
            <span className="h-px w-24 bg-[#d4af37]" />
            <MapleLeafIcon className="h-4 w-4 shrink-0 text-[#d4af37]" />
            <span className="h-px w-24 bg-[#d4af37]" />
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-sm text-white/75 sm:text-base">
            Join thousands of office professionals and employers building
            successful careers and teams across Canada.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={handleBrowseJobs}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0d9488] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f766e] sm:w-auto"
            >
              <SearchIcon className="h-4 w-4" />
              Browse Jobs
            </button>
            <button
              onClick={handlePostJob}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d4af37] px-6 py-3 text-sm font-semibold text-[#1a2a4a] shadow-sm transition-colors hover:bg-[#b8960f] sm:w-auto"
            >
              <BriefcaseIcon className="h-4 w-4" />
              Post a Job
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}