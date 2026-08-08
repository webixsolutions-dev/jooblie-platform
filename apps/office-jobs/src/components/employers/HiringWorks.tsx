import { useNavigate } from 'react-router-dom'
import { Fragment, type ReactElement } from 'react'

interface Step {
  Icon: (props: { className?: string }) => ReactElement
  title: string
  desc: string
  path: string
}

interface WhyChooseItem {
  Icon: (props: { className?: string }) => ReactElement
  title: string
  desc: string
  path: string
}

// Inline SVG icons — replaces react-icons, no external dependency
function UserPlusIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="9" cy="7" r="4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 21a7 7 0 0114 0M19 8v6M22 11h-6" />
    </svg>
  )
}

function FileAltIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M9 13h6M9 17h6" />
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

function CheckCircleIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
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

function MapMarkerIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

const steps: Step[] = [
  {
    Icon: UserPlusIcon,
    title: 'Create Employer Account',
    desc: 'Sign up in minutes and set up your company profile.',
    path: '/signup',
  },
  {
    Icon: FileAltIcon,
    title: 'Post Your Office Job',
    desc: 'Add job details and reach qualified candidates fast.',
    path: '/post-a-job',
  },
  {
    Icon: UsersIcon,
    title: 'Review Applicants',
    desc: 'Access applications, screen candidates, and shortlist top prospects.',
    path: '/employers',
  },
  {
    Icon: CheckCircleIcon,
    title: 'Hire Faster',
    desc: 'Connect with the right talent and fill your roles with confidence.',
    path: '/employers',
  },
]

const whyChoose: WhyChooseItem[] = [
  {
    Icon: UsersIcon,
    title: 'Applicant Tracking',
    desc: 'Manage applications, track candidate progress, and stay organized.',
    path: '/employers',
  },
  {
    Icon: BuildingIcon,
    title: 'Employer Branding',
    desc: 'Showcase your company culture and attract the right office professionals.',
    path: '/employers',
  },
  {
    Icon: MapMarkerIcon,
    title: 'Targeted Job Reach',
    desc: 'Reach qualified office and administrative candidates across Canada.',
    path: '/browse',
  },
  {
    Icon: UsersIcon,
    title: 'Easy Team Collaboration',
    desc: 'Invite your team, share feedback, and hire with confidence.',
    path: '/employers',
  },
]

export default function HowItWorks() {
  const navigate = useNavigate()

  const handleStepClick = (path: string) => {
    navigate(path)
  }

  const handleWhyChooseClick = (path: string) => {
    navigate(path)
  }

  const handleStartHiring = () => {
    navigate('/post-a-job')
  }

  return (
    <section className="w-full bg-white py-16">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 h-1 w-16 bg-[#d4af37]" />
          <h2 className="mb-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            How Hiring Works
          </h2>
          <p className="text-slate-600">
            Simple steps to find the right office and administrative talent in Canada.
          </p>
        </div>

        <div className="mb-20 flex flex-col items-stretch gap-4 lg:flex-row">
          {steps.map((s, i) => (
            <Fragment key={s.title}>
              <div
                onClick={() => handleStepClick(s.path)}
                className="relative flex-1 cursor-pointer rounded-lg border border-slate-200 p-6 transition hover:scale-[1.02] hover:shadow-md"
              >
                <div className="absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#005F5A] text-sm font-bold text-white">
                  {i + 1}
                </div>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#005F5A]/5">
                  <s.Icon className="h-6 w-6 text-[#005F5A]" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden items-center justify-center text-xl text-slate-300 lg:flex">
                  <ChevronRightIcon className="h-5 w-5" />
                </div>
              )}
            </Fragment>
          ))}
        </div>

        <div className="mb-12 text-center">
          <div className="mx-auto mb-4 h-1 w-16 bg-[#d4af37]" />
          <h2 className="mb-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Why Employers Choose Office Jobline
          </h2>
          <p className="text-slate-600">
            Everything you need to hire top office and administrative talent across
            Canada.
          </p>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whyChoose.map((f) => (
            <div
              key={f.title}
              onClick={() => handleWhyChooseClick(f.path)}
              className="cursor-pointer rounded-lg border border-slate-200 p-6 transition hover:scale-[1.02] hover:shadow-md"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#005F5A]/5">
                <f.Icon className="h-6 w-6 text-[#005F5A]" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-xl bg-[#005F5A] px-6 py-10 sm:px-10 lg:flex-row">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#d4af37]">
              <BuildingIcon className="h-6 w-6 text-[#d4af37]" />
            </div>
            <div>
              <h3 className="mb-1 text-xl font-bold text-white sm:text-2xl">
                Ready to build a stronger office team?
              </h3>
              <p className="text-sm text-slate-300 sm:text-base">
                Join thousands of Canadian employers hiring top office and
                administrative talent every day.
              </p>
            </div>
          </div>
          <button
            onClick={handleStartHiring}
            className="flex items-center gap-2 whitespace-nowrap rounded-md bg-[#d4af37] px-6 py-3 font-semibold text-slate-900 transition hover:bg-[#b8960f]"
          >
            Start Hiring Today
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}