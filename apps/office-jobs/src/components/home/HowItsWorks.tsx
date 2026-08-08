import { type ReactElement } from 'react'

interface Step {
    Icon: (props: { className?: string }) => ReactElement
    number: number
    title: string
    desc: string
}

interface EmployerFeature {
    Icon: (props: { className?: string }) => ReactElement
    title: string
    desc: string
}

interface Testimonial {
    quote: string
    name: string
    role: string
    image: string
}

// Inline SVG icons — replaces react-icons, no external dependency
function SearchIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
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

function FileTextIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
    )
}

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
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

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
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

function BriefcaseIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
        </svg>
    )
}

function StarIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    )
}

const STEPS: Step[] = [
    {
        Icon: SearchIcon,
        number: 1,
        title: 'Search Jobs',
        desc: 'Find office and administrative jobs that match your skills and location.',
    },
    {
        Icon: UserIcon,
        number: 2,
        title: 'Create Profile',
        desc: 'Build your profile, add your experience, and let employers find you.',
    },
    {
        Icon: FileTextIcon,
        number: 3,
        title: 'Apply Easily',
        desc: "Apply to jobs in just a few clicks. It's fast, simple, and secure.",
    },
    {
        Icon: CheckCircleIcon,
        number: 4,
        title: 'Get Hired',
        desc: 'Connect with employers and land the right opportunity for your career.',
    },
]

const EMPLOYER_FEATURES: EmployerFeature[] = [
    {
        Icon: UserGroupIcon,
        title: 'Quality Applicants',
        desc: 'Connect with pre-screened, qualified office and administrative professionals.',
    },
    {
        Icon: ClockIcon,
        title: 'Quick Posting',
        desc: 'Post your jobs in minutes and start receiving applications fast.',
    },
    {
        Icon: MapleLeafIcon,
        title: 'Canada-Wide Reach',
        desc: 'Get your job in front of candidates from cities and towns across Canada.',
    },
]

const TESTIMONIALS: Testimonial[] = [
    {
        quote:
            "I found a great administrative job within a week! Office Jobline made the process so easy and helped me connect with the right employer.",
        name: 'Jessica L.',
        role: 'Office Administrator, Toronto, ON',
        image:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    },
    {
        quote:
            'We posted a job and received excellent candidates quickly. Office Jobline is our go-to platform for hiring office talent.',
        name: 'Mark D.',
        role: 'HR Manager, Vancouver, BC',
        image:
            'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&q=80',
    },
]

export default function HowItWorks() {
    return (
        <section className="bg-white">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
                {/* Heading + steps + image */}
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
                    <div>
                        <h2 className="text-3xl font-extrabold text-[#06152B] sm:text-4xl">
                            How It Works
                        </h2>
                        <p className="mt-3 text-base text-[#06152B]/60 sm:text-lg">
                            Get discovered. Get hired. Build your office career.
                        </p>

                        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 lg:grid-cols-2">
                            {STEPS.map(({ Icon, number, title, desc }, i) => (
                                <div key={title} className="relative">
                                    {i % 2 === 0 && (
                                        <span className="absolute left-6 top-6 hidden h-px w-full border-t border-dashed border-gray-300 sm:block lg:hidden" />
                                    )}
                                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#06152B]/5">
                                        <Icon className="h-6 w-6 text-[#06152B]" />
                                        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#06152B] text-[11px] font-bold text-white">
                                            {number}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-base font-bold text-[#06152B]">
                                        {title}
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-[#06152B]/60">
                                        {desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="h-64 w-full overflow-hidden rounded-2xl sm:h-80 lg:h-96">
                        <img
                            src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80"
                            alt="Team reviewing candidate profiles together"
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>

                {/* For Employers */}
                <div className="mt-14 rounded-2xl border border-gray-100 bg-white p-6 shadow-md shadow-black/5 ring-1 ring-black/5 sm:p-10">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_2fr] lg:gap-10">
                        <div>
                            <h3 className="text-2xl font-extrabold text-[#06152B] sm:text-3xl">
                                For Employers
                            </h3>
                            <p className="mt-3 text-sm leading-relaxed text-[#06152B]/60 sm:text-base">
                                Post office jobs, hire qualified administrative professionals,
                                and grow your team with ease. Reach thousands of job seekers
                                across Canada actively looking for office and administrative
                                roles.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                            {EMPLOYER_FEATURES.map(({ Icon, title, desc }) => (
                                <div key={title} className="rounded-xl border border-gray-100 bg-white p-5">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#06152B]/5">
                                        <Icon className="h-5 w-5 text-[#06152B]" />
                                    </span>
                                    <p className="mt-3 text-base font-bold text-[#06152B]">
                                        {title}
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed text-[#06152B]/60">
                                        {desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Testimonials */}
                <h3 className="mt-14 text-2xl font-extrabold text-[#06152B] sm:text-3xl">
                    What Our Users Say
                </h3>
                <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {TESTIMONIALS.map(({ quote, name, role, image }) => (
                        <div
                            key={name}
                            className="rounded-xl border border-gray-100 bg-white p-6 shadow-md shadow-black/5 ring-1 ring-black/5"
                        >
                            <div className="flex items-start gap-4">
                                <img
                                    src={image}
                                    alt={name}
                                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                                />
                                <p className="text-sm italic leading-relaxed text-[#06152B]/80">
                                    "{quote}"
                                </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                                <div>
                                    <p className="text-sm font-bold text-[#06152B]">
                                        {name}
                                    </p>
                                    <p className="text-xs text-[#06152B]/60">{role}</p>
                                </div>
                                <div className="flex gap-0.5 text-amber-500">
                                    <StarIcon className="h-4 w-4" />
                                    <StarIcon className="h-4 w-4" />
                                    <StarIcon className="h-4 w-4" />
                                    <StarIcon className="h-4 w-4" />
                                    <StarIcon className="h-4 w-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-10 flex justify-center">
                    <a
                        href="/post-job"
                        className="flex items-center justify-center gap-2 rounded-lg bg-[#06152B] px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a1f3d]"
                    >
                        <BriefcaseIcon className="h-4 w-4" />
                        Post a Job Today
                    </a>
                </div>
            </div>
        </section>
    )
}