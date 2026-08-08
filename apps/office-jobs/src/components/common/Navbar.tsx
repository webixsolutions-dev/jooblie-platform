import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import logo from '../../assests/images/logo.png'

interface NavItem {
  to: string
  label: string
}

const links: NavItem[] = [
  { to: '/', label: 'Home' },
  { to: '/browse', label: 'Browser Jobs' },
  { to: '/employers', label: 'Employers' },
  { to: '/about-us', label: 'About Us' },
  { to: '/contact-us', label: 'Contact Us' },
]

// Inline SVG icons — no external icon dependency
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

function LoginIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'bg-navy-950/95 shadow-lg shadow-black/20 backdrop-blur' : 'bg-navy-950'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0" onClick={() => setOpen(false)}>
     <img src={logo} className="h-10 w-auto" alt="Office Jobline logo" />
        </NavLink>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-gold-500' : 'text-slate-200 hover:text-gold-400'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <NavLink
            to="/post-a-job"
            className="flex items-center gap-2 rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-950 shadow-sm transition hover:bg-gold-400 hover:shadow-md"
          >
            <BriefcaseIcon className="h-4 w-4" />
            Post a Job
          </NavLink>
          <NavLink
            to="/signin"
            className="flex items-center gap-2 rounded-md border-2 border-amber-400/60 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-amber-400 hover:bg-amber-400/10 hover:shadow-md"
          >
            <LoginIcon className="h-4 w-4" />
            Sign In
          </NavLink>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-md p-2 text-slate-200 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <CloseIcon className="h-7 w-7" /> : <MenuIcon className="h-7 w-7" />}
        </button>
      </nav>

      {/* Mobile menu — CSS transition instead of Framer Motion */}
      <div
        className={`overflow-hidden border-t border-white/10 bg-navy-950 transition-all duration-300 ease-in-out lg:hidden ${
          open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex flex-col gap-1 px-4 py-4 sm:px-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-md px-3 py-2.5 text-base font-medium ${
                  isActive ? 'bg-white/5 text-gold-500' : 'text-slate-200 hover:bg-white/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/post-a-job"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 mt-2 rounded-md bg-gold-500 px-4 py-2.5 text-center text-base font-semibold text-navy-950"
          >
            <BriefcaseIcon className="h-5 w-5" />
            Post a Job
          </NavLink>
          <NavLink
            to="/signin"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 mt-2 rounded-md border-2 border-amber-400/60 px-4 py-2.5 text-center text-base font-semibold text-white"
          >
            <LoginIcon className="h-5 w-5" />
            Sign In
          </NavLink>
        </div>
      </div>
    </header>
  )
}