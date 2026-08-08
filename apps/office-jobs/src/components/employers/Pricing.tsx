import { useNavigate } from 'react-router-dom'
import { type ReactElement } from 'react'

interface Plan {
  name: string
  desc: string
  price: string
  featured: boolean
  features: string[]
  cta: string
  path: string
}

interface Testimonial {
  quote: string
  Icon: (props: { className?: string }) => ReactElement
  company: string
  location: string
  path: string
}

// Inline SVG icons — replaces react-icons, no external dependency
function CheckIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
    </svg>
  )
}

function QuoteRightIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 17h3l2-4V7h-6v6h3zm-8 0h3l2-4V7H5v6h3z" />
    </svg>
  )
}

function StarIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function LandmarkIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M5 6l7-4 7 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
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

const plans: Plan[] = [
  {
    name: 'Starter',
    desc: 'Perfect for small teams getting started.',
    price: '149',
    featured: false,
    features: [
      '3 Job Posts Included',
      '30-Day Applicant Access',
      'Standard Job Listing',
      'Employer Dashboard Access',
      'Email Support',
    ],
    cta: 'Get Started',
    path: '/signup',
  },
  {
    name: 'Growth',
    desc: 'Ideal for growing businesses.',
    price: '299',
    featured: true,
    features: [
      '10 Job Posts Included',
      '60-Day Applicant Access',
      'Featured Job Listing',
      'Employer Dashboard Access',
      'Priority Email Support',
    ],
    cta: 'Get Started',
    path: '/signup',
  },
  {
    name: 'Enterprise',
    desc: 'For companies with ongoing hiring needs.',
    price: '599',
    featured: false,
    features: [
      'Unlimited Job Posts',
      '90-Day Applicant Access',
      'Featured Company Profile',
      'Advanced Dashboard & Analytics',
      'Priority Phone & Email Support',
    ],
    cta: 'Contact Sales',
    path: '/contact-us',
  },
]

const testimonials: Testimonial[] = [
  {
    quote:
      "Office Jobline has made hiring office staff so much easier. We found great candidates quickly and the process was seamless from start to finish.",
    Icon: MapleLeafIcon,
    company: 'Maple Leaf Consulting',
    location: 'Toronto, ON',
    path: '/employers',
  },
  {
    quote:
      "We've hired outstanding administrative professionals through Office Jobline. Their platform is easy to use and the support team is fantastic.",
    Icon: LandmarkIcon,
    company: 'Prairie Business Group',
    location: 'Calgary, AB',
    path: '/employers',
  },
]

export default function Pricing() {
  const navigate = useNavigate()

  const handlePlanClick = (path: string) => {
    navigate(path)
  }

  const handleTestimonialClick = (path: string) => {
    navigate(path)
  }

  return (
    <section className="w-full bg-slate-50 py-16" id="employer-pricing">
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Simple Pricing for Office Hiring
          </h2>
          <p className="mx-auto max-w-2xl text-slate-600">
            Choose the right plan to hire office staff, administrative
            professionals, and support teams across Canada.
          </p>
          <p className="text-slate-600">Transparent pricing. No hidden fees. Cancel anytime.</p>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`flex flex-col overflow-hidden rounded-2xl bg-white transition-shadow duration-300 ${
                plan.featured
                  ? 'border-2 border-[#005F5A] shadow-xl lg:-translate-y-3'
                  : 'border border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.featured && (
                <div className="bg-[#005F5A] py-2.5 text-center text-sm font-semibold tracking-wide text-white">
                  Most Popular
                </div>
              )}
              <div className="flex h-full flex-col p-8">
                <h3 className="mb-1.5 text-2xl font-bold text-[#005F5A]">
                  {plan.name}
                </h3>
                <p className="mb-6 text-sm text-slate-500">{plan.desc}</p>
                <div className="mb-6 flex items-end gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                    ${plan.price}
                  </span>
                  <span className="mb-1.5 text-sm text-slate-500">/month</span>
                </div>
                <hr className="mb-6 border-slate-200" />
                <ul className="mb-8 flex-1 space-y-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#005F5A]/10">
                        <CheckIcon className="h-3 w-3 text-[#005F5A]" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePlanClick(plan.path)}
                  className={`w-full rounded-lg py-3.5 text-sm font-semibold transition-all duration-200 ${
                    plan.featured
                      ? 'bg-[#005F5A] text-white shadow-md shadow-[#005F5A]/20 hover:bg-[#004a46] hover:shadow-lg hover:shadow-[#005F5A]/30'
                      : 'border-2 border-[#005F5A] text-[#005F5A] hover:bg-[#005F5A] hover:text-white'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-xl bg-slate-100 px-6 py-12 sm:px-10">
          <div className="mb-10 text-center">
            <h3 className="mb-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Trusted by Canadian Employers
            </h3>
            <p className="text-slate-600">
              Join thousands of organizations that trust Office Jobline to hire top
              office talent.
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <div
                key={t.company}
                onClick={() => handleTestimonialClick(t.path)}
                className="cursor-pointer rounded-lg bg-white p-6 shadow-sm transition hover:scale-[1.02] hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <StarIcon key={s} className="h-4 w-4" />
                    ))}
                  </div>
                  <QuoteRightIcon className="h-5 w-5 text-[#005F5A]" />
                </div>
                <p className="mb-6 text-sm text-slate-700">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <t.Icon className="h-5 w-5 text-[#005F5A]" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.company}</p>
                    <p className="text-xs text-slate-500">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-600">
            Hire with confidence. Post jobs, connect with qualified office
            professionals, and grow your business across Canada.
          </p>

          <MapleLeafIcon className="absolute bottom-4 right-4 hidden h-24 w-24 text-[#005F5A]/10 sm:block" />
        </div>
      </div>
    </section>
  )
}