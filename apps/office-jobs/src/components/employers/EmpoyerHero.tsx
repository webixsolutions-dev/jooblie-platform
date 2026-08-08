import { useNavigate } from 'react-router-dom'
import { type ReactElement } from 'react'

interface Feature {
  Icon: (props: { className?: string }) => ReactElement
  title: string
  titleAccent: string
  desc: string
  path: string
}

// Inline SVG icons — replaces react-icons, no external dependency
function BriefcaseIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  )
}

function CommentDotsIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      <path strokeLinecap="round" d="M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-6.13a4 4 0 11-8 0 4 4 0 018 0zm10 0a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

function BoltIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  )
}

function ChartBarIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20V10M18 20V4M6 20v-4" />
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

const features: Feature[] = [
  {
    Icon: UsersIcon,
    title: 'Qualified',
    titleAccent: 'Office Candidates',
    desc: 'Access pre-screened office and administrative professionals ready to contribute.',
    path: '/employers',
  },
  {
    Icon: BoltIcon,
    title: 'Fast',
    titleAccent: 'Job Posting',
    desc: 'Post jobs in minutes and start receiving qualified applications right away.',
    path: '/post-a-job',
  },
  {
    Icon: MapleLeafIcon,
    title: 'Canada-Wide',
    titleAccent: 'Reach',
    desc: 'Reach job seekers from every province and territory with one simple post.',
    path: '/browse',
  },
  {
    Icon: ChartBarIcon,
    title: 'Easy Employer',
    titleAccent: 'Dashboard',
    desc: 'Manage jobs, track applicants and communicate—all from one intuitive dashboard.',
    path: '/employers',
  },
]

export default function EmployerHero() {
  const navigate = useNavigate()

  const handlePostJob = () => {
    navigate('/post-a-job')
  }

  const handleTalkToSales = () => {
    navigate('/contact-us')
  }

  const handleFeatureClick = (path: string) => {
    navigate(path)
  }

  return (
    <section className="w-full bg-white">
      <div className="relative overflow-hidden bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 py-12 sm:px-10 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="mb-3 text-sm font-semibold tracking-wide text-[#d4af37]">
              FOR EMPLOYERS
            </p>
            <h1 className="mb-6 text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Hire Office &amp; Administrative Talent Across Canada
            </h1>
            <p className="mb-8 max-w-xl text-base text-slate-600 sm:text-lg">
              Post your jobs and connect with qualified office professionals across
              Canada. Recruit office managers, receptionists, administrative
              assistants, executive assistants, data entry clerks, customer service
              representatives, payroll clerks, and coordinators—faster and easier.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                onClick={handlePostJob}
                className="flex items-center justify-center gap-2 rounded-md bg-[#d4af37] px-6 py-3 font-semibold text-slate-900 transition hover:bg-[#b8960f]"
              >
                <BriefcaseIcon className="h-4 w-4" />
                Post a Job
              </button>
              <button
                onClick={handleTalkToSales}
                className="flex items-center justify-center gap-2 rounded-md bg-[#06152B] px-6 py-3 font-semibold text-white transition hover:bg-[#0a1f3d]"
              >
                <CommentDotsIcon className="h-4 w-4" />
                Talk to Sales
              </button>
            </div>
          </div>

          <div className="relative h-64 overflow-hidden rounded-xl sm:h-80 lg:h-[420px]">
            <img
              src="https://plus.unsplash.com/premium_photo-1661775434014-9c0e8d71de03?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8b2ZmaWNlJTIwc3RhZmYlMjBvaWN8ZW58MHx8MHx8fDA%3D"
              alt="Office employers collaborating"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 sm:px-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title + f.titleAccent}
              onClick={() => handleFeatureClick(f.path)}
              className="cursor-pointer rounded-lg border border-slate-200 p-6 transition hover:scale-[1.02] hover:shadow-md"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#06152B]/5">
                <f.Icon className="h-6 w-6 text-[#06152B]" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900">
                {f.title}{' '}
                <span className="border-b-2 border-[#d4af37] text-[#06152B]">
                  {f.titleAccent}
                </span>
              </h3>
              <p className="text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}