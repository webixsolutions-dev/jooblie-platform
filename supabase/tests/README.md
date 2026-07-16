# Database test harness

Phase 0.3 wires this directory into CI with `supabase test db --local`.

Add pgTAP tests as `*.sql` or `*.pg` files. The runner intentionally succeeds
with zero test files until the first database/RLS tests land in Phase 1.

Run locally after starting and resetting Supabase:

```sh
pnpm db:start
pnpm db:reset
pnpm test:rls
```
