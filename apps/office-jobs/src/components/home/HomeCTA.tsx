import { useNavigate } from 'react-router-dom'
import { type ReactElement } from 'react'

// Inline SVG icons — replaces react-icons, no external dependency
function SearchIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
    </svg>
  )
}

function BriefcaseIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  )
}

function BuildingIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path strokeLinecap="round" d="M9 6h1M14 6h1M9 10h1M14 10h1M9 14h1M14 14h1M9 18h6" />
    </svg>
  )
}

function MapleLeafIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2 5 5-1-2 4 3 3-4 1 1 5-4-3-4 3 1-5-4-1 3-3-2-4 5 1z" />
    </svg>
  )
}

export default function HomeCTA() {
  const navigate = useNavigate()

  const handleBrowseJobs = () => {
    navigate('/browse')
  }

  const handlePostJob = () => {
    navigate('/post-a-job')
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* CTA banner - Navy background with gold accent */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1a2a4a] px-6 py-14 text-center sm:px-10">
          <BuildingIcon className="pointer-events-none absolute -right-6 bottom-0 hidden h-64 w-64 text-white/5 sm:block" />
          <div className="relative">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
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
              {/* Browse Jobs - Teal/Green button */}
              <button
                onClick={handleBrowseJobs}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0d9488] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0f766e] sm:w-auto"
              >
                <SearchIcon className="h-4 w-4" />
                Browse Jobs
              </button>
              {/* Post a Job - Gold button */}
              <button
                onClick={handlePostJob}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#d4af37] px-6 py-3 text-sm font-semibold text-[#1a2a4a] transition-colors hover:bg-[#b8960f] sm:w-auto"
              >
                <BriefcaseIcon className="h-4 w-4" />
                Post a Job
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}