import React, { ReactNode } from "react";
import { Link } from "react-router-dom";
import logo from "../../assests/images/logo.png";

// NOTE: react-icons removed per monorepo rules (FiCheckCircle -> inline SVG below).
// Swap for a @jooblie/ui icon primitive if/when that package exposes one (§4 of the migration guide).

function CheckCircleIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12.5l2.5 2.5 4.5-5" />
        </svg>
    );
}

function BuildingIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
            <path d="M3 21V9l6-4v4l6-4v16H3zm2-2h2v-2H5v2zm0-4h2v-2H5v2zm0-4h2V9H5v2zm6 8h2v-2h-2v2zm0-4h2v-2h-2v2zm6 4h2v-9h-2v9zM18 2l1 2 2 .3-1.5 1.4.4 2.1L18 6.7 16.1 7.8l.4-2.1L15 4.3 17 4l1-2z" />
        </svg>
    );
}

const perks: string[] = [
    "Access thousands of office & administrative jobs",
    "Apply in one click with a saved profile",
    "Get alerts the moment new roles match you",
];

interface AuthLayoutProps {
    title: string;
    subtitle: string;
    children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Left branded panel */}
            <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0B1B3A] via-[#13284f] to-[#1a3566] p-10 text-white lg:flex xl:p-14">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-25"
                    style={{
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80')",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3A] via-[#0B1B3A]/70 to-[#0B1B3A]/40" />

                <Link to="/" className="relative flex items-center gap-2">
                    <img
                        src={logo}
                        className="h-16 w-auto"
                        alt="Office Jobline"
                    />
                </Link>

                <div className="relative">
                    <h2 className="text-3xl font-extrabold leading-tight xl:text-4xl">
                        Connecting job seekers and employers across Canada.
                    </h2>
                    <p className="mt-3 max-w-md text-slate-300">
                        Join thousands of professionals finding office and administrative careers with top
                        employers nationwide.
                    </p>
                    <ul className="mt-6 space-y-3">
                        {perks.map((p) => (
                            <li key={p} className="flex items-start gap-2 text-sm text-slate-200">
                                <CheckCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                                {p}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-xs text-slate-400">
                    © {new Date().getFullYear()} Office Jobline. All rights reserved.
                </p>
            </div>

            {/* Right form panel */}
            <div className="flex w-full flex-col justify-center px-4 py-10 sm:px-8 md:px-12 lg:w-[55%] lg:px-16 xl:px-24">
                <div className="mx-auto w-full max-w-md">
                    <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-amber-400">
                            <BuildingIcon className="h-6 w-6 text-amber-400" />
                        </div>
                        <span className="text-xl font-extrabold tracking-tight text-slate-900">
                            Office Jobline
                        </span>
                    </Link>

                    <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">{title}</h1>
                    <p className="mt-2 text-sm text-slate-500 sm:text-base">{subtitle}</p>
                    <div className="mt-8">{children}</div>
                </div>
            </div>
        </div>
    );
}