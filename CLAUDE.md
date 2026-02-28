# CLAUDE.md — OAuthPage (gatekeep)

## Rules

### Cost Analysis Required
When adding any new feature, always calculate and document:
- **Per-unit cost** of the feature (e.g. cost per invocation/request)
- **Cost at scale** (1K, 10K, 100K, 1M users)
- **Which CF/external service** drives the cost (Workers, D1, KV, R2, Browser Rendering, Resend, etc.)
- **Impact on existing pricing tiers** — does this feature change the margin?

Present cost analysis before implementing. Flag features that cost >$0.001/invocation.

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
