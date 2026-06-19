# OAuthPage TODO (Hosted-first)

## Now (requested)

- [x] **1. Full QA pass for hosted-only flow**
  - [x] Worker + dashboard tests passing
  - [x] Hosted create/upload/serve smoke checks
  - [x] API route smoke checks

- [x] **2. Harden + test CLI end-to-end**
  - [x] CLI command surface validated (`--help`, command wiring)
  - [x] Added CLI unit tests (auth config + API client)
  - [x] CLI auth endpoint smoke checks

- [x] **3. Production polish (phase 1)**
  - [x] Better usage/readability polish (KB floor display)
  - [x] Storage usage progress indicator
  - [x] Clearer empty/error states around file uploads
  - [x] Added backlog item: site thumbnails

## Backlog

- [x] **Bring Google OAuth live** — secrets set, redirect URIs configured, consent screen published, login flows verified
- [ ] Site thumbnails on site cards (Vercel-style preview)
- [ ] Deploy history timeline (timestamp, file count, actor)
- [ ] Drag-drop upload zone with per-file status rows
- [ ] CLI npm publish + install docs (`npx oauthpage`)
- [ ] Audit/security hardening pass (rate limits, MIME policy, abuse controls)
- [ ] Monitoring/alerts for worker + R2 errors
- [ ] Billing tiers enforcement (storage/requests/bandwidth limits)
- [ ] **Username in slug/subdomain (optional)** — let users include their username in the site slug or as a subdomain (e.g. `user.oauthpage.dev` or `oauthpage.dev/user/site`)
- [ ] **JS logging to DB + log read from CLI** — capture client-side JS logs and expose them via `oauthpage logs --tail`, enabling two-way comms from hosted HTML back to agents.
  - **Store:** Supabase Postgres (storage-billed, immediate writes free, Realtime = built-in live tail, EU region keeps visitor PII in-region). Behind a swappable `LogStore` interface (ClickHouse-on-R2 as scale-up).
  - **Scope:** all (OAuth-authenticated) visitors log; Worker stamps `site` (from host) + `visitor` (from session) server-side — unspoofable. Logs flow up only.
  - **Injection:** Worker auto-injects `/__oauthpage/log.js` via HTMLRewriter at serve time (no user snippet).
  - **Write path:** immediate POST per line → Worker `/__oauthpage/log` (per-site rate-limit = cost/abuse cap) → INSERT.
  - **Read path:** `oauthpage logs <site> --tail [--visitor <id>]` → Supabase Realtime stream / SQL query, scoped to owner's sites.
  - **Cap by storage:** monthly partition + drop-old (or per-site row cap).
  - **Guardrails:** per-site write rate-limit; retention cap; ToS note re: visitor PII (OauthPage as processor).
  - **Spec:** `docs/specs/2026-05-30-visitor-logging.md`
