import React from "react";
import type { FC, SVGProps, ReactNode } from "react";

type IconComponent = FC<SVGProps<SVGSVGElement>>;

// Inline icon components (replacing react-icons/fi)
const MailIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const PhoneIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

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

interface ReachCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  email: string;
  phone: string;
}

const ReachCard: FC<ReachCardProps> = ({ icon, title, children, email, phone }) => (
  <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B1B3A] text-amber-400">
      {icon}
    </div>
    <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{children}</p>
    <div className="mt-5 space-y-2 border-t border-slate-100 pt-5">
      <a
        href={`mailto:${email}`}
        className="flex items-center gap-2 text-sm font-semibold text-amber-500"
      >
        <MailIcon className="h-4 w-4 flex-shrink-0 text-slate-400" /> {email}
      </a>
      <a
        href={`tel:${phone.replace(/\D/g, "")}`}
        className="flex items-center gap-2 text-sm font-semibold text-amber-500"
      >
        <PhoneIcon className="h-4 w-4 flex-shrink-0 text-slate-400" /> {phone}
      </a>
      <p className="pt-1 text-xs text-slate-400">Mon – Fri, 9:00 AM – 5:00 PM ET</p>
    </div>
  </div>
);

export default function WaysToReachUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="text-sm font-bold tracking-widest text-amber-500">CONTACT US</span>
      <h1 className="mt-3 text-4xl font-extrabold text-slate-900 sm:text-5xl">Ways to Reach Us</h1>
      <p className="mt-4 max-w-2xl text-slate-500">
        We're here to help. Reach out to Office Jobline for office jobs, administrative
        careers, and employer hiring support across Canada.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <ReachCard
          icon={<MailIcon className="h-6 w-6" />}
          title="General Inquiries"
          email="info@officejobline.com"
          phone="+1 (647) 555-0198"
        >
          Questions about Office Jobline, our services, or how we can help.
        </ReachCard>
        <ReachCard
          icon={<UserIcon className="h-6 w-6" />}
          title="Job Seeker Support"
          email="support@officejobline.com"
          phone="+1 (647) 555-0198"
        >
          Get help with job searching, applications, and your account.
        </ReachCard>
        <ReachCard
          icon={<BriefcaseIcon className="h-6 w-6" />}
          title="Employer Support"
          email="employers@officejobline.com"
          phone="+1 (647) 555-0198"
        >
          Assistance with posting jobs, account management, and hiring.
        </ReachCard>
      </div>
    </section>
  );
}