import React, { useState } from "react";
import type { FC, SVGProps, ReactNode } from "react";

type IconComponent = FC<SVGProps<SVGSVGElement>>;

// Inline icon components (replacing react-icons/fi, react-icons/fa)
const UserIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BriefcaseIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
);

const MessageCircleIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
  </svg>
);

const UsersIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const MailIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const CheckCircleIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ChevronDownIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const HandshakeIcon: IconComponent = (props) => (
  <svg viewBox="0 0 640 512" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M323.4 85.2l-96.8 78.4c-16.1 13-19.2 36.4-7 53.1 12.9 17.8 38 21.3 55.3 7.8l99.3-77.2c6.3-4.9 15.4-3.7 20.3 2.7 4.8 6.3 3.7 15.4-2.6 20.3l-32.6 25.4 103.9 88.9c2.4 2 4.5 4.3 6.4 6.7l64.4-49.1c19.6-15 23.7-43 9-62.7l-58.5-79c-27.2-36.8-70.3-58.5-116-58.5H323.4zm-152.8 34.2c-.4.3-.7.6-1.1.9l-31.9 24.3-64.4-49.1c-19.6-15-47.6-11-62.7 8.6L1.5 173C-13.5 192.5-9.5 220.5 10.1 235.5l64.5 49.2c-.5-6.2.2-12.6 2.4-18.8 3.3-9.9 9.7-18.3 18.4-24.1L96 240l4.4-3.4c-14.5-32.6-4.7-72.1 25.5-93.6l1.9-1.3 42.8-32.9-31.1 21c-8.5 5.7-19.9 3.5-25.6-5-5.7-8.5-3.5-19.9 5-25.6zM152 464l-90.7-71.2c-6.4-5-8.7-13.7-5.5-21.2 3.9-9.1 14.9-12.9 23.6-8.2l100.4 54.3c19.1 10.3 42.7 6.8 57.9-8.7l4.8-4.9c11.6-11.8 11.6-30.7 0-42.5l-108.8-93c-4.4-3.8-10.4-4.9-15.8-2.9L20.4 305.7C7.9 310.4 0 322.4 0 335.8v6.9c0 12.5 5.7 24.3 15.5 32.1L134.7 468c25.9 20.8 62.8 20.8 88.7 0l4.6-3.7c-11.7-8.9-59.5-46.4-76-59.7z" />
  </svg>
);

interface HelpCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  points: string[];
  cta: string;
  ctaIcon: ReactNode;
}

const HelpCard: FC<HelpCardProps> = ({ icon, title, children, points, cta, ctaIcon }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B1B3A] text-amber-400">
      {icon}
    </div>
    <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{children}</p>
    <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5">
      {points.map((p) => (
        <li key={p} className="flex items-center gap-2 text-sm text-slate-600">
          <CheckCircleIcon className="h-4 w-4 flex-shrink-0 text-amber-500" /> {p}
        </li>
      ))}
    </ul>
    <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1B3A] py-3 text-sm font-semibold text-white transition hover:bg-[#132a56]">
      {ctaIcon} {cta}
    </button>
  </div>
);

const faqs: string[] = [
  "How can I contact support?",
  "How do I post a job on Office Jobline?",
  "I need help with my application. What should I do?",
  "How long does it take to get a response?",
];

interface FaqItemProps {
  question: string;
}

const FaqItem: FC<FaqItemProps> = ({ question }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-semibold text-slate-800"
      >
        {question}
        <ChevronDownIcon
          className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-6 pb-4 text-sm text-slate-500">
          Our team typically responds within one business day. Reach out via the contact
          options above and we'll route you to the right person.
        </div>
      )}
    </div>
  );
};

export default function NeedHelpSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="text-sm font-bold tracking-widest text-amber-500">CONTACT US</span>
      <h1 className="mt-3 text-4xl font-extrabold text-slate-900 sm:text-5xl">
        Need Help With Something Specific?
      </h1>
      <p className="mt-4 max-w-2xl text-slate-500">
        Choose the option that best fits your needs. Our team is here to provide the right
        support and connect you with the right person.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <HelpCard
          icon={<UserIcon className="h-6 w-6" />}
          title="For Job Seekers"
          points={["Application assistance", "Account and profile support", "Job search tips and guidance"]}
          cta="Contact Support"
          ctaIcon={<MessageCircleIcon className="h-4 w-4" />}
        >
          Get help with job search, applications, account issues, and more.
        </HelpCard>
        <HelpCard
          icon={<BriefcaseIcon className="h-6 w-6" />}
          title="For Employers"
          points={["Post a job or edit a listing", "Account and billing support", "Employer onboarding help"]}
          cta="Talk to Sales"
          ctaIcon={<UsersIcon className="h-4 w-4" />}
        >
          Get support with posting jobs, managing listings, and finding the right talent.
        </HelpCard>
        <HelpCard
          icon={<HandshakeIcon className="h-6 w-6" />}
          title="Partnerships & Media"
          points={["Partnership inquiries", "Press and media requests", "Sponsorship opportunities"]}
          cta="Send Inquiry"
          ctaIcon={<MailIcon className="h-4 w-4" />}
        >
          For partnership opportunities, media inquiries, or brand collaborations.
        </HelpCard>
      </div>

      <div className="mt-16">
        <span className="text-sm font-bold tracking-widest text-amber-500">FAQ</span>
        <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
        <div className="mt-6 space-y-3">
          {faqs.map((q) => (
            <FaqItem key={q} question={q} />
          ))}
        </div>
      </div>
    </section>
  );
}