# Rules — Jooblie Platform Dev Workflow

**Applies to:** every human and every agent touching `jooblie-platform`.
Ye document normative hai — "MUST/NEVER" yahan literal hain. Violations = PR rejected, chahe code "kaam kar raha ho".

---

## 1. Migrations-Only Database Workflow

**R1.1** Every schema object — tables, columns, enums, indexes, constraints, triggers, functions, RLS policies, **storage buckets and storage policies**, cron schedules, Vault references — is created and changed **only** via files in `supabase/migrations/`. Zero exceptions.

**R1.2 NEVER** create/alter anything from the Supabase dashboard SQL editor or table editor — not on local, not on staging, not on production, not "just to test". Testing = local `supabase start` + migration file + `db reset`. (Legacy project mein sab dashboard se hua tha; wo poori bug-class isi rule se band hoti hai.)

**R1.3** New migration: `supabase migration new <verb_object>` → SQL likho → `supabase db reset` locally → generated types regenerate (R2.1) → RLS suite pass → PR. Migrations are **append-only**: merged migration file kabhi edit nahi hoti; galti = nayi corrective migration (roll-forward-only, Architecture A7).

**R1.4** One migration = one concern. Table + uske apne triggers/RLS ek file mein theek hai (approved breakdown pattern); unrelated changes ek file mein nahi.

**R1.5** Enforcement (mechanical, not honor-system):
- CI `db reset` gate — migration jo clean project pe apply nahi hoti, merge nahi hoti (Acceptance #10 continuously proven).
- CI type-diff gate (R2.1) — dashboard-drift ya stale types dono fail.
- Weekly drift canary (Architecture §5.4).
- Staging/production pe `db push` sirf CI se — team members ke paas production DB ka direct write access routine mein nahi hota; console access break-glass only, use hone pe activity note in PR/issue.

## 2. Generated Types

**R2.1** `packages/core/database.types.ts` is **generated, committed, and CI-diffed**. Schema change PR MUST include regenerated types (`pnpm gen:types` → `supabase gen types typescript --local`). Hand-editing this file is forbidden; CI diff gate catches both hand-edits and stale copies.

**R2.2** Frontend code MUST type queries from generated types. `any`-casting around a DB type error = PR rejected — wo error phantom-table/renamed-column bug ka compile-time avatar hai (legacy remediation #8).

## 3. Git / Branch / PR Discipline

**R3.1 Branches & review:** `main` protected (no direct pushes, PR + green CI required). Review calibrated to team reality: **second human review jahan available**; solo case mein **self-review documented in PR** = filled R5 checklist + staged-diff read confirmation. **EXCEPTION — R4-flagged (risky) PRs: second human review MANDATORY, no solo bypass.** Work branches: `hasham/<topic>`, `babar/<topic>`, `agent/<topic>` pattern. Long-lived personal branches nahi — branch = ek PR ka lifespan.

**R3.2 Staging (standing practice, non-negotiable):** **explicit per-file staging only** — `git add <path> <path>`. **NEVER `git add .` / `git add -A` / `git commit -a`.** Har commit se pehle `git status` + `git diff --staged` review. Rationale: agent workflows mein stray files (env files, scratch scripts, `node_modules` fragments, IDE junk) repo mein ghusne ka primary vector `add .` hai.

**R3.3** Commits: small, single-purpose, imperative message with scope prefix — `db: add applications transition trigger`, `core: canonical url helper`, `infra: prerender vhost include`, `app/it-jobs: apply modal wiring`.

**R3.4** PR template requires: what changed · why · verification performed (R5 checklist for the change type, filled) · migration impact (yes/no; yes → types regenerated confirm) · risky-change flag (R4).

**R3.5** Secrets hygiene: `.env*` gitignored globally; koi bhi credential/key/URL-with-key commit hui to history rewrite + key rotation, dono mandatory — sirf delete-commit kaafi nahi.

## 4. Stop-Before-Risky-Changes

**R4.1** Risky change = koi bhi ek: migration touching existing data (UPDATE/DELETE/type change on populated table) · RLS policy change · auth trigger/flow change · storage policy change · Edge Function touching deletion/email · nginx/prerender config · CI workflow change · dependency major bump · anything touching `profiles.role`/status machines.

**R4.2** Risky changes pe: **STOP before commit.** Diff present karo (human ya agent dono), explicit approval lo, phir commit. Agent context mein: agent diff dikha kar rukta hai, Hasham verify karta hai (screenshot/read), phir "proceed". Ye repo ki standing practice hai — Miraj/CRM workflows se carried.

**R4.3** Production deploys hamesha manual-approve (Architecture §5.3) — risky ho ya na ho.

## 5. Verification Steps Per Change Type

Har PR mein applicable checklist filled ho:

| Change type | Mandatory verification before PR |
|---|---|
| Migration (any) | local `db reset` clean · types regenerated · RLS suite green |
| Migration (RLS/storage policy) | + targeted pgTAP asserts for the new policy (positive AND negative case — "allowed role can, others cannot") · remediation-map regression untouched |
| Migration (trigger/status machine) | + psql script exercising each transition (legal pass, illegal exception) — script committed under `supabase/tests/` |
| Data migration on populated table | + staging rehearsal with row-count/spot-check evidence in PR · risky flag (R4) |
| `@jooblie/core` change | typecheck all apps (`turbo run typecheck`) · affected hooks unit tests |
| `@jooblie/ui` change | affected apps built + visually verified (screenshot in PR) on at least Jooblie + one partner |
| App-level change | that app dev-run verified · role-guard paths retested if routing touched |
| Edge Function | `functions serve` local test with sample payload · idempotency case (email-dispatch: duplicate post → single send) |
| nginx/prerender | staging deploy → curl with bot UA (JSON-LD + canonical present) AND normal UA (SPA served) · admin vhost NOT prerendered check |
| CI workflow | run on branch via workflow_dispatch before merge |
| Seed change (`0014`/registry) | site-registry cross-check script green |

**R5.1** "IDE/agent ne bola theek hai" ≠ verification. Verification = command output / screenshot / test result jo PR mein paste ho. (Standing practice: never trust IDE self-diagnosis.)

## 6. Dashboard-Config Checklist — The Only Sanctioned Dashboard Surface

Ye items migrations mein capture nahi ho sakte; sirf yahi dashboard se hote hain. Har item ka current expected value is file ke saath-wale `infra/config-checklist.md` mein maintained (values-as-doc), har environment ke liye:

| # | Item | Staging | Production |
|---|---|---|---|
| C1 | Auth redirect allowlist | **staging.{slug} domains — saatōn + admin staging URLs explicitly listed** | 7 production domains + admin.jooblie.com |
| C2 | Auth SMTP (Resend) settings + sender domain | staging sender | production sender |
| C3 | Auth email templates (confirm/reset/change) | ✓ | ✓ (same source, values differ) |
| C4 | Edge Function secrets (`supabase secrets set` — CLI, logged in checklist) | ✓ | ✓ |
| C5 | Vault: pg_net shared secret | ✓ | ✓ |
| C6 | Pro plan + daily backups + **PITR enabled** | n/a (free) | ✓ launch-blocker |
| C7 | GitHub Environments: secrets + production required-reviewers | ✓ | ✓ |
| C8 | Password/OTP policy settings | ✓ | ✓ |

**R6.1** Checklist change = PR to `infra/config-checklist.md` **pehle**, dashboard change **baad** — doc is the source of truth, dashboard is the deployment of it. Environment parity audit = restore-rehearsal ka part (quarterly).

## 7. Agent Workflow Rules (Claude Code / any coding agent)

**R7.1** `AGENTS_GUIDE.md` repo root pe rehta hai (standing cross-agent continuity pattern). Contents: current phase + active slice (Phases.md pointer) · architecture invariants one-pager (visibility contract, single-profile-path, no-client-status-writes, policy naming) · commands cheat-sheet (`db reset`, `gen:types`, test suites) · in-flight work notes. **Har agent session isse padh kar shuru hoti hai; slice complete hone pe agent ise update karta hai** — ye definition-of-done ka hissa hai.

**R7.2** One slice at a time. Agent Phases.md ke current slice se bahar kaam nahi karta — adjacent "improvements" nahi, drive-by refactors nahi. Out-of-scope observation → `AGENTS_GUIDE.md` notes section mein likho, karo mat.

**R7.3** Agents follow R3.2 literally: per-file `git add`, kabhi `add .`. Agent commit se pehle staged diff output dikhata hai. Risky changes (R4.1 list) pe agent commit nahi karta — diff + STOP, human approval ka wait.

**R7.4** Agents NEVER: dashboard operations suggest/perform (R1.2) · `database.types.ts` hand-edit (R2.1) · migrations reorder/edit merged files (R1.3) · secrets kisi file mein likhna (R3.5) · verification skip karke "should work" bolna (R5.1) · force-push ya history rewrite (sirf human, R3.5 case).

**R7.5** Agent-reported success is a claim, not a fact. Har slice ke end pe verification evidence (command output, screenshot request) — Hasham verifies, phir next slice. (Standing practice: one verified step at a time.)

**R7.6** Multi-agent handoff (Claude architect → Claude Code executor → reviewer pattern): handoff prompt MUST reference: current Phases.md slice · relevant doc sections (PRD/SystemDesign/Architecture §) · R4 risky-list. Prompts repo mein nahi rehte; AGENTS_GUIDE.md state carry karta hai.

## 8. Dev Environment Notes

- `supabase start` per dev; **daily `db reset` habit** — local drift ko zinda mat rakho.
- Auth emails locally: Inbucket (`supabase status` URL). Resend dev mein kabhi hit nahi hota.
- pg_net → local Edge Function caveat: local webhook target `http://host.docker.internal:54321/...`; ye difference `supabase/functions/README` mein documented — staging pe real URL config Vault/checklist se.
- Node/pnpm versions `.nvmrc`/`packageManager` field pinned; Prisma-style major-pin lesson generalized: **saare backend-critical deps exact-pinned** (`supabase-js`, `@tanstack/react-query`), renovate PRs individually reviewed.
- Dev seed users (`seed_dev_users.sql`): fixed credentials, roles covered (seeker/recruiter-verified-co/recruiter-pending-co/admin) — sirf local/staging; CI check ke production push mein seed file exclude ho.

## 9. Definition of Done (per slice)

1. Code merged via PR with filled template (R3.4) + applicable R5 checklist evidence.
2. CI green (including db-gate if touched).
3. Staging deployed + slice's acceptance check (Phases.md defines per slice) demonstrated.
4. `AGENTS_GUIDE.md` updated (R7.1).
5. Docs updated agar behaviour docs se diverge hua — **docs follow reality within the same PR**, warna docs fiction ban jate hain.
