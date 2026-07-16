# SystemDesign — Jooblie Platform (v2)


**Scope:** Backend architecture, multi-tenancy, auth, data flows, security model, email pipeline, prerendering, deletion, backups, future-proofing.

---

## 1. Architecture Overview

```
                         ┌─────────────────────────────────────────────┐
                         │        SUPABASE CLOUD (jooblie-platform)     │
 7 public frontends      │                                             │
 (React/Vite SPAs)       │  ┌───────────────┐   ┌───────────────────┐  │
 ┌──────────────┐  HTTPS │  │  Postgres      │   │  Auth (GoTrue)    │  │
 │ jooblie.com  │───────▶│  │  RLS + triggers│◀──│  single user pool │  │
 │ (VPS+nginx+  │        │  │  pg_cron       │   │  SMTP = Resend    │  │
 │  prerender)  │        │  │  pg_net        │   └───────────────────┘  │
 ├──────────────┤        │  └──────┬────────┘   ┌───────────────────┐  │
 │ 6 partner    │───────▶│         │ webhook    │  Storage           │  │
 │ domains      │        │         ▼            │  resumes (private) │  │
 ├──────────────┤        │  ┌───────────────┐   │  company-assets    │  │
 │ admin.       │───────▶│  │ Edge Function │   │  verification-docs │  │
 │ jooblie.com  │        │  │ email-dispatch│──▶│  (private)         │  │
 └──────────────┘        │  └──────┬────────┘   └───────────────────┘  │
                         └─────────┼───────────────────────────────────┘
                                   ▼
                              Resend API (app emails)
```

- **No custom API server.** All reads/writes go frontend → supabase-js → PostgREST, guarded by RLS + column grants + triggers. Business logic that must not live in clients lives in **DB triggers/functions** (visibility rows, status machines, rate limits, notifications, audit log) and **Edge Functions** (email dispatch, account deletion). The legacy dead Express backend has no v2 successor by design.
- **State machine principle:** clients never set `jobs.status`, `applications.status_updated_at`, visibility rows, or any audit/notification row directly. Clients express *intent* (insert row, update allowed columns); triggers derive protected state. This makes the DB the single enforcement point across 8 frontends.

## 2. Multi-Tenancy Model

- Tenant discriminator: `jobs.origin_site_id` (provenance) + `job_sites` junction (visibility). Sites are rows, not schemas/databases.
- **v1 visibility contract (verbatim, binding):** `jobs` AFTER INSERT trigger writes exactly `(job, origin_site_id)` and `(job, 1 /*Jooblie*/)` into `job_sites` — one row when origin = Jooblie. There is no other write path (no client INSERT policy exists). No cross-listing of any kind in v1, including audience sites. The junction exists solely so future audience cross-listing / multi-site targeting changes trigger logic + UI, never schema.
- **Filtering is presentation, not security.** Partner frontends filter via `job_sites`; Jooblie reads unfiltered. RLS enforces the real boundaries: active/non-deleted/non-suspended public visibility, ownership writes, applicant privacy, resume privacy, admin scope. This division keeps policies small and auditable (the direct antidote to the legacy 35-policy soup).
- Per-site queries hit `job_sites(site_id, job_id)` index → join to the jobs hot-path composite index `(status, deleted_at, published_at DESC)`.

## 3. Identity & Auth (7-domain reality)

### 3.1 Model

- One Supabase Auth pool. `profiles` 1:1 with `auth.users`, created **only** by `on_auth_user_created` trigger (strict role whitelist: `job_seeker`/`recruiter`; anything else → `job_seeker`; `signup_site_id` validated against `sites`, fallback Jooblie).
- Sessions are per-domain (localStorage per origin). No SSO in v1: same credentials, separate login on each site. Product copy on all sites: "Your Jooblie account works across all partner sites."
- All 7 domains + admin.jooblie.com in the Auth redirect allowlist. Every auth email redirect targets the **requesting site's** domain.

### 3.2 Signup / confirmation flow

```
Seeker on itjobsjobline.com                    Supabase Auth              Postgres
        │ signUp(email, pw,                          │                        │
        │  data:{role:'recruiter'|'job_seeker',      │                        │
        │        site:'it-jobs'},                    │                        │
        │  emailRedirectTo: it.../auth/callback) ───▶│                        │
        │                                            │── on_auth_user_created─▶ profiles row
        │                                            │   (whitelist role,      │ (single path)
        │      confirmation email via Resend SMTP ◀──│    validate site)       │
        │◀── user clicks link ── redirected to ──────│                        │
        │    itjobsjobline.com/auth/callback         │                        │
        │    session established (this domain only)  │                        │
```

Password reset: identical shape; `redirectTo` = requesting domain. Login on another domain later = plain password login (S2).

### 3.3 Protected columns

RLS grants row access; **column-level grants** protect fields within the row: `profiles.role/status/signup_site_id/email` are not client-updatable (REVOKE UPDATE + explicit GRANT on the editable column list). Same pattern on `jobs.status/published_at/expires_at`, `applications.status_updated_at`, `companies.verification_status/verified_*`.

## 4. Core Data Flows

### 4.1 Job post → visibility (synchronous, single transaction)

```
Recruiter INSERT jobs (allowed cols) 
  ├─ BEFORE: rate-limit check (COUNT company jobs, rolling 24h vs platform_config) → exception on breach
  ├─ BEFORE: status derivation (company verified? active + published_at + expires_at : pending_review)
  └─ AFTER:  job_sites rows (origin + Jooblie) · activity_log('job.created') · search_vector (generated)
COMMIT ⇒ job visible per contract immediately (Acceptance #1)
```

### 4.2 Apply

```
Seeker INSERT applications (job_id, resume_path, cover_letter, applied_via_site_id)
  ├─ UNIQUE(job_id, applicant_id) → duplicate = clean error → UI "Already applied"
  ├─ BEFORE: rate-limit (20/rolling-24h) · job must be active · seeker not suspended
  └─ AFTER:  activity_log('application.submitted')
             notifications: one row PER company member (FIX 3), type='job.new_applicant',
             site_id = job.origin_site_id (deep-link rule)
```

### 4.3 Application status change

```
Recruiter UPDATE applications.status
  ├─ transition trigger: actor ∈ company_members of job's company; forward-only w/ skip;
  │  'withdrawn' rejected for recruiters. Seeker path: only own row → 'withdrawn', non-terminal only.
  └─ AFTER: status_updated_at · activity_log(old→new) ·
            notification(user=applicant, site_id=applied_via_site_id)  ← deep-link rule
```

### 4.4 Company verification

```
Admin UPDATE companies.verification_status='verified'
  └─ AFTER: verified_at/by · all company's pending_review jobs → active (+published/expires)
            · activity_log('company.verified') · notification to owner
Reject: reason mandatory (CHECK) → notification; owner edits limited cols → trigger resets to 'pending'
            · activity_log('company.resubmitted')
```

## 5. Legacy Remediation Map

Every legacy audit finding → the specific v2 mechanism that closes it, and the test that proves it (feeds Acceptance criteria + Rules.md verification steps).

| # | Legacy finding (jooblie-mvp) | v2 closure | Regression check |
|---|------------------------------|------------|------------------|
| 1 | Public `resumes` bucket | Private bucket, migration-created; signed URLs only | anon + unrelated recruiter GET → 403 |
| 2 | Catch-all `storage.objects` policies (~35, contradictory) | Per-bucket, per-operation policies only; buckets & policies live in `0012_storage.sql` — zero dashboard policy creation | policy count/inventory diff in CI against migration source |
| 3 | `profiles` readable by anon (`qual=true`) | No anon policy on profiles at all; recruiter sees only own applicants via EXISTS-join | anon SELECT profiles → 0 rows |
| 4 | `jobs` INSERT open to all | INSERT only for company members + rate limit + status trigger | anon/seeker INSERT → RLS violation |
| 5 | Dead Express backend against phantom tables | No API server exists; logic in DB + Edge Functions | n/a (architectural) |
| 6 | Nested AuthProvider → role races | Single provider mandated in shared `@jooblie/core` auth package (Architecture.md) | code review rule |
| 7 | Dual profile-creation (trigger + Login.tsx insert) | Trigger is the only path; no client INSERT policy on profiles | client INSERT profiles → RLS violation |
| 8 | Frontend queried nonexistent `profile_views` | Table renamed `job_views`; generated TS types make phantom tables a compile error | `tsc` gate in CI |
| 9 | Role guards not exact-match | Exclusive role enum + exact-match guard in shared auth package; admin app physically separate | guard unit tests |
| 10 | `skills` text vs text[] mismatch | `text[]` on both profiles and jobs + GIN | type-level |
| 11 | `salary_min/max` text | `numeric(12,2)` + CHECK + `salary_period` | sort/filter integration test |
| 12 | Mocked features shipped as real | v1 scope excludes them (PRD §7); no mock data paths in production builds | review |
| 13 | No migrations / no types / dashboard-managed | Migrations-only workflow, generated types, `db reset` reproducibility (Acceptance #10) | CI: reset + type-gen diff clean |

## 6. RLS & Security Model (summary)

Full per-table matrix lives in the approved schema. Principles restated as binding rules:

1. One named policy per (table, role, operation): `{table}_{role}_{op}`. No catch-alls, no overlapping policies.
2. Helpers `is_admin()`, `is_company_member(cid)`, `is_suspended()` — SECURITY DEFINER, STABLE — the only sanctioned way to cross-reference tables inside policies (prevents recursive RLS).
3. Seeker jobs SELECT = public-active conditions **OR own application EXISTS OR own saved_job EXISTS** (FIX 1) — the applied/saved path intentionally bypasses status and company-suspension filters; UI labels the state.
4. `job_views` writes: with_check `viewer_id = auth.uid() OR (viewer_id IS NULL AND auth.uid() IS NULL)`; authenticated dedupe via generated `viewed_on date` + partial UNIQUE `(job_id, viewer_id, viewed_on)` + `ON CONFLICT DO NOTHING`; anon throttle trigger + frontend session guard (FIX 2; anon dedupe is best-effort — documented limitation).
5. `activity_log`: append-only by construction — no UPDATE/DELETE policies exist, grants revoked, writes only via table triggers.
6. Admin = full SELECT everywhere via explicit `_admin_select` policies (observability requirement), plus narrowly scoped UPDATEs (verification, suspensions, takedown). Admin never bypasses the audit trail: admin writes fire the same logging triggers.
7. Storage: see approved schema §12. All buckets and policies created in migrations only.

## 7. Email Dispatch Pipeline

Two disjoint channels:

**(A) Auth emails** (confirm, reset, email change): Supabase Auth → custom SMTP (Resend). Templates in Auth config; redirect = requesting domain. Never sent by our code.

**(B) App notification emails** (exactly three v1 events: seeker status-change, recruiter new-applicant, admin verification-request):

```
notification trigger INSERT (site_id already set per deep-link rule)
        │  pg_net http POST (async, non-blocking — DB txn never waits on email)
        ▼
Edge Function `email-dispatch`
        ├─ verifies shared secret header (function is not publicly invokable logic;
        │   secret stored in Supabase Vault, read via vault.decrypted_secrets in the
        │   pg_net caller — never a plain DB setting/GUC; config-checklist item)
        ├─ type ∈ EMAIL_ENABLED set? else no-op
        │  (deleted-recipient rows never exist — guarded at notification creation, §8 step 4b)
        ├─ idempotency: notifications.emailed_at IS NULL guard (retries safe)
        ├─ builds deep link: https://{sites.domain}/{route(entity)}   ← rule baked in data, not templates
        ├─ Resend API send (template per type)
        └─ UPDATE notifications.emailed_at (service role)
Failure path: pg_net failures logged; nightly pg_cron sweep re-posts notifications
where emailed_at IS NULL AND type ∈ EMAIL_ENABLED AND created_at > now()-72h.
```

Properties: at-least-once with idempotency stamp → effectively exactly-once; email outage degrades to in-app only; zero impact on user-facing transaction latency.

## 8. Account Deletion (FR22 — PIPEDA)

Deletion is a privileged multi-step operation → **Edge Function `account-delete`** (service role), invoked by the authenticated user (JWT verified in-function):

```
1. Guard: recruiter who is sole owner of an active company → reject with guidance
   (transfer ownership or close company first).
2. Storage: delete all objects under resumes/{uid}/ ; verification-docs untouched
   (company-owned).
3. profiles: PII scrub — full_name→'Deleted User', phone/headline/location/skills
   → NULL/'{}', default_resume_path→NULL, email→tombstone 'deleted+{uid}@jooblie.invalid',
   status='deleted' (enum extended: active|suspended|deleted).
4. Private data: DELETE notifications, saved_jobs (user-scoped, no third-party value).
4b. Recipient guard (system-wide, lives in notification-create triggers): no
   notification row is ever created for a recipient with profiles.status='deleted'.
   Rationale: a recruiter legitimately changing status on a deleted user's remaining
   application would otherwise generate an email to the tombstone address → Resend
   bounce → sender-reputation damage. The status change itself remains allowed
   (recruiter's pipeline is legitimate); only notification/email is skipped.
5. applications: rows REMAIN — applicant_id intact (FK NO ACTION); resume_path
   left as dangling reference by design (recruiter UI resolves missing object →
   "resume removed at applicant's request"); **cover_letter scrubbed** →
   '[removed at applicant's request]' (cover letters carry self-written PII —
   names/phone/email — PIPEDA erasure must cover them; consistent with the
   resume pattern). Status history in activity_log intact.
6. Auth: ban user (GoTrue admin API) — login permanently disabled. auth.users row
   retained in v1 (hard-delete v2).
7. activity_log('user.deleted', actor=self).
```

**FK policy (explicit, schema-binding):** `applications.applicant_id` → profiles: **NO ACTION**. `activity_log.actor_id` → profiles: **NO ACTION** (nullable only for system actors). `notifications.user_id` / `saved_jobs.user_id`: CASCADE acceptable (deleted in step 4 anyway). `profiles.id` → auth.users: CASCADE retained but unreachable in v1 (auth rows never deleted); revisit in v2 hard-delete design. RLS: `status='deleted'` treated as suspended-plus (all write helpers block; profile invisible to recruiters' applicant-join — the anonymized application row carries what recruiters see).

## 9. SEO & Prerendering

### 9.1 Canonical strategy (FR20)

- Canonical for every job = **origin site's** job URL. Jooblie's copy of a partner-origin job carries `rel=canonical` → partner URL. Jooblie-origin jobs: canonical = Jooblie.
- Rationale (documented product decision): partner brands' SEO equity is their core value proposition; Jooblie trades its own job-page rankings for network health.
- Frontends compute canonical from `origin_site_id` → `sites.domain` (generated types include sites); one shared helper in `@jooblie/core`.
- `JobPosting` JSON-LD mandatory on every job detail page (Google for Jobs is the primary organic channel for job boards): title, description, datePosted, validThrough (`expires_at`), employmentType, hiringOrganization (company), jobLocation / `jobLocationType: TELECOMMUTE` for remote, baseSalary (min/max, CAD, period), `directApply`.
- Per-site sitemap.xml: only that site's visible jobs (`job_sites`), regenerated on schedule; expired/closed/removed jobs drop out (404/410 with sensible UX for humans arriving late).

### 9.2 Prerendering architecture (v1)

Jooblie is on the Hostinger VPS behind nginx → bot-gating happens there; partner sites on external hosting proxy through the same prerender service or use the hosted tier — deployment detail settled in Architecture.md.

```
            request
               │
        nginx (per site)
               │ User-Agent ∈ botlist? (Googlebot, Bingbot, Slurp, DuckDuckBot,
               │  facebookexternalhit, Twitterbot, LinkedInBot …)
        ┌──────┴────────┐
        no               yes
        │                 │ proxy_pass → prerender service (Docker on VPS:
   serve SPA              │   headless Chromium, e.g. prerender/prerender)
   (static dist/)         │   ?url=https://{site}{path}
                          ▼
              rendered HTML (meta, canonical, JSON-LD) + cache (TTL ~24h,
              purge hook on job status change — nice-to-have, TTL acceptable v1)
```

- Rules: prerender only public GET routes (job lists, job detail, company pages, static pages); never auth/dashboard routes. `X-Prerender` header loop-guard. 404/410 status passthrough via `prerender-status-code` meta.
- Capacity note: one modest VPS prerender container is sufficient at launch scale (bots only, cached); monitor RAM (Chromium).
- **Future phase (Phases.md):** migrate public job-detail/list pages to SSR/SSG (Next.js or equivalent) per site; prerender layer then retires. JSON-LD + canonical helpers in `@jooblie/core` are framework-agnostic to survive that migration.

## 10. Environments, Backups & DR (NFR2/NFR7)

### 10.1 Environments

| Env | Supabase project | Tier | Purpose |
|-----|------------------|------|---------|
| develop | local (`supabase start`) | — | per-dev, disposable, `db reset` daily |
| staging | `jooblie-staging` | Free | integration, migration rehearsal, prerender testing |
| production | `jooblie-platform` | **Pro at launch** | live |

Migration flow: local → staging (CI apply) → production (manual approve, same artifacts). Config parity checklist (Auth allowlist, SMTP, Edge Function secrets, cron) tracked in Rules.md — these are dashboard-config items, the *only* sanctioned dashboard surface, and each is documented as code-adjacent checklist because they are not capturable in migrations.

### 10.2 Backups & DR

- **Database:** Pro daily automated backups (7-day retention baseline). **PITR: enable at launch** — decision rationale: applications/audit data loss window of 24h is unacceptable for a production job board; PITR add-on cost is small vs. re-earned trust. If deferred for budget, revisit trigger = first 100 real applications.
- **Storage (explicit — DB backups do NOT include bucket objects):** nightly **GitHub Actions scheduled workflow** (service role via GitHub Environments — the VPS is forbidden from holding the service key, so VPS cron is not an option; Architecture §5.4) syncs `resumes/` and `verification-docs/` to encrypted off-Supabase object storage (S3-compatible; Hostinger VPS is not the backup target — same-failure-domain rule). Retention 30 days. Deletion pipeline parity: account-deletion (FR22) must also purge the user's objects from the backup target on its next cycle (max 24h lag, documented in privacy terms) — backup retention must not silently defeat PIPEDA erasure.
- **Restore process (documented + rehearsed):** (1) restore DB to new project/PITR point; (2) storage restore from off-site copy; (3) re-point frontends via env var (`SUPABASE_URL`) — single variable per site by design; (4) Auth config re-apply from checklist. **Rehearsal: quarterly, staging-target, timed; first rehearsal is a launch-blocker task in Phases.md.**
- **Config as artifacts:** Edge Functions, cron schedules, and migrations are all in-repo — the DR story for logic is `git + supabase db push + functions deploy`.

## 11. Future-Proofing — Schema Landing Zones

Explicit map: v2 feature → where it lands without migration pain. (None of these have v1 logic.)

| Future item | Landing zone already in v2 schema |
|---|---|
| Audience cross-listing / multi-site targeting | `job_sites` junction — change insert-trigger logic + add recruiter UI; zero schema change |
| Jooblie→partner reverse flow | same junction |
| Join-existing-company / agencies | `company_members` composite PK already multi-user, multi-company |
| Per-site admins | nullable admin site-scope column reserved on profiles (unused v1) |
| Re-apply after withdraw/reject | replace absolute UNIQUE with partial unique + reapply flow (isolated migration) |
| Screening questions | new tables referencing jobs/applications; no changes to existing |
| Multi-country/currency | `salary_currency` generic; location columns generic; add country column + locale data |
| SSO/central auth | single user pool is the hard prerequisite — already true; SSO is pure frontend/auth-flow work |
| Email digests | notifications table already the event source; digest = new cron + dispatcher mode |
| Taxonomy admin CRUD | tables already dynamic; add policies + UI |
| Hard account deletion | v1 anonymization leaves auth row + NO ACTION FKs; v2 defines retention windows then physical purge |
| SSR migration | JSON-LD/canonical helpers framework-agnostic in `@jooblie/core`; prerender layer independently removable |

## 12. Open Risks (tracked, accepted for v1)

1. **Per-domain login friction** — accepted (D5); mitigated by messaging. SSO is the known v2 answer.
2. **Anon view-count integrity is best-effort** (FIX 2 limitation) — recruiter analytics labeled accordingly.
3. **Prerender cache staleness ≤24h** for bots — acceptable for job content; purge hook optional hardening.
4. **pg_net at-least-once** — idempotency stamp makes duplicates harmless; monitored via emailed_at sweep metrics.
5. **Free-tier staging drift vs Pro production** (extensions/limits parity) — parity checklist in Rules.md; PITR/backup behaviors untestable on staging, covered by restore rehearsal instead.
6. **Monitoring minimal at launch** — v1 set (uptime, synthetic prerender check, frontend error tracking, VPS resource alerts, weekly email-pipeline health) is a launch-blocker slice in Phases.md; deeper observability (structured metrics, tracing, dashboards) expands post-launch.
