# Jooblie Platform

A multi-site job board network built on a single shared Supabase backend.

**Jooblie** is the aggregator: every job posted on any partner site appears on Jooblie
under the correct category. Six sector/audience partner sites each show only their own
jobs. Visibility flows one way—partner → Jooblie, never the reverse (v1).

| Site                             | Slug                     | Type       |
| -------------------------------- | ------------------------ | ---------- |
| Jooblie                          | `jooblie`                | aggregator |
| Office Jobs Jobline              | `office-jobs`            | sector     |
| IT Jobs Jobline                  | `it-jobs`                | sector     |
| Hospitality & Healthcare Jobline | `hospitality-healthcare` | sector     |
| Transportation & Farming Jobline | `transport-farming`      | sector     |
| Aboriginal Jobline               | `aboriginal`             | audience   |
| New Comers Jobline               | `newcomers`              | audience   |

Plus an eighth frontend: the admin app (no `sites` row—it reads unfiltered).

---

## Architecture in one paragraph

One Supabase project holds everything. Multi-tenancy is a `jobs.origin_site_id` column
plus a `job_sites` junction table, written exclusively by a database trigger: a job
posted on a partner site gets exactly two junction rows (its origin + Jooblie); a job
posted on Jooblie gets one. There is no sync code and no per-site database. Every access
rule lives in Postgres RLS, so the frontends hold no authorization logic—site filtering
in the UI is presentation, not security.

---

## Repo layout

```text
jooblie-platform/
├─ apps/                    # 8 Vite SPAs (7 sites + admin)
│  ├─ jooblie/              #   the aggregator
│  ├─ office-jobs/  it-jobs/  hospitality-healthcare/
│  ├─ transport-farming/  aboriginal/  newcomers/
│  └─ admin/
├─ packages/
│  ├─ core/                 # @jooblie/core — client, auth, query hooks, generated types
│  ├─ ui/                   # @jooblie/ui — shared presentational components
│  └─ config/               # tsconfig / eslint / tailwind presets
├─ supabase/
│  ├─ migrations/           # 0001…0012 — the only way schema changes
│  ├─ seed/                 # seed_dev_users.sql (local/staging only, never production)
│  └─ tests/                # psql assertion suites, one per phase
├─ scripts/
│  ├─ ci/                   # database-change detection
│  ├─ check-database-types.sh
│  ├─ check-site-registry.mjs
│  └─ run-rls-tests.sh
├─ docs/                    # PRD · SystemDesign · Architecture · Rules · Phases
├─ AGENTS_GUIDE.md          # current slice, invariants, deferred work
├─ turbo.json
└─ pnpm-workspace.yaml
```

## Stack

React 19 · Vite · TypeScript · Tailwind v3 · React Router v7 · TanStack Query v5 ·
supabase-js · Turborepo + pnpm workspaces · PostgreSQL (Supabase)

Backend-critical dependencies are exact-pinned: `supabase-js`, `@tanstack/react-query`,
`react-router-dom`, and `tailwindcss`.

---

## Getting started

**Prerequisites:** Node 20, pnpm, Docker (for the local Supabase stack), and the
Supabase CLI.

```bash
pnpm install

# Start the local stack (Postgres, Auth, Storage, Studio, Mailpit).
supabase start

# Apply all migrations from scratch—this is the source of truth.
supabase db reset

# Load disposable dev users, companies, and sample jobs (not a migration by design).
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -f supabase/seed/seed_dev_users.sql
```

Then create an env file for the app you're working on:

```bash
cd apps/jooblie
cp .env.example .env.local
```

```ini
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<publishable key from `supabase status`>
VITE_SITE_SLUG=jooblie
```

`VITE_SITE_SLUG` is the only site-identity switch—everything else (id, domain, name,
theme) is looked up from `packages/core/src/site-registry.ts`, which CI cross-checks
against the seeded `sites` rows.

From the repository root:

```bash
pnpm dev --filter=@jooblie/jooblie
```

Useful local URLs come from `supabase status`: Studio lets you browse data, while
Mailpit catches auth emails. The anon/publishable key is the only key that belongs in
a frontend env; the secret/service-role key never goes in an app, a VPS, or the repo.

---

## Non-negotiable invariants

1. **Single shared Supabase.** No per-site databases.
2. **Job visibility is trigger-controlled**—origin site + Jooblie only (v1).
3. **Profiles are created only by the signup database trigger.** Clients never insert
   into `profiles`; the trigger whitelists roles, so `admin` can never be self-assigned
   through signup metadata.
4. **Clients never write** `jobs.status`, application status timestamps, `job_sites`
   rows, `activity_log`, `notifications`, or company verification/status. These are
   server-derived and blocked by column grants plus RLS.
5. **RLS policy naming:** `{table}_{role}_{op}`, one policy per (table, role, op), no
   catch-alls.
6. **`packages/core/src/database.types.ts` is generated**—never hand-edited. CI diffs it.
7. **Apps never import `@supabase/supabase-js` directly.** The single client lives in
   `@jooblie/core`, and an ESLint rule enforces it.
8. **Storage paths are a contract.** Ownership is derived from the first path segment:
   - `resumes/{user_id}/{uuid}-{filename}`
   - `company-logos/{company_id}/{uuid}-{filename}`
   - `verification-docs/{company_id}/{uuid}-{filename}`

   Private buckets are reachable only through short-lived signed URLs.

---

## Database workflow

Every schema object—tables, enums, indexes, triggers, functions, RLS policies, storage
buckets, and their policies—is created only by a file in `supabase/migrations/`.
Nothing is ever created from the Supabase dashboard, not even "just to test."

```bash
supabase migration new <verb_object>  # Write SQL.
supabase db reset                     # Prove it applies to a clean database.
pnpm gen:types                        # Regenerate database.types.ts.
./scripts/run-rls-tests.sh            # Run every assertion suite.
```

Migrations are **append-only**. A merged migration file is never edited; a mistake is
corrected by a new forward migration. There are no down migrations.

### Migration ledger

| #    | Contents                                                                 |
| ---- | ------------------------------------------------------------------------ |
| 0001 | extensions                                                               |
| 0002 | enums                                                                    |
| 0003 | helper functions (`is_admin`, `is_company_member`, `is_suspended`, …)    |
| 0004 | reference tables: sectors, categories, sites                             |
| 0005 | profiles + signup trigger (role whitelist) + email sync                  |
| 0006 | companies, company_members, owner/resubmit triggers, admin RPCs          |
| 0007 | jobs, job_sites + visibility trigger, status machine, FTS, indexes       |
| 0008 | applications, saved_jobs, job_views, transition trigger, seeker read fix |
| 0009 | notifications + deleted-recipient guard + fan-out triggers               |
| 0010 | append-only activity_log + audit triggers                                |
| 0011 | seed: 5 sectors, 38 categories, 7 sites                                  |
| 0012 | storage buckets + access policies                                        |

## Testing

Suites live in `supabase/tests/` as psql assertion scripts and run in sorted order with
`ON_ERROR_STOP=1`; the runner discovers files dynamically. Each suite asserts both the
positive and the negative case—what a role _can_ do and what every other role _cannot_.
Security-critical protections are additionally proven by mutation testing: the
protection is temporarily broken, the test is confirmed to fail, and the break is
reverted.

## CI

Pull requests run: lint · typecheck · a clean `supabase db reset` · a generated-types
drift gate · the full RLS suite · a site-registry ↔ seed cross-check · affected builds.
`main` is protected: PR required, green CI required, no direct or force pushes.

Changes touching RLS, auth flows, triggers, status machines, storage policies, CI
workflows, or `profiles.role` are flagged risky and require a second reviewer before
merge. Everything else follows a documented self-review path.

## Deployment

Frontends build to static bundles. Jooblie deploys to Vercel; the longer-term topology
puts all sites behind one nginx instance on a VPS with partner domains pointed at it.
Database migrations are pushed by CLI or CI—production deploys are always manually
approved.

---

## Documentation

| File                   | What it answers                                          |
| ---------------------- | -------------------------------------------------------- |
| `docs/PRD.md`          | What the product does; user stories; acceptance criteria |
| `docs/SystemDesign.md` | Schema, RLS model, triggers, email, deletion, storage    |
| `docs/Architecture.md` | Repo strategy, package boundaries, deployment, CI/CD     |
| `docs/Rules.md`        | Normative workflow rules for humans and agents           |
| `docs/Phases.md`       | The build plan, slice by slice                           |
| `AGENTS_GUIDE.md`      | Current slice, live invariants, deferred items           |

Read `AGENTS_GUIDE.md` first—it carries the working state between sessions.
