import { Container } from "../components/Container";

// PLACEHOLDER — swap with verified client content before production.
const CONTACT_CONTENT = {
  hero: {
    eyebrow: "Contact Jooblie",
    heading: "Get in touch.",
    lead: "Questions about a job posting, your account, partnerships or using Jooblie? Reach the right team below.",
  },
  methods: {
    eyebrow: "Contact options",
    heading: "Start with the team that fits your question.",
    cards: [
      {
        icon: "employers",
        title: "Employers",
        email: "employers@jooblie.ca",
        note: "Posting, billing and employer account support. Typical reply within 1 business day.",
      },
      {
        icon: "seekers",
        title: "Job seekers",
        email: "support@jooblie.ca",
        note: "Account access, applications and job-search questions. Typical reply within 1 business day.",
      },
      {
        icon: "general",
        title: "General inquiries",
        email: "hello@jooblie.ca",
        note: "Product questions, feedback and general information. Typical reply within 2 business days.",
      },
      {
        icon: "partnerships",
        title: "Partnerships",
        email: "partners@jooblie.ca",
        note: "Community, recruitment and platform partnerships. Typical reply within 2 business days.",
      },
    ],
  },
  office: {
    eyebrow: "Office details",
    heading: "Helpful before you message.",
    intro:
      "Jooblie serves employers and job seekers across Canada. These details can remain generic until your final office information is confirmed.",
    details: [
      {
        icon: "hours",
        title: "Office hours",
        lines: ["Monday–Friday", "9:00 a.m.–5:00 p.m. ET"],
      },
      {
        icon: "location",
        title: "Location",
        lines: [
          "Toronto, Ontario, Canada",
          "Serving employers nationwide",
        ],
      },
    ],
  },
  form: {
    eyebrow: "Send us a message",
    heading: "How can we help?",
    fields: {
      name: {
        label: "Full Name",
        placeholder: "Alex Martin",
      },
      email: {
        label: "Email",
        placeholder: "alex@example.ca",
      },
      phone: {
        label: "Phone",
        placeholder: "(416) 555-0186",
      },
      subject: {
        label: "Subject",
        placeholder: "Select a topic",
        options: [
          "Employer support",
          "Job seeker support",
          "Partnership",
          "General inquiry",
        ],
      },
      message: {
        label: "Message",
        placeholder:
          "Tell us what you need help with, including any relevant job posting or account details.",
      },
    },
    note: "This form is a visual preview only and does not submit or send data.",
    button: "Send Message",
  },
  faq: {
    eyebrow: "Quick answers",
    heading: "Frequently asked questions.",
    items: [
      {
        question: "How quickly will Jooblie respond?",
        answer:
          "Most support requests are answered within one business day. Partnership and general inquiries may take up to two business days.",
      },
      {
        question: "I found a problem with a job posting. What should I send?",
        answer:
          "Include the job title, employer name, listing link and a brief description of the issue so the team can review it efficiently.",
      },
      {
        question: "Can employers get help with posting jobs?",
        answer:
          "Yes. Employer support can help with posting questions, account access and basic guidance on presenting an opening clearly.",
      },
      {
        question: "Does Jooblie support job seekers across Canada?",
        answer:
          "Yes. The platform is intended to surface opportunities across provinces and territories, subject to available employer listings.",
      },
    ],
  },
} as const;

type ContactIcon =
  | (typeof CONTACT_CONTENT.methods.cards)[number]["icon"]
  | (typeof CONTACT_CONTENT.office.details)[number]["icon"];

function ContactCardIcon({ icon }: { readonly icon: ContactIcon }) {
  const commonProps = {
    className: "size-6",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  return (
    <div
      aria-hidden="true"
      className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
    >
      {icon === "employers" ? (
        <svg {...commonProps}>
          <path d="M4 7h16v12H4zM8 7V5h8v2M4 11h16" />
        </svg>
      ) : null}
      {icon === "seekers" ? (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1-5 4-7 8-7s7 2 8 7" />
        </svg>
      ) : null}
      {icon === "general" ? (
        <svg {...commonProps}>
          <path d="M3 5h18v14H3zM3 7l9 6 9-6" />
        </svg>
      ) : null}
      {icon === "partnerships" ? (
        <svg {...commonProps}>
          <path d="M8 12h8M12 8v8" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      ) : null}
      {icon === "hours" ? (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      ) : null}
      {icon === "location" ? (
        <svg {...commonProps}>
          <path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2" />
        </svg>
      ) : null}
    </div>
  );
}

const fieldClass =
  "mt-2 min-h-12 w-full rounded-md border border-border bg-white px-4 py-3 text-foreground outline-none placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/20";

export function ContactPage() {
  return (
    <>
      <section
        aria-labelledby="contact-hero-heading"
        className="border-b border-border bg-white"
      >
        <Container className="py-16 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              {CONTACT_CONTENT.hero.eyebrow}
            </p>
            <h1
              className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl"
              id="contact-hero-heading"
            >
              {CONTACT_CONTENT.hero.heading}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-foreground/80 sm:text-xl">
              {CONTACT_CONTENT.hero.lead}
            </p>
          </div>
        </Container>
      </section>

      <section
        aria-labelledby="contact-methods-heading"
        className="py-14 sm:py-20"
      >
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              {CONTACT_CONTENT.methods.eyebrow}
            </p>
            <h2
              className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
              id="contact-methods-heading"
            >
              {CONTACT_CONTENT.methods.heading}
            </h2>
          </div>

          <div className="mt-8 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {CONTACT_CONTENT.methods.cards.map((card) => (
              <article
                className="rounded-xl border border-border bg-white p-6 shadow-sm"
                key={card.email}
              >
                <ContactCardIcon icon={card.icon} />
                <h3 className="mt-5 text-xl font-bold tracking-tight">
                  {card.title}
                </h3>
                <a
                  className="mt-2 inline-block break-all rounded font-bold text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary"
                  href={`mailto:${card.email}`}
                >
                  {card.email}
                </a>
                <p className="mt-3 text-sm leading-6 text-muted">{card.note}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-border bg-white py-14 sm:py-20">
        <Container className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <aside aria-labelledby="contact-office-heading">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              {CONTACT_CONTENT.office.eyebrow}
            </p>
            <h2
              className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
              id="contact-office-heading"
            >
              {CONTACT_CONTENT.office.heading}
            </h2>
            <p className="mt-4 leading-7 text-muted">
              {CONTACT_CONTENT.office.intro}
            </p>

            <div className="mt-7 rounded-xl border border-border bg-white p-6 shadow-sm sm:p-7">
              {CONTACT_CONTENT.office.details.map((detail, index) => (
                <div
                  className={`flex items-start gap-4 ${
                    index > 0 ? "mt-6 border-t border-border pt-6" : ""
                  }`}
                  key={detail.title}
                >
                  <ContactCardIcon icon={detail.icon} />
                  <div>
                    <h3 className="font-bold">{detail.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {detail.lines.map((line) => (
                        <span className="block" key={line}>
                          {line}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="rounded-2xl border border-border bg-white p-6 shadow-lg sm:p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-primary">
              {CONTACT_CONTENT.form.eyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {CONTACT_CONTENT.form.heading}
            </h2>

            <form className="mt-7" aria-describedby="contact-form-note">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-bold text-foreground/80">
                  {CONTACT_CONTENT.form.fields.name.label}
                  <input
                    className={fieldClass}
                    name="name"
                    placeholder={CONTACT_CONTENT.form.fields.name.placeholder}
                    type="text"
                  />
                </label>
                <label className="text-sm font-bold text-foreground/80">
                  {CONTACT_CONTENT.form.fields.email.label}
                  <input
                    className={fieldClass}
                    name="email"
                    placeholder={CONTACT_CONTENT.form.fields.email.placeholder}
                    type="email"
                  />
                </label>
                <label className="text-sm font-bold text-foreground/80">
                  {CONTACT_CONTENT.form.fields.phone.label}
                  <input
                    className={fieldClass}
                    name="phone"
                    placeholder={CONTACT_CONTENT.form.fields.phone.placeholder}
                    type="tel"
                  />
                </label>
                <label className="text-sm font-bold text-foreground/80">
                  {CONTACT_CONTENT.form.fields.subject.label}
                  <select className={fieldClass} defaultValue="" name="subject">
                    <option disabled value="">
                      {CONTACT_CONTENT.form.fields.subject.placeholder}
                    </option>
                    {CONTACT_CONTENT.form.fields.subject.options.map(
                      (option) => (
                        <option key={option}>{option}</option>
                      ),
                    )}
                  </select>
                </label>
                <label className="text-sm font-bold text-foreground/80 sm:col-span-2">
                  {CONTACT_CONTENT.form.fields.message.label}
                  <textarea
                    className={`${fieldClass} min-h-36 resize-y`}
                    name="message"
                    placeholder={
                      CONTACT_CONTENT.form.fields.message.placeholder
                    }
                  />
                </label>
              </div>

              <div className="mt-5 flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
                <p
                  className="max-w-md text-xs leading-5 text-muted"
                  id="contact-form-note"
                >
                  {CONTACT_CONTENT.form.note}
                </p>
                <button
                  className="min-h-12 rounded-md bg-primary px-5 py-3 font-bold text-white outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  type="button"
                >
                  {CONTACT_CONTENT.form.button}
                </button>
              </div>
            </form>
          </div>
        </Container>
      </section>

      <section aria-labelledby="contact-faq-heading" className="py-14 sm:py-20">
        <Container>
          <div className="max-w-4xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-wider text-primary">
                {CONTACT_CONTENT.faq.eyebrow}
              </p>
              <h2
                className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl"
                id="contact-faq-heading"
              >
                {CONTACT_CONTENT.faq.heading}
              </h2>
            </div>

            <div className="mt-8 space-y-3">
              {CONTACT_CONTENT.faq.items.map((item) => (
                <details
                  className="group rounded-xl border border-border bg-white px-5 shadow-sm"
                  key={item.question}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <span
                      aria-hidden="true"
                      className="text-2xl font-normal text-primary transition-transform group-open:rotate-45 motion-reduce:transition-none"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-3xl pb-5 pr-10 leading-7 text-muted">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
