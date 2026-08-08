import { useNavigate } from "react-router-dom";
import { aboutPillars, aboutContent, aboutStats } from "../../data/about";

export default function AboutHero() {
    const navigate = useNavigate();

    const handleMissionClick = () => {
        navigate("/about-us");
    };

    return (
        <section id="about" className="bg-white">
            {/* Hero banner */}
            <div className="bg-offwhite">
                <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-20">
                    <div>
                        <h1 className="font-display text-4xl font-extrabold leading-tight text-[#06152B] sm:text-5xl lg:text-[3.2rem]">
                            {aboutContent.title}
                        </h1>
                        <p className="mt-4 text-lg font-semibold text-teal">
                            {aboutContent.subtitle}
                        </p>
                        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
                            {aboutContent.description1}
                        </p>
                        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                            {aboutContent.description2}
                        </p>
                        <button
                            onClick={handleMissionClick}
                            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-teal px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
                        >
                            {aboutContent.missionButton}
                            {/* Arrow-right icon (was FiArrowRight) */}
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </button>
                    </div>

                    <div className="h-72 w-full overflow-hidden rounded-2xl sm:h-96 lg:h-[420px]">
                        <img
                            src={aboutContent.image}
                            alt={aboutContent.imageAlt}
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>
            </div>

            {/* Who We Are */}
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center text-center">
                    <div className="flex w-full max-w-md items-center gap-4">
                        <span className="h-px flex-1 bg-gold" />
                        {/* Building-office icon (was HiOutlineBuildingOffice2) */}
                        <svg
                            className="h-7 w-7 shrink-0 text-gold"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M3 21h18" />
                            <path d="M5 21V7l7-4 7 4v14" />
                            <path d="M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
                        </svg>
                        <span className="h-px flex-1 bg-gold" />
                    </div>
                    <h2 className="mt-6 font-display text-3xl font-extrabold text-[#06152B] sm:text-4xl">
                        {aboutContent.whoWeAreTitle}
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#06152B]/60 sm:text-lg">
                        {aboutContent.whoWeAreDescription}
                    </p>
                </div>

                <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
                    {aboutPillars.map(({ icon: Icon, title, desc }) => (
                        <div
                            key={title}
                            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                                <Icon className="h-6 w-6 text-gold-600" />
                            </span>
                            <p className="mt-4 font-display text-base font-bold text-[#06152B]">
                                {title}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-[#06152B]/60">
                                {desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Stats Section */}
                {aboutStats && aboutStats.length > 0 && (
                    <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {aboutStats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm"
                            >
                                <p className="text-3xl font-extrabold text-[#06152B]">{stat.value}</p>
                                <p className="mt-1 text-sm font-semibold text-[#06152B]">{stat.label}</p>
                                <p className="mt-1 text-xs text-[#06152B]/50">{stat.desc}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-14 flex items-center gap-4">
                    <span className="h-px flex-1 bg-gold" />
                    {/* Maple leaf icon (was GiMapleLeaf) */}
                    <svg
                        className="h-5 w-5 shrink-0 text-gold"
                        viewBox="0 0 512 512"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="M478.13 433.6l-79.9-14.9 22.6-59.4c3.3-8.7-2.7-18.1-12-18.1h-64.7l68.9-97.4c5.6-7.9-.1-18.8-9.7-18.8h-45.6l55.7-91.7c5.1-8.4-1-19.2-10.8-19.2h-31.3l31.6-64.4c4.7-9.6-2.3-20.7-13-20.7-3.3 0-6.5 1.1-9.1 3.1L256 96.9 132.9 33c-2.6-2-5.8-3.1-9.1-3.1-10.7 0-17.7 11.1-13 20.7l31.6 64.4h-31.3c-9.8 0-15.9 10.8-10.8 19.2l55.7 91.7h-45.6c-9.6 0-15.3 10.9-9.7 18.8l68.9 97.4H104c-9.3 0-15.3 9.4-12 18.1l22.6 59.4-79.9 14.9c-9.6 1.8-13.1 13.7-6.2 20.5l43.1 42.4c2.3 2.3 5.4 3.5 8.6 3.5.9 0 1.8-.1 2.7-.3l87.8-18.6-5.6 55.6c-.9 8.9 8 15.6 16.1 12.1l74.8-32.3 74.8 32.3c8.1 3.5 17-3.2 16.1-12.1l-5.6-55.6 87.8 18.6c.9.2 1.8.3 2.7.3 3.2 0 6.3-1.3 8.6-3.5l43.1-42.4c6.8-6.8 3.3-18.7-6.3-20.5z" />
                    </svg>
                    <span className="h-px flex-1 bg-gold" />
                </div>
            </div>
        </section>
    );
}