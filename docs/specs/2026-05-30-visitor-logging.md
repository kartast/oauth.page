# Visitor Logging — Spec

**Status:** Approved design, pre-implementation
**Date:** 2026-05-30
**Backlog item:** "JS logging to DB + log read from CLI" (TODO.md)

## Goal

Capture client-side JS logs from hosted static sites and let the site owner read
them from the CLI (`oauthpage logs <site> --tail`), giving agents a feedback loop
from deployed HTML back to themselves.

## Scope

- **In:** auto-injected log shim, ingest endpoint, Supabase storage, CLI read/tail
  (poll-based), per-site rate-limit, retention cap.
- **Out (this version):** agent→page commands (logs flow *up* only), session replay,
  metrics/traces, dashboard log viewer, Supabase Realtime push (poll first), markdown
  (Docsify) sites.

## Repo reality (verified against code)

- Worker stack: **Cloudflare D1 + KV + R2**, Hono, drizzle. **No Supabase today** —
  this feature introduces it as a dedicated logs store (net-new project + secrets +
  client). Justified: D1 meters writes ($1/M rows), violating the "immediate writes,
  bill per GB" requirement; Supabase is storage-billed.
- Sessions are **opaque KV tokens**, not signed JWTs:
  - visitor: cookie `gk_session` → KV `session:{token}` → `{ id, email, site_id, expires_at }` (`SessionData`)
  - owner: cookie `gk_owner` → KV `owner:{token}` → `OwnerSession`
- Auth/serve logic lives in `worker/src/proxy.ts` (`serveFromR2` / `serveAndTrack`).
- `JWT_SECRET` binding exists and is reused for the log-token HMAC below.
- Bindings type: `worker/src/types.ts` `Env`. Tests: `worker/src/__tests__/*.test.ts` (vitest).

## Key decisions (settled)

| Decision | Choice | Why |
|---|---|---|
| Store | **Supabase Postgres** (new project) | Storage-billed (immediate writes free); SQL handles high-cardinality `visitor` filter; EU region for PII. |
| Backend abstraction | `LogStore` interface | Swap to ClickHouse-on-R2 at scale without touching shim/CLI. |
| Who logs | All (authenticated) visitors | gatekeep gates every visitor; identity already resolved server-side. |
| Identity (cheap + secure) | **Mint short-lived HMAC log-token at serve time** (`JWT_SECRET`) | Proxy already resolved the KV session when serving the page; embed `{site_id, email, exp}` signed → ingest verifies statelessly, **no KV read per log**. |
| Direction | Up only | A log store suffices; no WS hub. |
| Transport | Immediate POST, **microtask-coalesced**, `sendBeacon` | Feels instant; collapses bursts ~10×. |
| `--tail` | CLI **polls** Worker (~1.5s) | Plain Workers can't cheaply hold a Realtime WS; polling cost falls on owners, not visitors. Realtime push = v2. |
| Cap | **pg_cron daily DELETE, 7-day retention** (in Supabase) | Simplest; self-contained in DB. Partition-drop is a scale-up optimization. |

## Architecture

```
Owner deploys static HTML ─▶ R2 ─▶ Worker proxy (proxy.ts)
   on an AUTHENTICATED serve (session/owner resolved → identity in hand):
     • HTMLRewriter injects <script src="/__oauthpage/log.js"></script>
     • + sets window.__OP_LOG_TOKEN = HMAC({site_id, email, exp:+1h}, JWT_SECRET)
                                     ▼
Visitor browser ─ console/error/oauthpage.log() ─┐
     • coalesce (microtask) → sendBeacon(/__oauthpage/log, {token, lines})
                                     ▼
Worker POST /__oauthpage/log   (src/log.ts)
     1. verifyLogToken(token, JWT_SECRET) → {site_id, email}   ← stateless, unspoofable
     2. rateLimit per site_id (native binding) → 429 if over
     3. cap count/size; LogStore.write(site_id, email, lines) → Supabase INSERT
                                     ▼
Owner CLI: oauthpage logs <site> [--tail] ─▶ Worker GET /api/logs (owner-scoped)
     • verifyOwnerToken + confirm owner owns <site> (D1) → LogStore.query(...)
     • --tail: CLI re-polls with ?since=<lastTs> every ~1.5s
```

The Worker is mandatory: only it can stamp `site`+`email` from trusted state, hold
the Supabase service key, and rate-limit. Browsers never supply identity.

## Data model (Supabase)

Migration committed at `worker/migrations/supabase/0001_logs.sql` (applied via SQL Editor):
plain `logs` table, indexes on `(site, ts)` and `(site, visitor, ts)`, RLS on with no
policies (service_role only), and **pg_cron** daily DELETE for 7-day retention.

- Retention: `pg_cron` job `logs-retention-7d` deletes rows older than 7 days (03:00 UTC).
  Partition-by-range is a future scale-up optimization, not needed at current volume.
- Server caps: `msg` ≤ 4 KB, `meta` ≤ 8 KB, ≤ 100 lines/request.
- Realtime publication deferred to v2 (poll-based tail in v1).

## Log-token (the "wristband")

```
issue (proxy.ts, at authenticated serve):
  payload = base64url({ s: site_id, e: email, x: now+3600 })
  sig     = base64url(HMAC_SHA256(payload, env.JWT_SECRET))
  token   = `${payload}.${sig}`     // embedded as window.__OP_LOG_TOKEN

verify (log.ts, per ingest):
  split token; recompute HMAC; constant-time compare; check x > now
  → { site_id: s, email: e }   // no KV/DB hit
```

- Unspoofable (HMAC), scoped to one site+visitor, expires in 1h.
- Accepted residual risk: a visitor can spam *their own* logs up to the rate limit.

## Write path

### Shim — `/__oauthpage/log.js` (served by `src/log.ts`, static, cacheable)

```js
(() => {
  const EP = '/__oauthpage/log', TOK = window.__OP_LOG_TOKEN;
  if (!TOK) return;
  let q = [];
  const push = (level, args) => {
    q.push({ level, msg: args.map(String).join(' ').slice(0, 4096),
             ts: Date.now(), meta: { url: location.pathname } });
    if (q.length === 1) queueMicrotask(flush);
  };
  const flush = () => {
    if (!q.length) return;
    const body = JSON.stringify({ token: TOK, lines: q.splice(0) });
    navigator.sendBeacon(EP, new Blob([body], { type: 'application/json' }));
  };
  for (const l of ['log','warn','error']) {
    const o = console[l]; console[l] = (...a) => { push(l, a); o.apply(console, a); };
  }
  addEventListener('error', e => push('error', [e.message, `${e.filename}:${e.lineno}`]));
  addEventListener('unhandledrejection', e => push('error', ['unhandledrejection', String(e.reason)]));
  window.oauthpage = { log: (...a) => push('log', a) };
  addEventListener('visibilitychange', () => document.hidden && flush());
})();
```

### Injection — `worker/src/proxy.ts` (modify)

In `serveFromR2`, when serving an **HTML** response on an authenticated path
(`serveAndTrack`), pipe through `HTMLRewriter` to inject the shim tag + a small inline
`<script>window.__OP_LOG_TOKEN=...</script>` before `</head>`. Gate on a per-site
`logging_enabled` flag (default on). Skip non-HTML and Docsify/markdown shells (v1).

### Ingest — `worker/src/log.ts` (new), mounted in `src/index.ts`

```
GET  /__oauthpage/log.js   → static shim (Cache-Control: public, immutable)
POST /__oauthpage/log      → verifyLogToken → rateLimit → LogStore.write → 204
```

## Read path (CLI — external repo `github.com/unplug-io/oauthpage-cli`)

```
oauthpage logs <site> [--tail] [--visitor <email>] [--level error] [--since 1h]
```

- CLI → Worker `GET /api/logs?site=&visitor=&level=&since=` with owner API token.
- Worker: `verifyOwnerToken` → confirm `owner_id` owns `<site>` via D1 →
  `LogStore.query(...)` (newest first).
- `--tail`: CLI loops, passing `?since=<last ts>` every ~1.5s; prints new rows.

## `LogStore` interface — `worker/src/logstore.ts` (new)

```ts
export type LogLevel = 'log' | 'warn' | 'error';
export interface LogLine { level: LogLevel; msg: string; ts: number; meta?: unknown }
export interface StoredLog extends LogLine { site: string; visitor: string }
export interface LogQuery { site: string; visitor?: string; level?: LogLevel; since?: number; limit?: number }
export interface LogStore {
  write(env: Env, site: string, visitor: string, lines: LogLine[]): Promise<void>;
  query(env: Env, q: LogQuery): Promise<StoredLog[]>;
}
```

`SupabaseLogStore` v1 talks to Supabase via **PostgREST over fetch** (no SDK):
`POST {SUPABASE_URL}/rest/v1/logs` to write, `GET …/logs?…` to query, with
`apikey` + `Authorization: Bearer {SUPABASE_SERVICE_KEY}` headers.

## Security

- Identity only from the HMAC log-token; client-supplied site/visitor ignored.
- `SUPABASE_SERVICE_KEY` stays in the Worker, never in the browser.
- Per-`site` rate-limit caps abuse and bill exposure even if a token leaks.
- Read authz: owner token + D1 ownership check before any query.
- **PII (ToS):** logs may contain visitor emails + custom data; OauthPage is a
  processor. Supabase **EU region**; **7-day retention**; per-site off-switch.

## Cost analysis (per CLAUDE.md)

~200 B/event, storage-capped (~last 500 lines/site ≈ 100 KB), 7-day retention.

| Scale (sites) | Stored | Supabase | Worker requests (coalesced) |
|---|---|---|---|
| 1K  | 100 MB | free tier | ~$0 |
| 10K | 1 GB   | $25 Pro base | ~$0 |
| 100K| 10 GB  | ~$25 + $0.25 storage | negligible |
| 1M  | 100 GB | ~$25 + ~$12 storage + compute | **~$900/mo (dominant)** |

- **Per-unit:** one write = one `INSERT` (no per-op charge) + ~200 B until evicted →
  **well under $0.001/invocation.** ✅
- **Cost driver:** Worker request per log burst ($0.30/1M), *not* Supabase. Coalescing
  + rate-limit bound it. **No per-log KV read** (HMAC token avoids it).
- **Tail:** poll cost scales with *owners tailing*, not visitors.
- **Tier impact:** none at current scale.

## Config / bindings

- `worker/src/types.ts` `Env`: add `SUPABASE_URL: string`, `SUPABASE_SERVICE_KEY: string`.
- `worker/wrangler.toml`: secrets for the two above; **Rate Limiting binding**
  `LOG_RATELIMIT` (e.g. 600/min/site); **Cron** (daily) for partition drop.
- `JWT_SECRET`: already present (log-token HMAC).
- `sites` table (D1): add `logging_enabled INTEGER DEFAULT 1`.

## File structure

| File | Responsibility | New/Modify |
|---|---|---|
| `worker/src/logstore.ts` | `LogStore` + `SupabaseLogStore` (PostgREST) | new |
| `worker/src/log.ts` | serve `log.js`; `POST /__oauthpage/log`; `verifyLogToken` | new |
| `worker/src/proxy.ts` | inject shim + token into authenticated HTML serves | modify |
| `worker/src/api/sites.ts` (or new `api/logs.ts`) | `GET /api/logs` owner-scoped | modify/new |
| `worker/src/index.ts` | mount log routes; cron handler | modify |
| `worker/src/types.ts` | `Env` Supabase bindings | modify |
| `worker/wrangler.toml` | secrets, rate-limit binding, cron | modify |
| `worker/src/__tests__/logs.test.ts` | token verify, ingest authz, rate-limit, query scoping | new |
| Supabase migration | `logs` table + partitions | new |
| D1 migration | `sites.logging_enabled` | new |
| oauthpage-cli (ext repo) | `logs` command (`--tail`, filters) | new |

## Resolved decisions

1. **Region:** Supabase project in **EU** (visitor PII). ✅
2. **Retention:** **7 days** (daily partitions, Cron drop). ✅
3. **Default-on** per site, with owner off-switch (`sites.logging_enabled`). ✅
4. **Net-new Supabase dependency** accepted. ✅

## Out of scope (future)

- agent→page command channel (bidirectional DO WebSocket hub)
- Supabase Realtime push tail
- dashboard log viewer
- ClickHouse-on-R2 `LogStore` for scale (interface already allows it)
- markdown/Docsify-site logging
