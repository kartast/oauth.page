# CLAUDE.md — OAuthPage (gatekeep)

## Rules

### Cost Analysis Required
When adding any new feature, always calculate and document:
- **Per-unit cost** of the feature (e.g. cost per invocation/request)
- **Cost at scale** (1K, 10K, 100K, 1M users)
- **Which CF/external service** drives the cost (Workers, D1, KV, R2, Browser Rendering, Resend, etc.)
- **Impact on existing pricing tiers** — does this feature change the margin?

Present cost analysis before implementing. Flag features that cost >$0.001/invocation.


### Test Before Deploy
- **Always run the full test suite before deploying.** No exceptions.
- When modifying client-side behavior (e.g. API interceptors, redirects, error handlers), consider the full request lifecycle — server tests alone won't catch client-side loops or regressions.
- If a change affects both server and client, verify both sides have coverage.
- Think through the redirect/retry chain: "If X returns 401, and the handler redirects to Y, and Y calls X again…"
### Infrastructure Pricing Reference (Feb 2026)
| Service             | Unit Cost                                      |
|---------------------|------------------------------------------------|
| Workers requests    | $0.30 / 1M                                     |
| D1 rows read        | $0.001 / 1M rows                               |
| D1 rows written     | $1.00 / 1M rows                                |
| D1 storage          | $0.75 / GB-mo (5GB free)                        |
| KV reads            | $0.50 / 1M                                     |
| KV writes           | $5.00 / 1M                                     |
| R2 storage          | $0.015 / GB-mo (10GB free)                      |
| R2 Class A (write)  | $4.50 / 1M                                     |
| R2 Class B (read)   | $0.36 / 1M                                     |
| R2 egress           | FREE                                           |
| Browser Rendering   | $0.09 / hr (~$0.0005/screenshot)                |
| Resend email        | Free <3K/mo, Pro $20/50K, Scale $90/100K        |

## Project Structure
- `worker/` — CF Worker (Hono), edge proxy + API
- `dashboard/` — React SPA (Vite + Tailwind), landing + dashboard
- `packages/cli/` — CLI tool (`oauthpage`)

## Deploy
```bash
# Worker only
cd worker && npm test && source ../.env.credentials && \
  export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID && wrangler deploy

# Full (dashboard + worker)
cd dashboard && npm run build
# Upload dist/* to KV (namespace: b651495a73a04699a0d14cef9af8df2d) with --remote
cd ../worker && npm test && wrangler deploy
```

## Key Architecture Decisions
- Screenshots use KV bypass tokens (60s TTL, not consumed on use) so subresources load
- Auto-screenshot triggers on every deploy (60s debounce)
- All site content served from R2 (egress-free = huge cost advantage)

## Screenshot Pipeline (CF Queues)
Screenshots are processed via **CF Queues**, not `waitUntil()`.

### Architecture
```
Deploy → queue.send() → CF Queue (screenshot-jobs)
                              ↓
                    Consumer: captureScreenshot()
                    max_batch_size = 1
                    max_concurrency = 5
                    max_retries = 3
                              ↓
                    Failed 3x → Dead Letter Queue (screenshot-dlq)
```

### Observability
Every screenshot emits structured JSON logs:
- `[SCREENSHOT]` — success with per-phase timings (launchMs, navigationMs, screenshotMs, storeMs, totalMs, pngKB)
- `[SLOW_SCREENSHOT]` — same fields, warns when totalMs > 25s
- `[SCREENSHOT_FAIL]` — error with partial timings + error message

View live: `wrangler tail` or CF Dashboard → Workers → Logs.
Filter for `SLOW_SCREENSHOT` to catch performance regressions.

### Limits (Paid Plan — $5/mo Workers)
- 30 concurrent browsers (we use 5 via queue concurrency)
- 30 new instances/min
- No daily time cap (pay $0.09/hr after 10hr/mo included)
- Queue cost: ~$0.80/mo at 1M users (1M free ops included)

### Key Config
- Queue names: `screenshot-jobs`, `screenshot-dlq`
- Binding: `SCREENSHOT_QUEUE` in `worker/wrangler.toml`
- Bypass token: 60s TTL in KV (`ss:{uuid}`)
- Page timeout: 30s (`networkidle0`)

### Deploy Workflow: Staging First
- **Production deploy requires explicit user approval (green light).** Never deploy prod automatically after staging.
**Always deploy to staging before production.** No exceptions.
```bash
# 1. Run tests
cd worker && npm test

# 2. Deploy to staging
source ../.env.credentials && export CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID
wrangler deploy --env staging

# 3. Verify on staging
# Test at: https://oauth-page-worker-staging.karta.workers.dev

# 4. Deploy to production
wrangler deploy
```
Never skip staging. Even for "small" changes.

### Markdown Sites (Server-Side Docsify)
Worker auto-detects markdown-only sites (has `.md` files, no `index.html`):
- Generates Docsify shell with site name as title
- Auto-generates `_sidebar.md` from R2 file listing
- Caches detection + sidebar in KV (1hr TTL, invalidated on deploy)
- Theme toggle (dark/light), search, copy code, syntax highlighting
- CLI just uploads raw `.md` files — zero template logic client-side

### Deploy Behavior
Deploy is **full replace** — all existing R2 files are deleted before uploading new ones.
This prevents stale files from lingering after re-deploys.
