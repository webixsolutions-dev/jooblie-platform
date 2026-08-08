import React, { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/Signup/AuthLayout";

// NOTE: react-icons removed per monorepo rules — inlined as small SVGs below.
// Swap for @jooblie/ui icon primitives if/when that package exposes them (§4 of the migration guide).

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="7" width="18" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 12h18" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M3 6h18v12H3z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="5" y="11" width="14" height="9" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.58 10.58a2 2 0 002.83 2.83M9.88 5.09A9.77 9.77 0 0112 5c6 0 9.5 7 9.5 7a17.6 17.6 0 01-3.11 4.14M6.53 6.53C4.03 8.2 2.5 12 2.5 12s3.5 7 9.5 7a9.6 9.6 0 004.47-1.09"
      />
    </svg>
  );
}

function UserPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="9" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 20c0-4 3.1-6 7-6s7 2 7 6M18 8v6M15 11h6" />
    </svg>
  );
}

type Role = "seeker" | "employer";

export default function SignUp() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [role, setRole] = useState<Role>("seeker");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [agreed, setAgreed] = useState<boolean>(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    // TODO(slice 3+ — auth): do not build a local auth/signup call here.
    // Wire this to @jooblie/core's shared AuthProvider / signup hook (the
    // same one apps/jooblie uses) once its exact exported API is confirmed.
    // No local Supabase client, no app-local auth logic. `role` (seeker vs
    // employer) will need to map to whatever field/table the real signup
    // flow expects — confirm with Hasham rather than inventing a shape.
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Office Jobline and start connecting with opportunity across Canada."
    >
      {/* Role toggle */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setRole("seeker")}
          className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition ${
            role === "seeker" ? "bg-white text-[#0B1B3A] shadow-sm" : "text-slate-500"
          }`}
        >
          <UserIcon className="h-4 w-4" /> Job Seeker
        </button>
        <button
          type="button"
          onClick={() => setRole("employer")}
          className={`flex items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition ${
            role === "employer" ? "bg-white text-[#0B1B3A] shadow-sm" : "text-slate-500"
          }`}
        >
          <BriefcaseIcon className="h-4 w-4" /> Employer
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">First Name</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm placeholder-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Last Name</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm placeholder-slate-400 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
          </div>
        </div>

        {role === "employer" && (
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Company Name
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
              <BriefcaseIcon className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name"
                className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">
            Email Address
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
            <MailIcon className="h-4 w-4 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
            <LockIcon className="h-4 w-4 text-slate-400" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="w-full text-sm text-slate-700 placeholder-slate-400 outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">Must be at least 8 characters.</p>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            required
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0B1B3A] focus:ring-amber-400"
          />
          I agree to the{" "}
          <a href="#" className="font-semibold text-amber-500 hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="font-semibold text-amber-500 hover:underline">
            Privacy Policy
          </a>
          .
        </label>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0B1B3A] py-3 text-sm font-semibold text-white transition hover:bg-[#132a56]"
        >
          <UserPlusIcon className="h-4 w-4" />
          {role === "employer" ? "Create Employer Account" : "Create Account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/signin" className="font-semibold text-amber-500 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}