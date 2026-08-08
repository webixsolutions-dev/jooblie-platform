// src/data/about.ts
import type { FC, SVGProps } from "react";

type IconComponent = FC<SVGProps<SVGSVGElement>>;

interface AboutPillar {
  icon: IconComponent;
  title: string;
  desc: string;
}

interface AboutContent {
  title: string;
  subtitle: string;
  description1: string;
  description2: string;
  missionButton: string;
  image: string;
  imageAlt: string;
  whoWeAreTitle: string;
  whoWeAreDescription: string;
}

interface AboutStat {
  value: string;
  label: string;
  desc: string;
}

// Inline icon components (replacing react-icons/hi2, react-icons/gi)
const ShieldCheckIcon: IconComponent = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const UserGroupIcon: IconComponent = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const MapleLeafIcon: IconComponent = (props) => (
  <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M478.13 433.6l-79.9-14.9 22.6-59.4c3.3-8.7-2.7-18.1-12-18.1h-64.7l68.9-97.4c5.6-7.9-.1-18.8-9.7-18.8h-45.6l55.7-91.7c5.1-8.4-1-19.2-10.8-19.2h-31.3l31.6-64.4c4.7-9.6-2.3-20.7-13-20.7-3.3 0-6.5 1.1-9.1 3.1L256 96.9 132.9 33c-2.6-2-5.8-3.1-9.1-3.1-10.7 0-17.7 11.1-13 20.7l31.6 64.4h-31.3c-9.8 0-15.9 10.8-10.8 19.2l55.7 91.7h-45.6c-9.6 0-15.3 10.9-9.7 18.8l68.9 97.4H104c-9.3 0-15.3 9.4-12 18.1l22.6 59.4-79.9 14.9c-9.6 1.8-13.1 13.7-6.2 20.5l43.1 42.4c2.3 2.3 5.4 3.5 8.6 3.5.9 0 1.8-.1 2.7-.3l87.8-18.6-5.6 55.6c-.9 8.9 8 15.6 16.1 12.1l74.8-32.3 74.8 32.3c8.1 3.5 17-3.2 16.1-12.1l-5.6-55.6 87.8 18.6c.9.2 1.8.3 2.7.3 3.2 0 6.3-1.3 8.6-3.5l43.1-42.4c6.8-6.8 3.3-18.7-6.3-20.5z" />
  </svg>
);

export const aboutPillars: AboutPillar[] = [
  {
    icon: ShieldCheckIcon,
    title: "Trusted Office Job Board",
    desc: "Quality listings from verified employers across a wide range of office and administrative roles.",
  },
  {
    icon: MapleLeafIcon,
    title: "Canada-Wide Reach",
    desc: "Opportunities in cities, towns, and remote locations—connecting talent and employers nationwide.",
  },
  {
    icon: UserGroupIcon,
    title: "Built for Employers & Job Seekers",
    desc: "Powerful tools and resources that simplify hiring and help careers grow.",
  },
];

export const aboutContent: AboutContent = {
  title: "About Office Jobline",
  subtitle: "Connecting office talent with opportunities across Canada.",
  description1:
    "Office Jobline is Canada's dedicated platform for office and administrative professionals and the employers who hire them.",
  description2:
    "We make it easy to discover rewarding careers, connect with trusted employers, and build stronger teams—from coast to coast to coast.",
  missionButton: "Our Mission",
  image:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1400&q=80",
  imageAlt: "Office professionals collaborating around a laptop",
  whoWeAreTitle: "Who We Are",
  whoWeAreDescription:
    "We're more than a job board. Office Jobline is a Canadian platform built to support office professionals and the organizations that rely on them.",
};

export const aboutStats: AboutStat[] = [
  {
    value: "10,000+",
    label: "Active Jobs",
    desc: "Office and administrative positions across Canada",
  },
  {
    value: "2,000+",
    label: "Employers",
    desc: "Trusted companies hiring right now",
  },
  {
    value: "95%",
    label: "Satisfaction Rate",
    desc: "From employers and job seekers alike",
  },
];