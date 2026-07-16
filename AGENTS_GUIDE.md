# AGENTS_GUIDE — Jooblie Platform

## Current State
- **Phase:** 0.2 (CI skeleton) — CODE COMPLETE, GITHUB ADMIN SETUP BLOCKED
- **Active slice:** 0.2 until the GitHub settings and real-PR acceptance check are complete
- **Next slice:** 0.3 (CI DB gate), only after 0.2 is fully accepted
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
- supabase start — local DB (Phase 1+)
- supabase db reset — reset from migrations (Phase 1+)
- pnpm gen:types — regenerate DB types (Phase 1+)

## In-Flight Notes
- `.github/workflows/ci.yml` implements the Phase 0.2 PR pipeline: frozen install, affected lint/typecheck, site-registry contract check, and affected builds. `workflow_dispatch` runs the full monorepo.
- Root CI/config/script files are Turborepo global dependencies, so a root-only PR (including the initial CI PR) verifies all workspaces instead of selecting zero tasks.
- Local verification passed on 2026-07-17: frozen install; affected-mode selected all workspaces; 25/25 lint+typecheck tasks; site registry (7 public sites + admin); 11/11 build tasks; workflow YAML parse; `git diff --check`.
- The site-registry check currently validates registry ↔ app/env consistency. Migration `0014` does not exist in Phase 0.2; extend this same check with registry ↔ DB seed comparison in Phase 1.9.
- GitHub CLI authentication is working as `hashhaam`. The account has `push` but not `admin/maintain` permission. API checks confirmed:
  - `main` has no branch protection and no repository/org ruleset.
  - creating `staging` and `production` Environments returns `403 Must have admin rights to Repository`.
  - branch-protection update is inaccessible without repository admin rights.
- Repo admin must finish 0.2 by:
  1. Protecting `main`: pull request required, `Quality gates` required and strict/up-to-date, linear history required, conversation resolution required, force-push/delete disabled.
  2. Creating `staging` and `production` GitHub Environment shells.
  3. Adding `hashhaam` as the production required reviewer.
  4. Running a scratch-branch PR and confirming `Quality gates` passes and direct push to `main` is rejected.
- CI workflow changes are R4-risky. Do not commit until Hasham reviews the diff and explicitly says `proceed`.
