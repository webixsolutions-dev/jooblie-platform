# AGENTS_GUIDE — Jooblie Platform

## Current State
- **Phase:** 1.9 (Seeds, resequenced ahead of config/storage) — COMPLETE
- **Active slice:** 1.8-slim — migrations 0012–0013 (config, cron, rate limits + storage)
- **Next slice:** 2.1 (email dispatch), after 1.8-slim completes Phase 1
- **Repo:** webixsolutions-dev/jooblie-platform

## Design Documents (read before any work)
- docs/PRD.md — product requirements, all sites, roles, flows
- docs/SystemDesign.md — architecture, multi-tenancy, auth, data flows, security, email pipeline, deletion, backups
- docs/Architecture.md — repo strategy, packages, deployment, CI/CD
- docs/Rules.md — dev workflow (MUST follow), migrations-only, git discipline, agent rules
- docs/Phases.md — build plan, current phase, slice definitions

## Architecture Invariants (never violate)
1. Single shared Supabase backend — no per-site databases
2. Job visibility: origin_site + Jooblie only (v1) — trigger-controlled
3. Profile creation: ONLY via DB trigger — no client INSERT
4. Clients never set: jobs.status, applications.status_updated_at, job_sites rows, activity_log, notifications
5. RLS policy naming: {table}_{role}_{op} — one per (table, role, op)
6. Generated types only — never hand-edit database.types.ts
7. Per-file git staging only — never git add . (Rules R3.2)
8. Normal changes use documented self-review; R4-flagged risky changes stop for external-architect review before merge (Rules R3.1/R4).

## Commands
- pnpm install — install all deps
- pnpm lint — lint all packages+apps
- turbo run typecheck — typecheck all packages+apps
- turbo run build — build all
- pnpm check:site-registry — verify registry/app metadata plus launched-site parity with migration 0011
- supabase start — local DB (Phase 1+)
- supabase db reset — reset from migrations (Phase 1+)
- pnpm gen:types — regenerate DB types (Phase 1+)

## In-Flight Notes
- **Phase 1.9 seeds were deliberately resequenced ahead of 1.8 in migration 0011.**
  The approved global taxonomy contains 5 sectors and 38 categories. The
  `skilled-trades-construction` category belongs to the unmapped `general-services`
  sector; no partner site has `sector_id = 5`. All 7 sites have fixed IDs, with
  `jooblie` fixed at id 1. Only Jooblie is marked `launched` in the build-time registry;
  the other six keep intended placeholder/current-host domains until their launches.
- **Dev fixtures are explicit and production-excluded.**
  `supabase/seed/seed_dev_users.sql` supplies four fixed local/staging users, verified
  and pending companies, and three active sample jobs. It is outside migrations and is
  not configured under `[db.seed]`, so CI reset and production `db push` never execute
  it; apply it manually only to disposable local/staging databases.
- **Phase 1.7 notifications + audit contract is implemented in migrations 0009–0010.**
  Notifications are minimal pointer payloads, suppress only deleted recipients, fan out
  new-applicant events to every company member, and distinguish fresh verification from
  resubmission with `data.resubmitted`. `activity_log` is append-only, retains company
  audit rows across company deletion with `ON DELETE SET NULL`, and attributes actors
  from `auth.uid()` while leaving system/cron writes unattributed. The internal
  `emit_notification` and `log_activity` helpers are not executable by clients.
- **Phase 1.6 applications contract is implemented in `0008_applications.sql`.** It
  creates `applications`, `saved_jobs`, and `job_views`; enforces immutable resume
  snapshots and the actor-aware `JB008` application transition graph; completes FIX 1
  with `has_applied()` / `has_saved()`; adds authenticated daily view dedupe + spoof
  guards; and adds recruiter application/profile/view boundaries without weakening
  anon profile isolation.
- **Phase 1.5 jobs contract is implemented in `0007_jobs.sql`.** It creates `jobs`,
  `job_sites`, the synchronous origin + Jooblie visibility trigger, server-derived
  publication state, the caller-agnostic `JB007` transition graph, protected column
  grants, RLS, FTS, and the verification-activation roll-forward for
  `admin_set_company_verification(...)`.
- **FIX 1 is complete in 0008.** `jobs_job_seeker_select` was replaced via DROP/CREATE
  and its own-application / own-saved branches intentionally bypass status,
  soft-delete, and company-suspension filters so seeker dashboards retain context.
- **DEFERRED — must land in slice 1.8:** application/job-post rolling-24-hour rate
  limits, job_views anonymous throttling, the private resume bucket + signed-URL
  policies, config-driven expiry, automatic expiry cron, the `expiry_reminder`
  notification type, and expiry/reminder cron. The 0007 insert/verification paths
  intentionally hardcode `interval '60 days'` until `platform_config` exists.
- **DEFERRED — later:** field-level job edit diffs and recruiter/seeker reads of
  `activity_log`. The v1 log records lifecycle events; broader audit detail and
  non-admin read surfaces require separate contracts.
- **DEFERRED — slice 2.1:** email dispatch, including the privileged writer that sets
  `notifications.emailed_at`. Migration 0009 supplies the pending-dispatch index only.
- **DEFERRED — v2:** recruiter-facing notification when a seeker withdraws. In v1 the
  status-change notification remains applicant-facing only; recruiters see withdrawals
  in their dashboard. Revisit this with notification digests.
- **Attribution validation decision — slice 2.1:** 0008 stores
  `applied_via_site_id` / `saved_via_site_id` for attribution but does NOT validate
  either value against `job_sites` membership. When email deep-links are designed in
  2.1, decide whether application/save INSERT needs an EXISTS(job_sites) WITH CHECK.
- **Phase 1.6/1.7 test maintenance:** `phase_1_6_applications.sql` and
  `phase_1_7_notifications_activity.sql` intentionally use absolute row counts for
  boundary and fan-out assertions. Adjust those counts whenever their fixtures are
  added or removed.
- **DEFERRED — later lifecycle/moderation slice:** recruiter close/renew RPCs, admin
  takedown/restore RPCs, and the job soft-delete RPC. `jobs.deleted_at` has no client
  write path in 0007. The transition trigger already accepts the required legal edges,
  but actor authorization and timestamp management belong in those definer RPCs.
- **DEFERRED — later admin moderation:** `jobs_admin_update`. Admin job writes must go
  through narrow SECURITY DEFINER RPCs; do not grant protected lifecycle columns to the
  shared `authenticated` role.
- **Seed coupling is locked by 0011:** `slug = 'jooblie'` has fixed id `1`, and the
  Phase 1.9 suite asserts it equals `public.jooblie_site_id()`. Job origin/junction
  visibility depends on this invariant; never renumber the row.
- **Generated types encode columns, not RLS or column grants.** The generated jobs
  Insert/Update shapes include protected fields such as `status`, `published_at`, and
  `expires_at`, even though clients cannot write them. Core query hooks in slice 3.2
  must expose narrowed insert/update payload types containing only granted columns;
  lifecycle fields remain server-derived and are never client-set.
- **ACCEPTED RISK (v1): `job_sites` SELECT uses `USING (true)`.** This exposes only an
  opaque job UUID + site tag for hidden jobs; `jobs` RLS remains the real data boundary.
  Revisit with stricter gating only if the metadata leak becomes material.
- **Moderation observation:** `companies.verification_status` has no state machine.
  Changing a verified company to rejected leaves its already-active jobs untouched;
  company suspension is the takedown tool. Revisit only in the moderation slice.
- **Company verification/moderation writes go through SECURITY DEFINER RPCs, not
  grants:** `admin_set_company_verification(company, status, reason)` and
  `admin_set_company_status(company, status)`. Same root cause as the profiles.status
  problem — grants are Postgres-role-wide, RLS is row-wide, admins share the
  `authenticated` role — but resolved differently, because admin company verification is
  a core v1 flow (Phases 1.4/A3) whereas admin profile suspension is not yet. Had
  `UPDATE(verification_status)` been granted, a recruiter could verify their OWN company
  through `companies_recruiter_update`, and from 1.5 onward that would auto-activate
  their pending jobs — self-service job posting with no review. There is deliberately
  **no `companies_admin_update` policy**; do not add one.
- The companies INSERT grant is **column-scoped** (`name, website, registration_number,
  verification_document_path, logo_path, description, created_by`) so a recruiter cannot
  create a company that is already `verified`/`active` — the protected columns cannot
  appear in the INSERT column list, so their defaults always apply. Preserve this pattern
  on any table where a default is a security boundary.
- `companies_recruiter_insert` requires `not public.is_suspended()`: a suspended or
  deleted recruiter must not be able to stand up a new company. Asserted for both
  statuses and mutation-proven.
- **Helper set is now 11.** The original five from 0003 plus `is_recruiter()` from 0006
  are joined by five STABLE SECURITY DEFINER helpers from 0008:
  `is_company_member_for_job`, `job_accepts_applications`, `has_applied`, `has_saved`,
  and `can_recruiter_view_applicant`. Cross-table policy lookups stay behind these
  empty-search_path helpers to avoid recursive RLS.
- **DEFERRED (future slice): company close / soft-delete path.** `companies.deleted_at`
  exists and every policy already filters on it (`deleted_at is null`), and the partial
  unique index on `lower(name)` deliberately frees a retired name for reuse. But there is
  **no client DELETE policy and no grant on `deleted_at`**, so nothing can currently set
  it — soft delete is reachable only by a service role. The owner-facing "close company"
  flow, including the sole-owner guard that SystemDesign §8 references from the
  account-deletion path, needs its own slice.
- **DEFERRED (view-based fix, before public company pages ship): non-member
  `registration_number` read.** `authenticated` holds a full-table SELECT grant on
  `companies` because members must read `registration_number` and
  `verification_document_path` on their own company, and column grants cannot distinguish
  member from non-member. RLS still filters rows, but a logged-in non-member can read
  those columns on a publicly-visible (verified+active) company. `anon` is already
  column-scoped and unaffected. Accepted for v1; the fix is a public company view with
  its own narrow grant, not a change to the grants on the base table.
- Company name uniqueness is `lower(name)` only — it does NOT collapse whitespace, so
  `' acme corp '` coexists with `'Acme Corp'`. Current behaviour is asserted in the test
  suite, so adding `trim()` later is a deliberate decision rather than a silent change.
- Test-writing note carried from 1.4: `unique_violation` alone is not a sufficient
  assertion for duplicate-name tests, because a primary-key collision raises the same
  SQLSTATE. Assert `constraint_name` via `get stacked diagnostics` so the test cannot
  pass for the wrong reason.
- **Recruiter applicant-profile boundary is complete in 0008.**
  `profiles_recruiter_select_applicant` uses the definer helper over applications,
  jobs, and company membership; unrelated recruiters see zero rows and deleted
  applicant profiles remain invisible while their application records survive.
- **DEFERRED (admin/moderation slice, 4.5): the admin `profiles.status` write path.**
  Column grants are Postgres-role-wide while RLS is row-wide, and admins authenticate
  as the same `authenticated` role as everyone else. Granting `UPDATE(status)` to
  `authenticated` would therefore also let a job_seeker clear their own suspension
  through `profiles_job_seeker_update`. 0005 consequently withholds `status` from every
  client grant, so `profiles_admin_update` currently reaches only the seven editable
  columns. Admin suspensions must go through a SECURITY DEFINER function or a
  service-role Edge Function — design that in the moderation slice, do not "fix" it by
  widening the grant. Ruled by Hasham during 1.3.
- **Signup ordering is now satisfied by migration 0011.** `profiles.signup_site_id` is
  NOT NULL with an FK to `sites`, and the signup trigger falls back to Jooblie id 1.
  `signup_site_id` stays NOT NULL — do not make it nullable.
- Phase 1.3 identity contract in `0005_profiles.sql`: the `on_auth_user_created` trigger
  is the ONLY profile-creation path (no client INSERT policy, no INSERT grant), the role
  whitelist is exact-match `job_seeker`/`recruiter` with no normalization (so `'Recruiter'`
  → `job_seeker`), and `anon` holds no privilege of any kind on `profiles`
  (remediation #3/#7). 0005 creates six policies; 0008 adds the seventh
  `profiles_recruiter_select_applicant` policy, also targeting `authenticated` only.
- Generated types cannot see column grants: `database.types.ts` marks `profiles.role`,
  `status`, `email`, and `signup_site_id` as optional in the `Update` shape, so
  `.update({ role: 'admin' })` compiles clean and fails only at runtime with `42501`.
  Close this in the `@jooblie/core` query slice (3.2) with a hand-written narrowed
  update type; the DB enforcement itself is correct and asserted.
- RLS test structure convention (carried from 1.2, preserve in 1.4+): `set local role`
  belongs at psql top level, never inside a `DO` block. A caught exception opens a
  subtransaction and GUC changes made inside one are rolled back on abort, so a role
  switch inside an exception-handling block silently reverts mid-test.
- Phase 1.3 was verified by mutation-testing the suite, not only by running it green:
  seven deliberate regressions (status grant leak, whitelist removed, whitelist admitting
  `admin`, site fallback changed, anon SELECT policy, client INSERT policy, and a `PUBLIC`
  catch-all policy with the policy count held at 6) were each confirmed to fail the suite.
  Recommended practice for the remaining RLS-heavy slices — a suite built on
  `exception when insufficient_privilege then null` can otherwise pass by swallowing
  failures for the wrong reason.
- Phase 1.2 adds schema-only reference tables in `0004_reference.sql`: `sectors`, `categories`, and `sites`. All three expose one public-read SELECT policy to `anon` and `authenticated`; clients have no INSERT/UPDATE/DELETE policies. Their approved rows are seeded by migration `0011`.
- Phase 1.1 defines all approved helpers in `0003_helpers.sql`; none were deferred. The table-dependent PL/pgSQL bodies resolve `profiles`/`company_members` when called, so do not call those helpers before slices 1.3/1.4 create the referenced tables.
- Phase 1.1 uses the custom `public.set_updated_at()` trigger function from `0003_helpers.sql`; the `moddatetime` extension is not enabled.
- `.github/workflows/ci.yml` now restores the Phase 0.3 Supabase database gate alongside
  the Phase 0.2 quality pipeline. Database-relevant PRs start and reset local Supabase,
  verify generated types, and run the cumulative RLS suites. The runner dynamically
  discovers every `*.sql`/`*.pg` file under `supabase/tests`, sorts the displayed list,
  and executes each assertion-style script through `psql` with `ON_ERROR_STOP=1`; there
  is no explicit manifest. These suites are not pgTAP, so do not route them through
  `supabase test db`/`pg_prove`. `workflow_dispatch` runs both the full monorepo quality
  gates and database gate.
- Root CI/config/script files are Turborepo global dependencies, so a root-only PR (including the initial CI PR) verifies all workspaces instead of selecting zero tasks.
- Local verification passed on 2026-07-17: frozen install; affected-mode selected all workspaces; 25/25 lint+typecheck tasks; site registry (7 public sites + admin); 11/11 build tasks; workflow YAML parse; `git diff --check`.
- Draft PR #1 (`codex/phase-0-2-ci-skeleton`) ran the real GitHub Actions workflow successfully: `Quality gates` passed in 51 seconds.
- The site-registry check validates registry ↔ app/env consistency and parses migration
  0011 for launched-site slug/id/domain parity. Non-launch sites are deliberately
  excluded from seed parity until their real domains are approved.
- GitHub CLI authentication is working as `hashhaam`. The account has `push` but not `admin/maintain` permission. API checks confirmed:
  - `main` has no branch protection and no repository/org ruleset.
  - creating `staging` and `production` Environments returns `403 Must have admin rights to Repository`.
  - updating `main` branch protection returns `404 Not Found` for the write-only collaborator; repository admin access is required.
- Repo admin must finish 0.2 by:
  1. Protecting `main`: pull request required, `Quality gates` required and strict/up-to-date, linear history required, conversation resolution required, force-push/delete disabled.
  2. Creating `staging` and `production` GitHub Environment shells.
  3. Adding `hashhaam` as the production required reviewer.
  4. Confirming direct push to `main` is rejected after protection is enabled.
- CI workflow changes are R4-risky. Hasham provided explicit proceed approval; the reviewed change is published in draft PR #1 and requires the mandatory second-human review before merge.
