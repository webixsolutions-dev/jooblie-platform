import { type ReactElement } from 'react'

interface Feature {
  Icon: (props: { className?: string }) => ReactElement
  title: string
  desc: string
}

interface Category {
  Icon: (props: { className?: string }) => ReactElement
  title: string
  jobs: string
}

// Inline SVG icons — replaces react-icons, no external dependency
function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  )
}

function UserGroupIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-6.13a4 4 0 11-8 0 4 4 0 018 0zm10 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  )
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  )
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 00-16 0" />
    </svg>
  )
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="6" y="4" width="12" height="18" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4V2h6v2" />
      <path strokeLinecap="round" d="M9 10h6M9 14h6M9 18h3" />
    </svg>
  )
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4" />
    </svg>
  )
}

function ChatBubbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
    </svg>
  )
}

function MapleLeafIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2 5 5-1-2 4 3 3-4 1 1 5-4-3-4 3 1-5-4-1 3-3-2-4 5 1z" />
    </svg>
  )
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

const FEATURES: Feature[] = [
  {
    Icon: BriefcaseIcon,
    title: 'Curated Office Jobs',
    desc: 'Handpicked office and administrative roles from reputable employers across Canada.',
  },
  {
    Icon: UserGroupIcon,
    title: 'Top Canadian Employers',
    desc: 'Access opportunities from leading companies that value office talent like yours.',
  },
  {
    Icon: BellIcon,
    title: 'Fast Job Alerts',
    desc: 'Get notified about new office jobs that match your skills and preferences.',
  },
  {
    Icon: FileTextIcon,
    title: 'Easy Applications',
    desc: 'Apply quickly and easily with a streamlined process designed to save you time.',
  },
]

const CATEGORIES: Category[] = [
  { Icon: UserIcon, title: 'Administrative Assistant', jobs: '2,845 Jobs' },
  { Icon: UserIcon, title: 'Receptionist', jobs: '1,826 Jobs' },
  { Icon: BriefcaseIcon, title: 'Executive Assistant', jobs: '1,695 Jobs' },
  { Icon: ClipboardIcon, title: 'Office Manager', jobs: '1,232 Jobs' },
  { Icon: MonitorIcon, title: 'Data Entry Clerk', jobs: '1,418 Jobs' },
  { Icon: ChatBubbleIcon, title: 'Customer Service Representative', jobs: '2,159 Jobs' },
]

export default function WhyChoose() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Heading */}
        <h2 className="text-3xl font-extrabold text-[#06152B] sm:text-4xl">
          Why Choose Office Jobline
        </h2>
        <p className="mt-4 max-w-4xl text-base leading-relaxed text-[#06152B]/60 sm:text-lg">
          Office Jobline is Canada's trusted job board for office and
          administrative professionals. Whether you're looking for
          receptionist jobs, executive assistant roles, office coordinator
          jobs, HR support jobs, customer service office roles, or data entry
          opportunities, we connect you with quality employers hiring across
          Canada.
        </p>

        {/* Feature cards */}
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-100 bg-white p-6 shadow-md shadow-black/5 ring-1 ring-black/5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#06152B]/5">
                <Icon className="h-6 w-6 text-[#06152B]" />
              </span>
              <p className="mt-4 text-base font-bold text-[#06152B]">{title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#06152B]/60">{desc}</p>
            </div>
          ))}
        </div>

        {/* Categories */}
        <h2 className="mt-16 text-3xl font-extrabold text-[#06152B] sm:text-4xl">
          Popular Office Job Categories
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map(({ Icon, title, jobs }) => (
            <div
              key={title}
              className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-6 text-center shadow-md shadow-black/5 ring-1 ring-black/5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#06152B]/5">
                <Icon className="h-6 w-6 text-[#06152B]" />
              </span>
              <p className="mt-4 text-sm font-bold text-[#06152B]">{title}</p>
              <div className="mt-4 w-full border-t border-gray-100 pt-3">
                <p className="text-sm text-[#06152B]/60">{jobs}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="mt-10 flex flex-col items-start gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-md shadow-black/5 ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#06152B]">
              <MapleLeafIcon className="h-7 w-7 text-white" />
            </span>
            <div>
              <p className="text-lg font-bold text-[#06152B]">
                Find office and administrative jobs across Canada
              </p>
              <p className="mt-1 text-sm text-[#06152B]/60">
                Explore thousands of opportunities in cities and communities
                from coast to coast.
              </p>
            </div>
          </div>
          <a
            href="/browse"
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#06152B] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0a1f3d] sm:w-auto"
          >
            Browse All Jobs
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}