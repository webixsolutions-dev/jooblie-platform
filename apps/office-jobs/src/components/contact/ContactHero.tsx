import React, { useState } from "react";
import type { FC, SVGProps, ReactNode, ChangeEvent, FormEvent } from "react";

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

const ClockIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SendIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const MapPinIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CheckCircleIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const AlertCircleIcon: IconComponent = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type SubmitStatus = "success" | "error" | null;

interface InfoRowProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}

const InfoRow: FC<InfoRowProps> = ({ icon, title, children }) => (
  <div className="flex gap-3 border-b border-slate-100 py-3.5 last:border-b-0 sm:gap-4 sm:py-4">
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0B1B3A] text-amber-400 sm:h-10 sm:w-10">
      {icon}
    </div>
    <div className="min-w-0">
      <h4 className="text-sm font-bold text-slate-900 sm:text-base">{title}</h4>
      <div className="mt-0.5 text-sm text-slate-600">{children}</div>
    </div>
  </div>
);

export default function ContactHero() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // TODO: replace with real @jooblie/core hook (e.g. useSubmitContactMessage)
      // once available — this endpoint is a placeholder and does not exist yet.
      const response = await fetch("https://your-api-endpoint.com/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
        setTimeout(() => setSubmitStatus(null), 5000);
      } else {
        setSubmitStatus("error");
        setTimeout(() => setSubmitStatus(null), 5000);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handlePhoneClick = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <section className="relative overflow-hidden bg-slate-50">
      <div className="flex flex-col lg:grid lg:grid-cols-[1.15fr_1fr] xl:grid-cols-[1.2fr_1fr]">
        {/* Left content */}
        <div className="px-4 py-10 sm:px-6 sm:py-12 md:px-8 lg:px-10 lg:py-16 xl:px-16 xl:py-20">
          <span className="text-xs font-bold tracking-[0.2em] text-amber-500 sm:text-sm">
            CONTACT US
          </span>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl md:text-4xl lg:text-5xl">
            Contact Office Jobline
          </h1>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">
            Connecting job seekers and employers across Canada.
          </p>
          <p className="mt-3 max-w-xl text-sm text-slate-500 sm:text-base">
            We're here to help! Whether you're looking for office jobs or administrative jobs,
            need employer support, or want assistance hiring top talent in Canada, our team is
            ready to assist you.
          </p>

          <div className="mt-8 flex flex-col gap-5 sm:gap-6 md:grid md:grid-cols-[1.3fr_1fr] lg:mt-10">
            {/* Form card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 md:p-7">
              <div className="flex items-start gap-3 sm:items-center">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0B1B3A] text-amber-400">
                  <MailIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Send us a message</h3>
                  <p className="text-xs text-slate-500 sm:text-sm">
                    Fill out the form below and we'll get back to you shortly.
                  </p>
                </div>
              </div>

              {/* Status Messages */}
              {submitStatus === "success" && (
                <div
                  role="status"
                  className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700"
                >
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span>Message sent successfully! We'll get back to you soon.</span>
                </div>
              )}
              {submitStatus === "error" && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                  <span>Failed to send message. Please try again or contact us directly.</span>
                </div>
              )}

              <form className="mt-5 space-y-4" onSubmit={handleSubmit} >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 sm:text-sm">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 sm:px-4 sm:py-2.5"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 sm:text-sm">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      autoComplete="email"
                      required
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 sm:px-4 sm:py-2.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 sm:text-sm">
                    Subject
                  </label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 sm:px-4 sm:py-2.5"
                  >
                    <option value="" disabled>
                      Select a subject
                    </option>
                    <option value="Job Seeker Support">Job Seeker Support</option>
                    <option value="Employer Support">Employer Support</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 sm:text-sm">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How can we help you?"
                    required
                    className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-sm placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100 sm:px-4 sm:py-2.5"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1B3A] py-2.5 text-sm font-semibold text-white transition sm:py-3 ${
                    isSubmitting ? "cursor-not-allowed opacity-70" : "hover:bg-[#132a56]"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <SendIcon className="h-4 w-4" /> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Contact info card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6 md:p-7">
              <h3 className="mb-1 font-bold text-slate-900">Contact Information</h3>
              <div className="mt-2 space-y-0">
                <InfoRow icon={<MailIcon className="h-4 w-4" />} title="Email Us">
                  <button
                    onClick={() => handleEmailClick("info@officejobline.com")}
                    className="break-all font-semibold text-amber-500 hover:underline"
                  >
                    info@officejobline.com
                  </button>
                  <p className="text-xs text-slate-500">We aim to reply within one business day.</p>
                </InfoRow>
                <InfoRow icon={<PhoneIcon className="h-4 w-4" />} title="Call Us">
                  <button
                    onClick={() => handlePhoneClick("+16475550198")}
                    className="font-semibold text-amber-500 hover:underline"
                  >
                    +1 (647) 555-0198
                  </button>
                  <p className="text-xs text-slate-500">Mon – Fri, 9:00 AM – 5:00 PM ET</p>
                </InfoRow>
                <InfoRow icon={<ClockIcon className="h-4 w-4" />} title="Office Hours">
                  <p className="text-sm">Monday – Friday</p>
                  <p className="text-sm">9:00 AM – 5:00 PM ET</p>
                  <p className="text-xs text-slate-500">Closed on weekends and statutory holidays.</p>
                </InfoRow>
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-slate-700 sm:px-4 sm:py-3 sm:text-sm">
                <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <span>Proudly supporting job seekers and employers across Canada.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - real office photo with navy gradient overlay + logo lockup */}
        <div className="relative min-h-[220px] sm:min-h-[300px] md:min-h-[360px] lg:min-h-full">
          {/* Background photo */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=80')",
            }}
          />
          {/* Navy gradient overlay so the photo reads on-brand and text stays legible */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B1B3A]/95 via-[#0B1B3A]/70 to-[#0B1B3A]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3A]/60 via-transparent to-transparent" />

          {/* Logo lockup */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <svg viewBox="0 0 24 24" className="h-12 w-12 text-amber-400 drop-shadow-lg sm:h-16 sm:w-16 lg:h-20 lg:w-20" fill="currentColor">
              <path d="M3 21V9l6-4v4l6-4v16H3zm2-2h2v-2H5v2zm0-4h2v-2H5v2zm0-4h2V9H5v2zm6 8h2v-2h-2v2zm0-4h2v-2h-2v2zm6 4h2v-9h-2v9z" />
            </svg>
            <span className="mt-2 text-xl font-extrabold text-white drop-shadow-lg sm:text-2xl lg:text-3xl">
              Office Jobline
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}