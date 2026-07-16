# AGENTS_GUIDE — Jooblie Platform

## Current State
- **Phase:** 0.3 (CI DB gate) — IN PROGRESS
- **Previous slice:** 0.2 CI accepted; repository-admin hardening is tracked separately by the repository owner
- **Next slice:** 1.1 (Base migrations), only after 0.3 is verified
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

## Commands
- pnpm install — install all deps
- pnpm lint — lint all packages+apps
- turbo run typecheck — typecheck all packages+apps
- turbo run build — build all
- pnpm check:site-registry — verify 7 public-site registry entries, app directories, and VITE_SITE_SLUG values
- pnpm db:start — start the local Supabase Postgres container
- pnpm db:reset — recreate the local database from migrations
- pnpm gen:types — safely regenerate committed database types
- pnpm check:db-types — fail when committed types differ from the local schema
- pnpm test:rls — run pgTAP/RLS tests; succeeds with zero tests during Phase 0.3
- pnpm db:stop — stop local Supabase without saving a backup

## In-Flight Notes
- Phase 0.3 is being developed on `codex/phase-0-3-ci-db-gate`, stacked on the Phase 0.2 branch.
- Supabase CLI is exact-pinned at `2.109.1`; GitHub Actions uses official `supabase/setup-cli@v3`.
- CI detects database-relevant paths, starts a fresh local Postgres container, runs `db reset`, checks generated-type drift, and invokes the RLS harness.
- Local machine has no Docker-compatible runtime, so the real `db start`/`db reset` acceptance proof must run on the GitHub Actions Ubuntu runner. CLI version and zero-test harness are locally verified.
- Phase 0.3 stale-types negative test passed as designed on PR #2: local DB start/reset succeeded, then `Database gates` failed only on the placeholder type diff. The CI-generated types are now committed; final green rerun is pending.
- `.github/workflows/ci.yml` implements the Phase 0.2 PR pipeline: frozen install, affected lint/typecheck, site-registry contract check, and affected builds. `workflow_dispatch` runs the full monorepo.
- Root CI/config/script files are Turborepo global dependencies, so a root-only PR (including the initial CI PR) verifies all workspaces instead of selecting zero tasks.
- Local verification passed on 2026-07-17: frozen install; affected-mode selected all workspaces; 25/25 lint+typecheck tasks; site registry (7 public sites + admin); 11/11 build tasks; workflow YAML parse; `git diff --check`.
- Draft PR #1 (`codex/phase-0-2-ci-skeleton`) ran the real GitHub Actions workflow successfully: `Quality gates` passed in 51 seconds.
- The site-registry check currently validates registry ↔ app/env consistency. Migration `0014` does not exist in Phase 0.2; extend this same check with registry ↔ DB seed comparison in Phase 1.9.
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
