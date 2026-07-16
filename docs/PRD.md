# PRD — Jooblie Multi-Site Job Board Platform


**Status:** Approved design — production build (not MVP)


---

## 1. Product Overview

Jooblie is a job board network consisting of **one aggregator site (Jooblie)** and **six sector/audience-specific partner sites**, all served by a **single shared Supabase (Postgres) backend** (`jooblie-platform`). A job posted on any partner site automatically appears on Jooblie in the correct category. Jooblie is the superset of all partner content.

This is a ground-up v2 rebuild. The legacy `jooblie-mvp` project is not reused. All known defects from the legacy audit (public resumes bucket, catch-all RLS, dual profile-creation paths, text-typed salaries, mismatched skills types, phantom tables, dead Express backend) are explicitly designed out in v2. See SystemDesign.md §Legacy Remediation Map.

### 1.1 Sites

| ID | Site | Type | Sector mapping | Domain model |
|----|------|------|----------------|--------------|
| 1 | Jooblie | aggregator | — (reads all) | jooblie.com (independent) |
| 2 | IT Jobs Jobline | sector | IT | independent domain |
| 3 | Office Jobs Jobline | sector | Office | independent domain |
| 4 | Hospitality & Healthcare Jobline | sector | Hospitality & Healthcare | independent domain |
| 5 | Transportation & Farming Jobline | sector | Transportation & Farming | independent domain |
| 6 | Aboriginal Jobline | audience | — (cross-sector) | independent domain |
| 7 | New Comers Jobline | audience | — (cross-sector) | independent domain |

- All 7 frontends: React (Vite + TS + Tailwind + React Router). Existing/in-progress; backend is the deliverable of this project.
- An **8th frontend** exists for administration: a separate lightweight admin app at `admin.jooblie.com`. It is not a public site and has no row in `sites` semantics beyond Jooblie context (admin actions log against relevant sites).
- Sites are **seven separate domains** (confirmed decision). No subdomain consolidation, no SSO in v1.

### 1.2 Market & Locale (v1)

- Canada-focused. Location = structured `(province, city)` + `is_remote` flag.
- Currency: CAD fixed in v1. Schema column is generic (`salary_currency char(3)`, default `'CAD'`) — no hardcoding; multi-country is v2+.
- Language: English only in v1.

---

## 2. Core Rules (non-negotiable product invariants)

1. **Visibility (v1):** Every job is visible on exactly its **origin site + Jooblie**. No cross-listing of any kind in v1 — including audience sites: a job posted on Aboriginal Jobline appears only on Aboriginal Jobline + Jooblie, never on sector sites, even if it belongs to that sector. A job posted directly on Jooblie appears only on Jooblie.
   - Mechanism: `job_sites` junction table, populated **exclusively by a database trigger** on job insert (origin + Jooblie rows; one row if origin = Jooblie). No client write path, no recruiter site-selection UI in v1.
   - The junction exists to enable **future** audience-based cross-listing and multi-site targeting without schema migration. v1 logic populates it and reads it; nothing else.
2. **Cross-site application state:** A single `applications` table shared network-wide. If a seeker applies to a job on any site, that job shows as **"Applied"** (with current status) on every site where the job is visible. Enforced by `UNIQUE(job_id, applicant_id)` — this constraint is mandatory and absolute in v1 (no re-apply after withdrawn/rejected; re-apply flow is a v2 item).
3. **Single account pool:** One registration works across all sites. Sessions are per-domain (user logs in separately on each site with the same credentials). No SSO/token-handoff in v1. Every site displays copy equivalent to: *"Your Jooblie account works across all partner sites."*
4. **Moderation gate:** Companies require one-time admin verification. Verified companies' jobs go live instantly; unverified companies' jobs sit in `pending_review` (invisible to seekers). On verification, all pending jobs of that company auto-activate.
5. **Single canonical taxonomy:** One global 2-level taxonomy (sector → category), table-driven, seeded by migration. No per-site categories. Taxonomy changes are migration-only in v1 (no admin CRUD).
6. **Profile creation has exactly one path:** the `on_auth_user_created` DB trigger. No client-side profile inserts anywhere.

---

## 3. Roles

Exclusive enum: `job_seeker | recruiter | admin`. No dual-role accounts. A user wanting both roles creates separate accounts.

| Role | Created via | Scope |
|------|-------------|-------|
| job_seeker | Signup on any site (default role) | Network-wide |
| recruiter | Signup on any site with role metadata | Network-wide, acts through company membership |
| admin | Seed migration / manual SQL promotion only — **no signup path** | Central/platform-level only. No per-site admins in v1 (schema future-proofed via nullable site-scope column; unused in v1 logic) |

**Security requirement (role assignment):** The signup trigger reads the role from signup metadata against a **strict whitelist**: only `'job_seeker'` or `'recruiter'` are accepted. Invalid, missing, or `'admin'` values default to `'job_seeker'`. It must be impossible to obtain admin via signup metadata.

**Suspension:** Admins can suspend users (login-level ban + `profiles.status='suspended'`) and companies (`companies.status='suspended'`, hides all their jobs from public reads). Both reversible; all transitions logged in `activity_log`.

---

## 4. User Flows (approved)

### 4.0 Guest (anonymous)

- **G1.** On any site without login: browse active jobs, job detail, search/filter, company public pages. Partner sites show only their visible jobs (`job_sites` membership); Jooblie shows all.
- **G2.** Apply/Save actions redirect to login/signup with `returnTo` preserved.

### 4.1 Job Seeker

- **S1. Signup (on site X):** Email + password → Supabase Auth → confirmation email (Resend SMTP) with `emailRedirectTo` = site X's `/auth/callback` → back on site X, session live → onboarding (name, location, skills, optional default resume upload to private bucket). Profile row created solely by DB trigger with `role='job_seeker'`, `signup_site_id=X` (attribution only).
- **S2. Login:** Same credentials on every site; session per-domain. Cross-site account messaging shown.
- **S3. Browse/search:** Postgres FTS + filters (category, location, employment type, numeric salary range, remote). Site-filtered on partners, unfiltered on Jooblie.
- **S4. Apply (on site Y where the job is visible):** Login required. Resume **required** (profile default or fresh upload — path snapshotted on the application, immutable thereafter); cover letter optional; **no screening questions in v1**. Creates application with `applied_via_site_id=Y`, `status='submitted'`. Duplicate → "Already applied." Rate limit: 20 applications / rolling 24h / seeker (config-driven). Triggers activity_log entry + recruiter notifications.
- **S5. Applied state:** "Applied" badge + current status everywhere the job is visible.
- **S6. Saved jobs:** Network-global; `saved_via_site_id` for attribution only.
- **S7. Applications dashboard:** Available on every site; shows all applications network-wide with site labels. **Applied and saved jobs remain visible to the seeker in every job status** (expired/closed/removed/suspended-company) with a status label in the UI — dashboards must never break on non-active jobs (FIX 1).
- **S8. Notifications:** Global pool, visible from any site, each labeled with site context.
- **S9. Withdraw:** Seeker may set own application to `withdrawn` from any non-terminal status. Only the seeker can do this; enforced at DB level.
- **S10. Account deletion (PIPEDA — CVs are sensitive PII):** Self-service from any site (confirmation step). v1 = soft-delete/anonymize: profile PII scrubbed (name, phone, headline, skills, location → nulled/placeholder; email → tombstone value), **all resume files deleted from storage** (default + per-application snapshots), auth login disabled (ban), `profiles.status='deleted'`. `applications` rows remain **anonymized** — recruiter-side records and `activity_log` integrity preserved; recruiter UI shows "applicant deleted their account" and "resume removed at applicant's request" where files are gone. **No cascades:** `applications.applicant_id` and `activity_log.actor_id` are NO ACTION FKs; only user-private data (notifications, saved_jobs) is deleted. Hard-delete is v2. Same anonymization applies to recruiters (company survives if other members exist; sole-owner case blocks deletion until company is transferred or closed — UI guides this).

### 4.2 Recruiter

- **R1. Signup:** Any site, `role='recruiter'` via metadata (whitelisted) → forced company-creation step (creator becomes `owner` in `company_members`). Join-existing-company: v2 (multi-membership is schema-supported day-1; agency case allowed). Dashboard locked until a company exists.
- **R2. Company creation:** Name, **website (mandatory)**, **registration number (mandatory)**, optional verification document upload, logo, description. `verification_status='pending'` → admin queue + admin notification. Company names unique network-wide: `UNIQUE(lower(name))` (among non-deleted). Duplicate attempt → UI message "company exists" (join-request flow is v2; the constraint is v1).
- **R3. Job post (on site X):** Global taxonomy category dropdown (sector auto-derived), title, description, structured location or remote, numeric salary min/max + period, employment type, skills. Origin = X; visibility rows written by trigger per Core Rule 1. Status set by trigger: verified company → `active` (with `published_at`, `expires_at = published_at + 60 days` config-driven); else `pending_review`. Rate limit: 10 posts / rolling 24h / company.
- **R4. Verification lift:** Admin verify → all that company's `pending_review` jobs auto-activate. Rejection requires a reason; rejected company may edit and resubmit (resubmission history in `activity_log`).
- **R5. Applicant management:** View applicants for own company's jobs: profile, resume via **time-limited signed URL** (accessible only to members of the applied-to company), status transitions → seeker notification + activity_log (which serves as full status history).
- **R6. Job lifecycle:** `active → closed` (manual); 60-day auto-expiry with renew; expiry reminder notification 7 days before (config-driven). Edits logged with field-level old/new diffs. Deletes are soft (`deleted_at`).
- **R7. Dashboard:** Own jobs, per-site view analytics (from `job_views`, site-tagged, integrity-protected per FIX 2), application counts.
- **R8. Notifications:** `job.new_applicant` goes to **all members of the company** (one notification row per member), not only the job creator (FIX 3).

### 4.3 Admin

- **A1.** No signup path (see §3).
- **A2.** Separate admin frontend at `admin.jooblie.com`.
- **A3. Verification queue:** Pending companies → review detail → Verify or Reject (reason mandatory) → activity_log + recruiter notification.
- **A4. Observability (first-class requirement):**
  - **Jobs explorer:** filter by site / company / recruiter / status / date range; per-job creator, timestamps, origin site, edit history.
  - **Applications explorer:** per job — which seekers, when, via which site, full status history.
  - **Activity log browser:** filterable raw audit trail (actor, action, entity, site, company, time).
- **A5. Moderation (v1 final set):** job takedown (`removed`, reason mandatory, restorable), company suspend/unsuspend, user suspend/unsuspend. All logged.
- **A6. Taxonomy:** seed migration only; changes via migration (no admin CRUD in v1).

### 4.4 Cross-cutting

- **Password reset:** redirect to the requesting site; all 7 domains in the auth redirect allowlist.
- **Email deep-link rule (mandatory for all templates):**
  - Seeker application-status emails → link to the **`applied_via_site`** domain.
  - Recruiter new-applicant emails → link to the job's **`origin_site`** domain.
  - Admin verification-request emails → admin app.
  - Mechanism: `notifications.site_id` is set by trigger per this rule; the email dispatcher builds links from `sites.domain`. Templates never decide domains themselves.
- **Email events (v1, exact set):** seeker status-change (instant), recruiter new-applicant (instant), admin new-company-verification-request. Everything else in-app only. Auth emails (confirm/reset) via Supabase Auth custom SMTP (Resend). App emails via Edge Function → Resend API.

---

## 5. Functional Requirements Summary

| # | Requirement | Source |
|---|------------|--------|
| FR1 | Single shared Postgres, multi-tenant via `origin_site_id` + `job_sites` | D-arch |
| FR2 | v1 visibility: origin + Jooblie exactly; trigger-only junction writes | D1 |
| FR3 | Global 2-level taxonomy, migration-seeded | D2 |
| FR4 | Global companies; multi-member; multi-company membership allowed | D3 |
| FR5 | One-time company verification gate; pending_review for unverified | D3 |
| FR6 | Single account pool; per-domain sessions; exclusive roles; whitelisted role assignment | D4, Gap1 |
| FR7 | 7 separate domains; all in auth allowlist; origin-site email redirects | D5 |
| FR8 | Cross-site Applied state via `UNIQUE(job_id, applicant_id)` | Clar. 2 |
| FR9 | Company name uniqueness `lower(name)` | Gap 2 |
| FR10 | Email deep-link rule (applied_via / origin) | Gap 3 |
| FR11 | Admin observability: jobs/applications/activity explorers | New req 1 |
| FR12 | `activity_log` audit trail, append-only, trigger-written | New req 2 |
| FR13 | Application status pipeline with DB-enforced transition rules (withdrawn = seeker-only; other transitions = recruiter of that company; terminal states) | Q2 |
| FR14 | Resume required per application; snapshot immutability; private storage + signed URLs with applied-to-company access | Q3, Storage |
| FR15 | 60-day expiry + renew + 7-day reminder (config-driven) | Q6 |
| FR16 | Rate limits 20 applies/day/seeker, 10 posts/day/company — rolling 24h, values in `platform_config` | Q12 |
| FR17 | Seeker visibility of own applied/saved jobs in all statuses | FIX 1 |
| FR18 | View-tracking integrity: spoof-guard, per-day dedupe (authenticated), anon throttle | FIX 2 |
| FR19 | New-applicant notifications to all company members | FIX 3 |
| FR20 | SEO: canonical = origin site (Jooblie-origin → Jooblie); JobPosting JSON-LD on every job detail page; v1 prerendering layer on VPS | Q13 |
| FR21 | Soft deletes on jobs/applications/companies; FTS index on jobs | Prod hygiene |
| FR22 | Account deletion: PII scrub + resume file erasure + login ban; applications/activity_log preserved anonymized; no FK cascades from profiles into applications/activity_log | ADD 1 (PIPEDA) |

## 6. Non-Functional Requirements

- **NFR1 — Security:** RLS on every table; one policy per (table, role, operation); no catch-alls. Private resume/verification-doc buckets. Column-level grants protect role/status fields. All the legacy audit's security findings must be demonstrably closed (checklist in SystemDesign.md).
- **NFR2 — Environments:** develop/staging on free tier, production on Supabase Pro at launch. Two Supabase projects minimum (staging + production).
- **NFR3 — Change control:** all schema changes via CLI migrations; **zero dashboard changes**; generated TS types consumed by all frontends. (Full rules in Rules.md.)
- **NFR4 — Auditability:** every state-changing action on jobs/applications/companies/users produces an `activity_log` row; log is append-only by construction.
- **NFR5 — Performance:** public listing query served by composite index; FTS via GIN; rate-limit counts via `jobs(company_id, created_at DESC)` (FIX 4) and `applications(applicant_id, created_at DESC)`.
- **NFR6 — SEO:** prerendered HTML for bots on all public pages; correct rel=canonical per FR20; per-site sitemaps.
- **NFR7 — Backups/DR:** Production: daily automated backups (Supabase Pro) with PITR evaluated at launch; documented, rehearsed restore process. **Storage buckets are not covered by DB backups** — resumes/verification-docs require an explicit separate backup path (scheduled export). Full design in SystemDesign.md §Backups & DR.

## 7. Explicitly Out of Scope (v1)

OAuth/social login · SSO/cross-domain sessions · cross-listing & multi-site targeting UI · screening questions · re-apply after withdraw/reject · join-existing-company flow · per-site admins · taxonomy admin CRUD · payments/pricing · recommendations engine · chat/chatbot · email digests · multi-country/multi-currency · multi-language · hard account deletion (v1 ships soft-delete/anonymize per FR22). Several have schema-level landing zones (documented in SystemDesign.md §Future-Proofing) but no v1 logic.

## 8. Success / Acceptance Criteria (v1 launch)

1. A job posted on any partner site is visible on that site + Jooblie immediately (same transaction — the visibility trigger is synchronous); nowhere else.
2. A seeker registered on site A can log in on site B with the same credentials; their applications and saved jobs are identical on both.
3. Applying on Jooblie marks the job Applied on its origin site (and vice versa); second apply attempt is blocked.
4. Unverified company's job is invisible to seekers; admin verify flips it live without recruiter action.
5. A recruiter can open an applicant's resume via signed URL; an unrelated recruiter cannot (verified by test).
6. Anonymous user cannot read any profile, any resume, or insert any job (verified by test — direct legacy-breach regression checks).
7. Admin can answer, from the dashboard alone: "which company posted which job on which site when, and who applied when with what status history."
8. Rate limits enforce at DB level with clean client-facing errors.
9. Googlebot fetching any job detail page receives prerendered HTML containing JobPosting JSON-LD and the correct canonical URL.
10. `supabase db reset` on a clean project reproduces the entire backend from migrations alone.
11. After account deletion: the user cannot log in; no resume file of theirs is retrievable by anyone (including admin); their applications remain visible to recruiters in anonymized form; activity_log rows are intact.
