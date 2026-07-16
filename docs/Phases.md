# Phases — Jooblie Platform Build Plan


**Operating rule:** one slice at a time, verified before the next (Rules R7.2/R7.5). Every slice ends at Definition of Done (Rules §9). Acceptance checks below are the slice-specific "step 3" of DoD.
**Effort key:** S ≤ half day · M ≈ 1–2 days · L ≈ 3–5 days (focused, agent-assisted).

---

## Phase 0 — Foundation (repo before any SQL)

| Slice | Deliverable | Acceptance check | Deps | Effort |
|---|---|---|---|---|
| 0.1 Repo scaffold | Monorepo per Architecture §1.1: pnpm workspaces, Turborepo, empty `apps/*` placeholders, `packages/config` (tsconfig/eslint/tailwind preset), `packages/core` + `packages/ui` skeletons, `supabase init`, AGENTS_GUIDE.md v1, PR template (R3.4) | `pnpm install && turbo run typecheck` green on clean clone; AGENTS_GUIDE.md states current slice | — | M |
| 0.2 CI skeleton | `ci.yml` per Architecture §5.1 steps 1–2 + 4–5 (db-gate lands in 0.3); branch protection on `main`; GitHub Environments (staging/production shells, production required-reviewer) | PR from scratch branch runs lint/typecheck/build; direct push to main rejected | 0.1 | S |
| 0.3 CI db-gate | Local Supabase in CI: `db reset` + type-gen diff gate + empty RLS-suite harness (`supabase/tests/` runner wired, zero tests yet) | PR touching `supabase/` triggers gate; deliberately stale types file fails CI (negative test performed once, reverted) | 0.2 | M |

## Phase 1 — Database (migrations 0001→0014, grouped; each group = slice)

Har slice: migration files + pgTAP/psql tests same PR (Rules R5). Types regenerate har slice pe. **RLS-heavy slices (1.3–1.6) = R4 risky → mandatory second-human review (ADJ 1).**

| Slice | Migrations | Deliverable | Acceptance check | Deps | Effort |
|---|---|---|---|---|---|
| 1.1 Base | 0001–0003 | extensions, enums, helpers (`is_admin`, `is_company_member`, `is_suspended`, `immutable_arr_join`, updated_at fn) | `db reset` clean; helper unit asserts (definer/stable verified via catalog query) | 0.3 | S |
| 1.2 Reference | 0004 | sectors, categories, sites + read-only RLS | anon SELECT works; any INSERT/UPDATE as client fails (pgTAP) | 1.1 | S |
| 1.3 Identity ⚠ | 0005 | profiles, signup trigger (**strict role whitelist**), email-sync trigger, column grants, RLS, `status` enum incl. `deleted` | pgTAP: metadata role `admin`/garbage → `job_seeker`; invalid site → Jooblie; client UPDATE on role/status fails; client INSERT profiles fails; anon SELECT profiles = 0 rows (remediation #3/#7 regression) | 1.2 | M |
| 1.4 Companies ⚠ | 0006 | companies (+`lower(name)` unique), company_members, owner-trigger, verify→auto-activate trigger, resubmit trigger, RLS | pgTAP: duplicate name blocked; creator becomes owner; verify flips pending jobs (asserted after 1.5 via cross-test); reject requires reason | 1.3 | M |
| 1.5 Jobs ⚠ | 0007 | jobs (FTS generated column, all indexes incl. FIX 4 composite), job_sites + **visibility trigger (origin+Jooblie contract)**, status machine, RLS incl. FIX 1 seeker-select | pgTAP: insert on partner-origin → exactly 2 junction rows, Jooblie-origin → 1; client status write fails; illegal transitions raise; seeker sees own applied/saved expired job (FIX 1) — applied-path test lands with 1.6, saved-path here | 1.4 | L |
| 1.6 Applications ⚠ | 0008 | applications (UNIQUE job+applicant), transition trigger (withdrawn=seeker-only), saved_jobs, job_views (FIX 2 guards: with_check, viewed_on dedupe, anon throttle), RLS incl. recruiter→applicant-profile EXISTS policy | pgTAP: duplicate apply = constraint error; recruiter can't set withdrawn; seeker can't set shortlisted; unrelated recruiter sees zero applications/profiles; view spoof (viewer_id ≠ auth.uid) fails | 1.5 | L |
| 1.7 Notify + audit | 0009–0010 | notifications (deep-link site_id rule + **FIX B deleted-recipient guard** baked in triggers), FIX 3 all-members fan-out, activity_log + all AFTER-triggers, append-only construction | pgTAP: status change → notification site_id = applied_via; new applicant → N rows for N members; deleted-status recipient → 0 rows; activity_log UPDATE/DELETE fails for every role | 1.6 | M |
| 1.8 Config + cron + storage ⚠ | 0011–0013 | platform_config seeds, rate-limit BEFORE-triggers (rolling 24h), pg_cron expiry + reminder + email-retry sweep, **storage buckets + policies (private resumes, signed-URL model)** | pgTAP: 21st apply in 24h raises clean error code; anon resume GET fails; unrelated recruiter resume SELECT fails; applied-to recruiter succeeds (remediation #1/#2 regression); referenced-resume DELETE blocked | 1.7 | L |
| 1.9 Seeds | 0014 + dev seed | 7 sites rows (fixed IDs, real domains), **taxonomy from Hasham's list** (input needed — flag), dev users file | site-registry cross-check green; `db reset` end-state = full backend (Acceptance #10) | 1.8 | S |

**Phase 1 exit:** RLS suite = executable Legacy Remediation Map; full backend from `db reset` alone.

## Phase 2 — Backend logic outside Postgres

| Slice | Deliverable | Acceptance check | Deps | Effort |
|---|---|---|---|---|
| 2.1 email-dispatch ⚠ | Edge Function per SystemDesign §7 (Vault secret verify, EMAIL_ENABLED filter, idempotency, Resend templates ×3, deep-link builder) | `functions serve`: sample payload → send logged; duplicate post → single send; wrong secret → 401; staging end-to-end: status change → real email with correct domain link | 1.9 | M |
| 2.2 account-delete ⚠ | Edge Function per SystemDesign §8 incl. FIX A cover_letter scrub, sole-owner guard, storage purge, GoTrue ban | Staging: deleted user can't log in; resume objects gone; application row anonymized (cover letter scrubbed); activity_log intact (Acceptance #11) | 1.9 | M |
| 2.3 Staging env bring-up | `jooblie-staging` project: CI `db push`, functions deploy, config checklist C1–C5+C8 applied (**incl. staging.{slug} allowlist — C1 NIT**), Inbucket→Resend staging sender | Full checklist signed off in `infra/config-checklist.md` PR; smoke: signup on staging URL → confirmation email → callback lands | 2.1, 2.2 | M |

## Phase 3 — Shared packages

| Slice | Deliverable | Acceptance check | Deps | Effort |
|---|---|---|---|---|
| 3.1 core: client + auth | `createSupabaseClient`, single AuthProvider, `useAuth`, `useRequireRole` exact-match, session helpers, site-registry | Guard unit tests (remediation #9); typecheck green against generated types | 1.9 | M |
| 3.2 core: queries + constants | Domain hooks (jobs/apply/applications/company/notifications/saved), error-code map (rate-limit, duplicate-apply → user messages), constants catalog | Hook tests against local Supabase (happy + RLS-denied paths); duplicate-apply surfaces "Already applied" | 3.1 | L |
| 3.3 core: seo | `canonicalUrl`, `jobPostingJsonLd` (framework-agnostic) | Unit tests: partner-origin job on Jooblie → canonical = partner URL; remote job → TELECOMMUTE; salary block correct | 3.1 | S |
| 3.4 ui package | Shared components (JobCard/List/filters/ApplyModal/dashboard tables/NotificationBell/layout) on theme tokens | Storybook-or-equivalent render pass; tokens switch verified on 2 themes | 3.2 | L |

## Phase 4 — Applications (frontends)

| Slice | Deliverable | Acceptance check | Deps | Effort |
|---|---|---|---|---|
| 4.1 **Existing frontends migration** (explicit slice) | Saatōn existing SPAs monorepo `apps/*` mein: import paths → packages, duplicate local auth/client code **deleted** (core is the only path), builds green. Functional parity only — no feature work in this slice | `turbo run build` all apps; each app dev-runs against local stack; grep-gate: zero direct `createClient` imports outside core | 3.1–3.4 | L |
| 4.2 Jooblie app wiring | Aggregator: unfiltered listings, search/filters, job detail (canonical+JSON-LD), auth flows, seeker dashboard (S5–S9 incl. all-status applied/saved labels), apply flow | Acceptance #2/#3 manually demonstrated on staging; FIX 1 UI labels visible on an expired applied job | 4.1, 2.3 | L |
| 4.3 Partner template + 6 rollout | One partner fully wired (site-filtered via `VITE_SITE_SLUG`), then 6× config/theme stamp-out | Job posted on partner staging → visible partner + Jooblie only (Acceptance #1); other partners clean | 4.2 | L |
| 4.4 Recruiter flows | R1–R8 across apps: forced company step, post form (taxonomy dropdown, numeric salary), applicant management (signed-URL resume), lifecycle (close/renew), per-site views | Acceptance #4/#5 demonstrated; FIX 3 multi-member notification observed | 4.3 | L |
| 4.5 Admin app ⚠ | 8th frontend: verification queue, jobs/applications explorers, activity browser, moderation (A5), config editor | Acceptance #7 demonstrated end-to-end by Hasham on staging | 4.4 | L |
| 4.6 Account deletion UI | S10 flow in apps (confirmation UX, sole-owner guidance path) → 2.2 function | Acceptance #11 re-run through UI | 4.5, 2.2 | S |

## Phase 5 — Infra & launch hardening

| Slice | Deliverable | Acceptance check | Deps | Effort |
|---|---|---|---|---|
| 5.1 VPS + nginx + TLS ⚠ | 8 vhosts, staging.{slug} vhosts, certbot, release-dir deploys, deploy-staging.yml end-to-end | Staging URLs live over TLS; symlink rollback demonstrated once | 4.3 | M |
| 5.2 Prerender ⚠ | Docker prerender service, nginx bot-gating include (admin excluded), cache TTL | Acceptance #9: bot-UA curl → JSON-LD + canonical; normal UA → SPA; admin vhost never prerendered | 5.1 | M |
| 5.3 Sitemaps | `generate-sitemaps` script + VPS cron + post-deploy hook (Architecture FIX 2) | Each site's sitemap 200, only its jobs; regenerates post-deploy | 5.2 | S |
| 5.4 Backups ⚠ | `storage-backup.yml` scheduled workflow (service key in GH Env only) + deletion-purge parity step | Manual run → objects on off-site target; deleted user's files absent after next run | 2.2, 0.2 | M |
| 5.5 deploy-production.yml | Production pipeline per Architecture §5.3 (manual approve, same artifacts, post-deploy checks) | Dry-run against empty production project | 5.1 | S |

## Phase 6 — LAUNCH BLOCKERS (explicit gate — sab green, tabhi launch)

| # | Blocker | Acceptance check | Deps | Effort |
|---|---|---|---|---|
| LB1 | **Monitoring/alerting v1** (ADJ 2): uptime checks 8 domains · daily synthetic bot-UA curl asserting JSON-LD · Sentry-class error tracking on all frontends · VPS disk/RAM alerts · weekly email-pipeline health (emailed_at NULL backlog + Resend bounce report) | Each alert test-fired once (forced failure or test hook); runbook links in alerts | 5.x | M |
| LB2 | **Restore rehearsal #1** (NFR7): DB restore to scratch project + storage restore + frontend re-point, timed, runbook corrected | Rehearsal report committed (`infra/scripts/restore-runbook.md` updated with actuals) | 5.4 | M |
| LB3 | **C6: Production Pro + daily backups + PITR enabled** | Dashboard state matches checklist; PITR window confirmed | — | S |
| LB4 | **Production config checklist full pass** (C1 production domains allowlist, C2/C3 sender, C4/C5 secrets, C7, C8) | Checklist PR signed off; signup/reset tested on 2 production domains | 5.5 | S |
| LB5 | **Seed taxonomy final** (Hasham's list in 0014) + sites rows on real production domains | Taxonomy reviewed row-by-row by Hasham; registry cross-check green on production build | 1.9 | S |
| LB6 | Full acceptance sweep: PRD §8 items 1–11 executed on production (pre-DNS or maintenance window) | Signed checklist in repo | all | M |

## Phase 7 — Post-launch / v2 backlog (from SystemDesign §11, priority-ordered proposal)

1. **SSO / central auth** — per-domain login friction is the #1 accepted UX debt (Risk 1).
2. **Audience cross-listing + multi-site targeting UI** — the `job_sites` payoff; trigger-logic + recruiter UI only.
3. **SSR migration of public pages** (per-site, incremental) → retire prerender layer.
4. Join-existing-company / agency flows.
5. Re-apply after withdraw/reject (partial-unique migration + flow).
6. Email digests (notifications as event source).
7. Monitoring expansion (metrics/tracing/dashboards — Risk 6).
8. Hard account deletion (retention windows + physical purge).
9. Screening questions.
10. Taxonomy admin CRUD.
11. Multi-country/currency · multi-language.
12. Per-site admins (reserved column activation).

---

## Sequencing notes

- Critical path: 0 → 1 → (2 ∥ 3) → 4 → 5 → 6. Phase 2 and 3 parallelize across Hasham/Babar/agents; Phase 1 is intentionally serial (each group builds on prior objects, one verified step at a time).
- ⚠ marks R4-risky slices → mandatory second-human review (Rules R3.1 exception), stop-before-commit protocol.
- **Open input needed from Hasham (blocking 1.9/LB5):** initial taxonomy list (sectors → categories) aur partner sites ke final production domain strings.
- Rough total: ~19 slices + 6 blockers; L=9, M=13, S=9 → realistic calendar with parallelization: **6–8 focused weeks** to LB6, agent-assisted. Ye estimate hai, commitment nahi — slice-level verification pace decide karegi.
