import { NavLink } from 'react-router-dom'
import { type ReactElement } from 'react'
import logo from '../../assests/images/logo.png'

interface NavItem {
  to: string
  label: string
}

interface SocialLink {
  Icon: (props: { className?: string }) => ReactElement
  url: string
  label: string
}

// Inline SVG icons — replaces react-icons, no external dependency
function BriefcaseIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  )
}

function MailIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 6l-10 7L2 6" />
    </svg>
  )
}

function PhoneIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  )
}

function LocationMarkerIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function MapleLeafIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2 5 5-1-2 4 3 3-4 1 1 5-4-3-4 3 1-5-4-1 3-3-2-4 5 1z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12a10 10 0 10-11.6 9.87v-6.98H7.9V12h2.5V9.8c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.98A10 10 0 0022 12z" />
    </svg>
  )
}

function TwitterIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.94 5a2 2 0 11-4-.002 2 2 0 014 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.68-2.91V8.48z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

const quickLinks: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/browse', label: 'Browse Jobs' },
  { to: '/employers', label: 'Employers' },
  { to: '/about-us', label: 'About Us' },
  { to: '/contact-us', label: 'Contact Us' },
  { to: '/browse', label: 'Job Alerts' },
  { to: '/browse', label: 'Career Resources' },
]

const employerLinks: NavItem[] = [
  { to: '/post-a-job', label: 'Post a Job' },
  { to: '/employers', label: 'Browse Resumes' },
  { to: '/pricing', label: 'Employer Pricing' },
  { to: '/employers', label: 'Recruitment Solutions' },
  { to: '/post-a-job', label: 'Job Posting Tips' },
  { to: '/contact-us', label: 'Contact Sales' },
]

const socialLinks: SocialLink[] = [
  { Icon: FacebookIcon, url: 'https://facebook.com', label: 'Facebook' },
  { Icon: TwitterIcon, url: 'https://twitter.com', label: 'Twitter' },
  { Icon: LinkedInIcon, url: 'https://linkedin.com', label: 'LinkedIn' },
  { Icon: InstagramIcon, url: 'https://instagram.com', label: 'Instagram' },
]

export default function Footer() {
  const handleSocialClick = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <footer className="bg-[#06152B] text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div>
            <img src={logo} alt="Office Jobline" className="h-10 w-auto" />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Office Jobline connects employers with skilled office and administrative
              professionals across Canada. Post jobs, find top talent, and grow your
              team with ease.
            </p>
            <div className="mt-5 flex gap-3">
              {socialLinks.map(({ Icon, url, label }) => (
                <button
                  key={label}
                  onClick={() => handleSocialClick(url)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-[#d4af37] hover:text-[#06152B]"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              {quickLinks.map((l) => (
                <li key={l.label}>
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      `transition hover:text-[#d4af37] ${isActive ? 'text-[#d4af37]' : 'text-slate-400'}`
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* For Employers */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              For Employers
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              {employerLinks.map((l) => (
                <li key={l.label}>
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      `transition hover:text-[#d4af37] ${isActive ? 'text-[#d4af37]' : 'text-slate-400'}`
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact Us
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <LocationMarkerIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" />
                <span>1 Yonge Street, Suite 1801, Toronto, ON M5E 1W7</span>
              </li>
              <li className="flex items-center gap-2.5">
                <PhoneIcon className="h-4 w-4 shrink-0 text-[#d4af37]" />
                <span>1-888-555-0123</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MailIcon className="h-4 w-4 shrink-0 text-[#d4af37]" />
                <span>hello@officejobline.ca</span>
              </li>
              <li className="flex items-center gap-2.5">
                <BriefcaseIcon className="h-4 w-4 shrink-0 text-[#d4af37]" />
                <span>Mon - Fri: 8:00 AM - 6:00 PM EST</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-slate-500 sm:flex-row">
          <p className="flex items-center gap-2">
            <MapleLeafIcon className="h-4 w-4 text-[#d4af37]" />
            © {new Date().getFullYear()} Office Jobline. All rights reserved.
          </p>
          <div className="flex gap-6">
            <NavLink to="/privacy-policy" className="hover:text-[#d4af37]">Privacy Policy</NavLink>
            <NavLink to="/terms-of-service" className="hover:text-[#d4af37]">Terms of Service</NavLink>
            <NavLink to="/accessibility" className="hover:text-[#d4af37]">Accessibility</NavLink>
          </div>
        </div>
      </div>
    </footer>
  )
}