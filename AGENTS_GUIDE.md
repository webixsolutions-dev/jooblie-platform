# AGENTS_GUIDE — Jooblie Platform

## Current State
- **Phase:** 0.1 (Repo scaffold) — COMPLETE
- **Next slice:** 0.2 (CI skeleton)
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
- turbo run typecheck — typecheck all packages+apps
- turbo run build — build all
- supabase start — local DB (Phase 1+)
- supabase db reset — reset from migrations (Phase 1+)
- pnpm gen:types — regenerate DB types (Phase 1+)

## In-Flight Notes
(empty — update per slice)
