# Architecture — Jooblie Platform (v2)

**Scope:** Repo strategy, package boundaries, deployment topology, prerender routing, env/secrets, CI/CD.

---

## 1. Repo Strategy — Verdict: Monorepo (Turborepo + pnpm workspaces)

**Decision: single monorepo.** Not close, at this shape:

| Force | Multi-repo (8+) | Monorepo |
|---|---|---|
| Generated DB types propagation | 8 repos × version bump × PR per schema change — guaranteed drift; the legacy phantom-table bug class returns via stale types | One commit updates types + all consumers; `tsc` breaks **in the same PR** as the migration |
| Shared auth/canonical/UI change | publish package → 8 dependabot PRs | atomic |
| Legacy remediation #6/#9 (single AuthProvider, exact-match guards) | enforced by convention only | enforced by import — sites physically consume the one implementation |
| Team size | overhead built for many teams | 1–3 devs: one clone, one CI, `turbo build --filter=affected` |
| Partner site divergence risk | high (copy-paste drift across 7 similar SPAs) | low (sites become thin config + theme over shared packages) |

Multi-repo ka ek hi genuine argument tha — independent partner ownership by separate teams. Wo exist nahi karta; saatōn sites ek team maintain karti hai.

### 1.1 Layout

```
jooblie-platform/                     (GitHub: webixsolutions-dev/jooblie-platform)
├─ apps/
│  ├─ jooblie/            # aggregator SPA
│  ├─ it-jobs/            # sector SPAs …
│  ├─ office-jobs/
│  ├─ hospitality-healthcare/
│  ├─ transport-farming/
│  ├─ aboriginal/         # audience SPAs
│  ├─ newcomers/
│  └─ admin/              # 8th frontend (admin.jooblie.com)
├─ packages/
│  ├─ core/               # @jooblie/core      (see §2)
│  ├─ ui/                 # @jooblie/ui        (see §2)
│  └─ config/             # @jooblie/config    (tsconfig, eslint, tailwind preset)
├─ supabase/
│  ├─ migrations/         # 0001…0013 (approved breakdown after seed resequencing)
│  ├─ functions/          # email-dispatch/, account-delete/
│  ├─ seed/               # seed_dev_users.sql (dev/staging only)
│  └─ config.toml
├─ infra/
│  ├─ nginx/              # per-site vhost templates + prerender routing include
│  ├─ prerender/          # docker-compose for prerender service
│  └─ scripts/            # deploy.sh, generate-sitemaps.ts, restore-runbook.md
│                          # (storage backup: GitHub Actions workflow, not a VPS script — §5.4)
├─ .github/workflows/     # ci.yml, deploy-staging.yml, deploy-production.yml
├─ turbo.json
└─ pnpm-workspace.yaml
```

Existing frontends is layout mein migrate honge (import-path mechanical change; Phases.md mein ek slice).

## 2. Package Boundaries

### 2.1 `@jooblie/core` — logic, zero JSX

**Inside:**
- `client.ts` — single `createSupabaseClient()` factory (env-driven). Apps kabhi `createClient` directly import nahi karte.
- `database.types.ts` — **generated** (CLI), committed, CI-gated (§5). Hand-editing forbidden (Rules.md).
- `auth/` — the **single** `AuthProvider`, `useAuth()`, `useRequireRole(role)` exact-match guard, session helpers. (Legacy remediation #6/#9 physically lives here.)
- `queries/` — TanStack Query hooks per domain object (`useJobs`, `useJob`, `useApply`, `useApplications`, `useCompany`, `useNotifications` …). Site-filtering ek hi jagah: hooks accept `siteId`; partner apps pass their own, Jooblie passes `null`.
- `seo/` — `canonicalUrl(job, sites)`, `jobPostingJsonLd(job, company)` — framework-agnostic (SSR-migration survivors, SystemDesign §11).
- `constants/` — enums mirrored from DB types, notification/activity action string catalog, error-code → user-message map (rate-limit, duplicate-apply etc.).
- `site-registry.ts` — build-time site metadata (slug→id, domain, name, theme key) — must match `sites` seed; CI cross-check.

**Outside (deliberately):** React components (→ ui), routing (apps own their router), app state beyond auth, anything importing app code. Dependency direction: `apps → ui → core`; core imports nothing internal.

### 2.2 `@jooblie/ui` — shared components

JobCard, JobList, filters, ApplyModal, dashboards' shared tables, NotificationBell, layout primitives — **theme-token driven** (CSS variables per site; Tailwind preset in `@jooblie/config`). Partner app = routes + theme tokens + site-specific static pages. Admin app consumes core fully, ui selectively (its own layout).

### 2.3 Versioning

None — monorepo internal packages, `workspace:*`, always HEAD. Ek schema change = ek PR touching migration + regenerated types + any breaking hook/UI fixes together.

## 3. Deployment Topology & Prerender Routing (SystemDesign §9.2 deferred detail resolved)

**Decision: all 8 frontends deploy to the Hostinger VPS as static bundles behind one nginx**, partner domains DNS-pointed at the VPS. "Partners apne domains pe" = apna domain, shared infra.

Rationale: (a) prerender routing uniform ho jati hai — ek nginx include, saat vhosts; (b) SPAs static hain, VPS easily serves 8; (c) ek deploy pipeline, ek TLS story (certbot multi-domain), ek log surface. Alag hosting (Vercel etc.) tab justified hota jab SSR hota — wo future phase pe revisit hoga.

```
DNS: jooblie.com, itjobsjobline.com, … , admin.jooblie.com → VPS IP

VPS (Hostinger)
├─ nginx
│  ├─ vhost per domain → root /var/www/{site}/current  (SPA fallback → index.html)
│  │    └─ include prerender.conf:  if ($prerender_ua) → proxy_pass 127.0.0.1:3000
│  │        (public GET routes only; admin vhost EXCLUDES the include — never prerendered)
│  ├─ TLS: certbot, per-domain certs
│  └─ security headers, gzip/brotli, immutable-asset caching (hashed filenames)
├─ prerender service (Docker, 127.0.0.1:3000, headless Chromium, cache TTL 24h)
└─ cron: generate-sitemaps (nightly — anon-key only, VPS-safe; §5.4)
```

- Releases: `/var/www/{site}/releases/{sha}` + `current` symlink flip → atomic deploy, instant rollback (symlink back).
- Fallback documented: agar koi partner domain kabhi external hosting pe jana pade, uska host prerender ke liye `proxy_pass https://vps/prerender?url=…` ya hosted prerender.io use karega — architecture unaffected.
- Escape hatch: VPS single point of failure hai frontends ke liye (backend Supabase pe hai, unaffected). Static bundles hain — DR = kisi bhi static host pe `dist/` + DNS. Restore runbook mein noted.

## 4. Environments, Env Vars & Secrets

### 4.1 Frontend env (Vite, per app × per env)

```
VITE_SUPABASE_URL        # staging vs production project
VITE_SUPABASE_ANON_KEY   # anon key ONLY — service role kabhi kisi frontend/VPS env mein nahi
VITE_SITE_SLUG           # 'it-jobs' — site-registry lookup isi se; ye hi single
                         #  identity switch hai (galat slug = galat site — CI check §5)
```

Baaki sab (domains, names, themes) `site-registry.ts` se — env surface deliberately minimal. Build per app × env in CI; secrets GitHub Environments se inject (staging auto, production protected).

### 4.2 Backend secrets

| Secret | Location |
|---|---|
| Resend API key | Edge Function secrets (`supabase secrets set`) |
| pg_net → email-dispatch shared secret | **Supabase Vault** (DB side, `vault.decrypted_secrets`) + Edge Function secret (verify side) |
| GoTrue admin ops (account-delete) | Edge Function runtime service key (platform-provided), function-internal only |
| SMTP (Resend) for Auth emails | Auth config (dashboard checklist item) |
| Storage-backup: service-role key + off-site target credentials | GitHub Environments only (backup runs as a scheduled Actions workflow — never on the VPS, §5.4) |
| CI: `SUPABASE_ACCESS_TOKEN`, project refs, VPS SSH key | GitHub Environments (production = required reviewers) |

Rule (Rules.md-bound): service-role key sirf do jagah exist karta hai — Edge Function runtime aur CI migration step. Kabhi frontend, kabhi VPS web root, kabhi repo.

## 5. CI/CD Pipeline (GitHub Actions)

### 5.1 PR pipeline (`ci.yml`) — merge gates

```
1. install (pnpm, cached) 
2. lint + typecheck        turbo run lint typecheck --filter=...[origin/main]
3. DB gate (migrations touched ya types touched):
   a. supabase start (local stack in CI)
   b. supabase db reset            ← Acceptance #10 continuously proven
   c. supabase gen types typescript --local > /tmp/types.ts
   d. diff /tmp/types.ts packages/core/database.types.ts → mismatch = FAIL
      ("types regenerate karo" — hand-edit ya stale types dono yahin pakde jate hain)
   e. RLS regression suite: pgTAP/psql scripts asserting the Legacy Remediation
      Map checks (anon profiles = 0 rows, anon job INSERT fails, unrelated-recruiter
      resume SELECT fails, seeker applied/expired job visible, …)
4. site-registry ↔ seed cross-check script (launched-site slugs/ids/domains match 0011 seed)
5. build affected apps      turbo run build --filter=...[origin/main]
```

### 5.2 Staging (`deploy-staging.yml`, on merge → main)

```
1. supabase link (staging ref) → supabase db push        # pending migrations only
2. supabase functions deploy email-dispatch account-delete
3. build all apps with staging env
4. rsync dists → VPS staging paths (staging.{slug}.jooblie.com vhosts) → symlink flip
   + post-deploy generate-sitemaps run (§5.4)
5. smoke: /auth/callback reachable per site; prerender curl with bot UA
   returns JSON-LD on a seeded job page
```

### 5.3 Production (`deploy-production.yml`, manual dispatch + required reviewer)

```
1. same migration artifacts → production db push   (koi naya SQL production ke
   raste mein generate nahi hota — staging pe rehearsed exact files)
2. functions deploy → build (production env) → rsync → symlink flip
   + post-deploy generate-sitemaps run (§5.4)
3. post-deploy checks: acceptance-critical curls (canonical tag, JSON-LD,
   sitemap 200, auth health)
4. rollback: frontends = symlink flip back; migrations = roll FORWARD only
   (down-migrations maintained nahi — Rules.md policy; hotfix migration path)
```

### 5.4 Scheduled

- **Nightly storage backup — GitHub Actions scheduled workflow** (`storage-backup.yml`), NOT VPS cron: private buckets require the service-role key, and the service-role key is forbidden on the VPS (§4.2 rule stands). CI/GitHub Environments is already a sanctioned service-key location — backup reads buckets via service role there and pushes to the off-site target. Includes the backup-purge parity step for deleted accounts (SystemDesign §10.2).
- **Nightly sitemap generation — VPS cron** (`infra/scripts/generate-sitemaps`): queries per-site visible jobs from Supabase with the **anon key only** (public data — that's why VPS-resident is acceptable), renders 8 `sitemap.xml`, drops them into `/var/www/{site}/current/`. Deploy interaction: sitemaps live in the release dir, so a symlink flip serves a bundle without them — deploy pipeline runs generate-sitemaps as a **post-deploy step** (staging §5.2 / production §5.3) so no window of missing/stale sitemaps.
- Nightly: emailed_at retry sweep (pg_cron, SystemDesign §7).
- Weekly CI: full `db reset` + RLS suite on main (drift canary independent of PRs).

## 6. Local Development

- `supabase start` per dev (Docker) — full local stack; `db reset` = migration truth
  only. Apply `supabase/seed/seed_dev_users.sql` explicitly to disposable local/staging
  databases; it is intentionally excluded from CI resets and production `db push`.
- `pnpm dev --filter=it-jobs` (ya multiple) — Vite dev servers, local Supabase URL.
- Inbucket (local Supabase mail-catcher) auth-email flows ke liye — Resend dev mein untouched.
- Edge Functions: `supabase functions serve` local; pg_net local caveat (webhook localhost target) documented in Rules.md dev notes.

## 7. Decisions Register (this doc)

| # | Decision | Alternative rejected | Why |
|---|---|---|---|
| A1 | Turborepo monorepo | 8 repos + published packages | type-drift elimination, atomic schema changes, 1-team reality |
| A2 | pnpm workspaces, `workspace:*`, no package versioning | semver publishing | internal-only consumers |
| A3 | All frontends on VPS nginx, partner domains → VPS | per-site external hosting | uniform prerender routing, one pipeline; revisit at SSR phase |
| A4 | Release-dir + symlink deploys | in-place rsync | atomic + instant rollback |
| A5 | `VITE_SITE_SLUG` as sole site-identity switch + registry cross-check in CI | per-app hardcoded config | misdeploy class reduced to one checked variable |
| A6 | Types committed + CI diff gate | types generated at build time | PR-visible schema impact; offline builds |
| A7 | Roll-forward-only migrations | down migrations | honesty over ceremony; hotfix path defined |
