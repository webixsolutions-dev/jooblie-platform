import type { FC, SVGProps } from "react";
import { useNavigate } from "react-router-dom";

type IconComponent = FC<SVGProps<SVGSVGElement>>;

interface ContactCard {
  icon: IconComponent;
  title: string;
  desc: string;
  email: string;
}

interface SocialLink {
  icon: IconComponent;
  label: string;
}

// Inline icon components (replacing react-icons/fi, react-icons/hi2, react-icons/gi, react-icons/fa)
const SearchIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

const MapPinIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const PhoneIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const ClockIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const HeadphonesIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M3 18v-6a9 9 0 0118 0v6" />
    <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
  </svg>
);

const BuildingOffice2Icon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
  </svg>
);

const MapleLeafIcon: IconComponent = (props) => (
  <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M478.13 433.6l-79.9-14.9 22.6-59.4c3.3-8.7-2.7-18.1-12-18.1h-64.7l68.9-97.4c5.6-7.9-.1-18.8-9.7-18.8h-45.6l55.7-91.7c5.1-8.4-1-19.2-10.8-19.2h-31.3l31.6-64.4c4.7-9.6-2.3-20.7-13-20.7-3.3 0-6.5 1.1-9.1 3.1L256 96.9 132.9 33c-2.6-2-5.8-3.1-9.1-3.1-10.7 0-17.7 11.1-13 20.7l31.6 64.4h-31.3c-9.8 0-15.9 10.8-10.8 19.2l55.7 91.7h-45.6c-9.6 0-15.3 10.9-9.7 18.8l68.9 97.4H104c-9.3 0-15.3 9.4-12 18.1l22.6 59.4-79.9 14.9c-9.6 1.8-13.1 13.7-6.2 20.5l43.1 42.4c2.3 2.3 5.4 3.5 8.6 3.5.9 0 1.8-.1 2.7-.3l87.8-18.6-5.6 55.6c-.9 8.9 8 15.6 16.1 12.1l74.8-32.3 74.8 32.3c8.1 3.5 17-3.2 16.1-12.1l-5.6-55.6 87.8 18.6c.9.2 1.8.3 2.7.3 3.2 0 6.3-1.3 8.6-3.5l43.1-42.4c6.8-6.8 3.3-18.7-6.3-20.5z" />
  </svg>
);

const LinkedInIcon: IconComponent = (props) => (
  <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M100.28 448H7.4V148.9h92.88zm-46.44-341C24.09 107 0 82.87 0 53.19a53.19 53.19 0 01106.38 0c0 29.68-24.1 53.81-53.14 53.81zM447.9 448h-92.68V302.4c0-34.7-.7-79.34-48.31-79.34-48.34 0-55.75 37.75-55.75 76.77V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.28 61.9 111.28 142.3V448z" />
  </svg>
);

const FacebookIcon: IconComponent = (props) => (
  <svg viewBox="0 0 320 512" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
  </svg>
);

const InstagramIcon: IconComponent = (props) => (
  <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.2 9s-102.7 2.6-132.2-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.2s-2.6-102.7 9-132.2c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.2-9s102.7-2.6 132.2 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.2s2.7 102.7-9 132.2z" />
  </svg>
);

const YoutubeIcon: IconComponent = (props) => (
  <svg viewBox="0 0 576 512" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M549.7 124.1c-6.3-23.7-24.8-42.3-48.3-48.6C458.8 64 288 64 288 64S117.2 64 74.6 75.5c-23.5 6.3-42 24.9-48.3 48.6-11.4 42.9-11.4 132.3-11.4 132.3s0 89.4 11.4 132.3c6.3 23.7 24.8 41.5 48.3 47.8C117.2 448 288 448 288 448s170.8 0 213.4-11.5c23.5-6.3 42-24.1 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zm-317.5 213.5V175.2l142.7 81.2-142.7 81.2z" />
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

const QUICK_LINKS: string[] = [
  "Browse Jobs",
  "Employers",
  "About Us",
  "Contact Us",
  "Career Resources",
];

const EMPLOYER_LINKS: string[] = [
  "Post a Job",
  "Browse Resumes",
  "Hiring Solutions",
  "Pricing",
  "Employer Support",
];

const SOCIALS: SocialLink[] = [
  { icon: LinkedInIcon, label: "LinkedIn" },
  { icon: FacebookIcon, label: "Facebook" },
  { icon: InstagramIcon, label: "Instagram" },
  { icon: YoutubeIcon, label: "YouTube" },
];

export default function AboutCTAFooter() {
  const navigate = useNavigate();

  const handleBrowseJobs = () => {
    navigate("/browse");
  };

  const handlePostJob = () => {
    navigate("/post-a-job");
  };

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* CTA banner - Navy background with gold accent */}
        <div className="relative overflow-hidden rounded-2xl bg-[#1a2a4a] px-6 py-14 text-center sm:px-10">
          <BuildingOffice2Icon className="pointer-events-none absolute -right-6 bottom-0 hidden h-64 w-64 text-white/5 sm:block" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
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
  );
}