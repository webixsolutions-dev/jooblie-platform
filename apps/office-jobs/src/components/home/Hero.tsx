import { useNavigate } from 'react-router-dom'
import { useState, type KeyboardEvent, type ReactElement } from 'react'

interface Stat {
    Icon: (props: { className?: string }) => ReactElement
    value: string
    label: string
    desc: string
    path: string
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

function MapPinIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
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

function MapleLeafIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2 5 5-1-2 4 3 3-4 1 1 5-4-3-4 3 1-5-4-1 3-3-2-4 5 1z" />
        </svg>
    )
}

function BuildingIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="4" y="2" width="16" height="20" rx="1" />
            <path strokeLinecap="round" d="M9 6h1M14 6h1M9 10h1M14 10h1M9 14h1M14 14h1M9 18h6" />
        </svg>
    )
}

function StarIcon({ className, half }: { className?: string; half?: boolean }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill={half ? 'url(#half-star)' : 'currentColor'}>
            {half && (
                <defs>
                    <linearGradient id="half-star">
                        <stop offset="50%" stopColor="currentColor" />
                        <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                </defs>
            )}
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    )
}

const STATS: Stat[] = [
    {
        Icon: BriefcaseIcon,
        value: '10,000+',
        label: 'Office Jobs',
        desc: 'New opportunities added every day',
        path: '/browse',
    },
    {
        Icon: UserGroupIcon,
        value: '2,000+',
        label: 'Employers',
        desc: 'Trusted companies hiring now',
        path: '/employers',
    },
    {
        Icon: MapleLeafIcon,
        value: 'Canada-Wide',
        label: 'Opportunities',
        desc: 'Find the right role wherever you are',
        path: '/browse',
    },
]

export default function Hero() {
    const navigate = useNavigate()
    const [searchKeyword, setSearchKeyword] = useState('')
    const [searchLocation, setSearchLocation] = useState('')

    const handleSearch = () => {
        if (searchKeyword.trim() || searchLocation.trim()) {
            navigate(`/browse?keyword=${encodeURIComponent(searchKeyword)}&location=${encodeURIComponent(searchLocation)}`)
        } else {
            navigate('/browse')
        }
    }

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const handleStatClick = (path: string) => {
        navigate(path)
    }

    const handleEmployersClick = () => {
        navigate('/employers')
    }

    return (
        <section id="home" className="bg-white">
            {/* Hero banner */}
            <div
                className="relative flex min-h-[70vh] flex-col justify-center overflow-hidden bg-offwhite py-8 sm:min-h-[75vh] sm:py-10 lg:min-h-[calc(99dvh-4rem)] lg:py-0"
                style={{
                    backgroundImage: `url("https://media.istockphoto.com/id/2217361086/photo/businesswomen-shaking-hands-while-attending-a-conference-meeting.webp?a=1&b=1&s=612x612&w=0&k=20&c=lNbHeugtq08AhQa6nPZxXlsPQaKb8ThnEByC6QHorjE=")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-white/90 via-white/60 to-transparent lg:w-2/5" />

                <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 px-4 sm:gap-8 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8">
                    <div className="relative z-10">
                        <h1 className="font-display text-2xl font-extrabold leading-tight text-[#06152B] sm:text-3xl md:text-4xl lg:text-5xl xl:text-[3.2rem]">
                            Find Office &amp; Administrative Jobs Across Canada
                        </h1>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-navy/80 sm:mt-4 sm:text-base lg:mt-5 lg:text-lg">
                            Explore office jobs, administrative jobs, receptionist jobs,
                            executive assistant jobs, office coordinator roles, data entry
                            jobs, customer service office roles, and more. Connect with top
                            employers hiring across Canada today.
                        </p>
                    </div>
                </div>

                {/* Search bar */}
                <div className="relative z-10 mx-auto mt-6 w-full max-w-7xl px-4 sm:mt-8 sm:px-6 lg:mt-10 lg:px-8">
                    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 sm:flex-row sm:items-center sm:rounded-full lg:max-w-3xl">
                        <div className="flex flex-1 items-center gap-3 px-5 py-3.5 sm:py-4">
                            <SearchIcon className="h-5 w-5 shrink-0 text-navy/40" />
                            <input
                                type="text"
                                placeholder="Job title, keyword or company"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="w-full bg-transparent text-sm text-navy placeholder:text-navy/40 focus:outline-none"
                            />
                        </div>

                        <div className="hidden h-8 w-px shrink-0 bg-gray-200 sm:block" />
                        <div className="block h-px w-full bg-gray-200 sm:hidden" />

                        <div className="flex flex-1 items-center gap-3 px-5 py-3.5 sm:py-4">
                            <MapPinIcon className="h-5 w-5 shrink-0 text-navy/40" />
                            <input
                                type="text"
                                placeholder="City, province or region"
                                value={searchLocation}
                                onChange={(e) => setSearchLocation(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="w-full bg-transparent text-sm text-navy placeholder:text-navy/40 focus:outline-none"
                            />
                        </div>

                        <button
                            onClick={handleSearch}
                            className="flex items-center justify-center gap-2 bg-gold-500 px-6 py-3.5 text-sm font-semibold text-navy transition-colors hover:bg-gold-400 sm:py-4 sm:pl-6 sm:pr-6"
                        >
                            <SearchIcon className="h-4 w-4" />
                            Search Jobs
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {STATS.map(({ Icon, value, label, desc, path }) => (
                        <div
                            key={label}
                            onClick={() => handleStatClick(path)}
                            className="flex cursor-pointer items-start gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-md shadow-black/5 ring-1 ring-black/5 transition-all hover:shadow-lg hover:shadow-black/10 hover:scale-[1.02]"
                        >
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#06152B]/5">
                                <Icon className="h-6 w-6 text-[#06152B]" />
                            </span>
                            <div>
                                <p className="text-xl font-extrabold text-[#06152B]">{value}</p>
                                <p className="text-sm font-semibold text-[#06152B]">{label}</p>
                                <p className="mt-1 text-sm text-[#06152B]/60">{desc}</p>
                            </div>
                        </div>
                    ))}

                    {/* Ratings card */}
                    <div className="relative flex flex-col justify-center overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-md shadow-black/5 ring-1 ring-black/5">
                        <MapleLeafIcon className="pointer-events-none absolute -right-2 -bottom-4 h-24 w-24 text-[#06152B]/5" />
                        <p className="text-sm text-[#06152B]/60">Trusted by job seekers across Canada</p>
                        <div className="mt-2 flex items-center gap-2">
                            <div className="flex text-[#06152B]">
                                <StarIcon className="h-4 w-4" />
                                <StarIcon className="h-4 w-4" />
                                <StarIcon className="h-4 w-4" />
                                <StarIcon className="h-4 w-4" />
                                <StarIcon className="h-4 w-4" half />
                            </div>
                            <span className="text-sm font-semibold text-[#06152B]">4.6/5</span>
                        </div>
                        <p className="mt-1 text-sm text-[#06152B]/60">Based on thousands of reviews</p>
                    </div>
                </div>

                {/* Employers banner */}
                <div className="mt-6 flex flex-col items-start gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-md shadow-black/5 ring-1 ring-black/5 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="flex items-center gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#06152B]">
                            <BuildingIcon className="h-7 w-7 text-white" />
                        </span>
                        <div>
                            <p className="text-lg font-bold text-[#06152B]">
                                Employers: Hire Office Talent That Drives Success
                            </p>
                            <p className="mt-1 text-sm text-[#06152B]/60">
                                Post your jobs, reach qualified office professionals, and grow your team with ease.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleEmployersClick}
                        className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#06152B] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0a1f3d] sm:w-auto"
                    >
                        Learn More for Employers
                        <ArrowRightIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </section>
    )
}