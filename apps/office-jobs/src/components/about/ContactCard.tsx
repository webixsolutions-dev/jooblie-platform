import type { FC, SVGProps } from "react";

type IconComponent = FC<SVGProps<SVGSVGElement>>;

interface ContactCard {
  icon: IconComponent;
  title: string;
  desc: string;
  email: string;
}

// Inline icon components (replacing react-icons/fi)
const HeadphonesIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M3 18v-6a9 9 0 0118 0v6" />
    <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
  </svg>
);

const BriefcaseIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
  </svg>
);

const MailIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const ArrowRightIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const CONTACT_CARDS: ContactCard[] = [
  {
    icon: HeadphonesIcon,
    title: "Job Seeker Support",
    desc: "Need help with your account, applications, or career resources?",
    email: "support@officejobline.ca",
  },
  {
    icon: BriefcaseIcon,
    title: "Employer Support",
    desc: "Get assistance with postings, plans, or finding the right talent.",
    email: "employers@officejobline.ca",
  },
  {
    icon: MailIcon,
    title: "General Inquiries",
    desc: "Have a question or feedback? We'd love to hear from you.",
    email: "info@officejobline.ca",
  },
];

export default function ContactCards() {
  return (
    <div className="mx-auto mt-8 max-w-5xl px-4 sm:mt-10 sm:px-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
        {CONTACT_CARDS.map(({ icon: Icon, title, desc, email }) => (
          <div
            key={title}
            className="rounded-xl bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md sm:text-left"
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#ccfbf1] sm:mx-0">
              <Icon className="h-6 w-6 text-[#0d9488]" />
            </span>
            <p className="mt-4 font-display text-base font-bold text-[#1a2a4a]">
              {title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              {desc}
            </p>
            <a
              href={`mailto:${email}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#0d9488] hover:text-[#0f766e]"
            >
              {email}
              <ArrowRightIcon className="h-4 w-4 shrink-0" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}