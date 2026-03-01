# OAuthPage — Product Spec

## Vision
Edge proxy SaaS — OAuth-based access control for any website.
Deploy static sites, gate them behind GitHub/Google OAuth, approve or deny visitors.

## Target Users
- AI agents / developers who generate HTML outputs (reports, dashboards, apps)
- Teams sharing private prototypes or client deliverables
- Anyone who wants "Google Docs sharing, but for websites"

---

## Pricing Tiers

### Free Plan
**Goal:** <$2,000/mo infrastructure cost at 1M free users ($0.0012/user)

| Limit                    | Value              | Cost Driver          |
|--------------------------|--------------------|----------------------|
| Sites                    | 3                  | R2 storage           |
| Storage per site         | 5 MB               | R2 storage           |
| Total storage            | 15 MB              | R2 storage           |
| Deploys per month        | 10                 | R2 writes            |
| Page views per site/mo   | 1,000              | Workers + KV + R2    |
| Preview screenshots      | First deploy only  | Browser Rendering    |
| Email notifications      | 5 / month          | Resend               |
| One-time links           | 3 active           | KV                   |
| OAuth providers          | GitHub + Google    | —                    |

### Pro Plan (post-beta)
Target: $9–15/mo

| Limit                    | Value              |
|--------------------------|--------------------|
| Sites                    | 25                 |
| Storage per site         | 25 MB              |
| Total storage            | 250 MB             |
| Deploys per month        | 100                |
| Page views per site/mo   | 50,000             |
| Preview screenshots      | Every deploy       |
| Email notifications      | Unlimited          |
| One-time links           | Unlimited          |
| Custom domain support    | ✅                 |
| Priority support         | ✅                 |

### Scale Plan (future)
Target: $49/mo — custom limits, team seats, API access, webhooks

---

## Cost Model @ 1M Free Users

### Per-User Monthly Costs
| Component          | Usage               | Cost/user    | Total (1M)  |
|--------------------|----------------------|-------------|-------------|
| R2 storage         | 15MB                | $0.000225   | $225        |
| R2 writes          | 50 puts (10 deploys × 5 files) | $0.000225 | $225  |
| Screenshots        | 1 (first deploy)    | $0.0005     | $500        |
| KV read/write      | ~100 ops            | $0.0001     | $100        |
| Workers            | ~100 requests       | $0.00003    | $30         |
| R2 reads           | ~50 reads           | $0.000018   | $18         |
| D1                 | ~20 rows r/w        | $0.000022   | $22         |
| Email              | ~0.1 (5% active)    | $0.00009    | $90         |
| **Total**          |                     | **$0.0012** | **$1,215**  |

### Budget
- Target: $2,000/mo at 1M users
- Actual: $1,215/mo — **$785 buffer** for spikes + growth

### Key Insight
Screenshots dominate cost. Auto-screenshot on every deploy would cost $2,500/mo alone.
Free tier gets screenshot on first deploy only; manual refresh available via Preview button.
Pro tier gets auto-screenshot on every deploy.

---

## Enforcement Points

### Worker-side (API middleware)
1. **Site creation** → check `sites.count WHERE owner_id = ?` against plan limit
2. **File upload** → check `SUM(size) WHERE site_id = ?` against storage limit
3. **Deploy** → check `deploys_this_month WHERE owner_id = ?` against plan limit
4. **Screenshot trigger** → free: only if `thumbnail_status IS NULL` (first time)
5. **Page view** → check site monthly view count; serve 429 if exceeded
6. **Email send** → check `emails_this_month WHERE owner_id = ?`
7. **One-time link creation** → check active link count

### Response on limit hit
- API returns `{ error: "Limit reached", limit: "sites", current: 3, max: 3, upgrade_url: "/pricing" }`
- Dashboard shows upgrade prompt with usage bar
- Page views over limit: serve a "bandwidth exceeded" page (not a hard block — shows site name + upgrade CTA)

### Database Schema Additions
```sql
ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN deploys_this_month INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN deploys_reset_at INTEGER;
ALTER TABLE users ADD COLUMN emails_this_month INTEGER DEFAULT 0;
ALTER TABLE sites ADD COLUMN views_this_month INTEGER DEFAULT 0;
ALTER TABLE sites ADD COLUMN views_reset_at INTEGER;
```

### Monthly Reset
- Cron trigger (CF Worker scheduled event) or lazy reset on first request of the month

---

## Feature Status

### Shipped ✅
- [x] GitHub OAuth (owner + visitor)
- [x] Edge proxy with gate page
- [x] Dashboard (app.oauth.page)
- [x] CLI (oauthpage login/add/deploy/access)
- [x] Site preview screenshots (Browser Rendering)
- [x] Auto-screenshot on deploy
- [x] Email notifications (Resend)
- [x] One-time links (beta)
- [x] Sentry error tracking
- [x] Landing page (oauth.page)
- [x] Danger Zone delete confirmation
- [x] Free tier limit enforcement (7 checkpoints)
- [x] Markdown sites (server-side Docsify, auto-sidebar, dark/light theme)
- [x] KV-backed owner sessions (revocable, replaces JWT)
- [x] Deploy = full replace (not additive)
- [x] Security audit v3 (XSS fixes in OTL, views exceeded, sidebar)

### In Progress 🔧
- [ ] CLI npm publish (`npx oauthpage`)

### Backlog 📋
- [ ] Google OAuth credentials (secrets not set)
- [ ] CLI npm publish (`npx oauthpage`)
- [ ] Deploy history timeline
- [ ] Drag-drop upload zone
- [ ] Reliable bandwidth tracking (CF Analytics Engine)
- [ ] Rate limits + abuse controls
- [ ] Billing integration (Stripe)
- [ ] Custom domains (Pro)
- [ ] Team seats (Scale)
- [ ] Landing page: real screenshot, SPA mention, trust signals, social links

---

## Planned Feature: Markdown Sites

### Vision
Deploy markdown files as beautiful, private websites. No LLM, no build tools, no config.
The simplest way to share private docs, notes, specs, and knowledge bases.

### User Stories
1. **Solo dev**: `oauthpage deploy SPEC.md --site spec` → private spec shared with 3 teammates
2. **Team lead**: `oauthpage deploy ./docs/ --site team-docs` → multi-page internal docs
3. **Founder**: `oauthpage deploy pitch.md --site investors` → private pitch deck with one-time links
4. **Researcher**: `oauthpage deploy ./papers/ --site research` → share findings with collaborators

### CLI Interface
```bash
# Single file → single page site
oauthpage deploy README.md --site my-docs

# Folder → multi-page site with navigation
oauthpage deploy ./docs/ --site team-docs

# With options
oauthpage deploy ./notes/ --site notes

# Pipe from stdin (combine with other tools)
cat CHANGELOG.md | oauthpage deploy - --site changelog
```

### How It Works (server-side Docsify)

- Server renders Docsify shell dynamically for markdown-only sites
- CLI uploads raw markdown only (no template files)
```
.md files → CLI uploads raw to R2 → Done

On request:
Worker detects .md-only site (no index.html)
→ Generates Docsify shell (title from DB)
→ Auto-generates _sidebar.md from R2 listing
→ Docsify renders markdown client-side

All template logic lives in the worker.
Template updates ship to ALL sites instantly.
```

### Template Features (powered by Docsify)
- **Docsify**: MIT-licensed, battle-tested (29K★ GitHub)
- **Code blocks**: Syntax highlighting via Prism.js (auto-detect language)
- **Tables**: Styled, responsive
- **Table of contents**: Auto-generated from headings (subMaxLevel: 3)
- **Navigation**: Auto-generated sidebar from R2 file listing
- **Dark/light mode**: Toggle button, persisted in localStorage
- **Search**: Full-text search across all pages (built-in plugin)
- **Copy code**: One-click copy button on code blocks
- **Mobile**: Fully responsive, hamburger nav
- **Zero CLI overhead**: CLI just uploads .md files

### Frontmatter Support
```markdown
---
title: API Reference
description: Internal API docs for the team
theme: dark
toc: true
nav_order: 2
---

# API Reference
...
```

### Folder Structure → Site Structure
```
docs/
├── index.md          → /           (home page)
├── getting-started.md → /getting-started
├── api/
│   ├── index.md      → /api        (section landing)
│   ├── auth.md       → /api/auth
│   └── endpoints.md  → /api/endpoints
└── changelog.md      → /changelog
```

Navigation auto-generated from folder hierarchy.
File names → page titles (kebab-case → Title Case).
`nav_order` frontmatter overrides sort order.

### Themes (built-in, no config needed)
- `dark` — zinc-950 bg, matches OAuthPage dashboard (default)
- `light` — clean white, optimized for reading
- `github` — GitHub-flavored markdown style

### Implementation Plan
1. **Phase 1**: ✅ SHIPPED — Server-side Docsify, single + multi-file, auto-sidebar
2. **Phase 2**: Frontmatter support (title, nav_order), nested folder nav
3. **Phase 3**: Dashboard theme picker, inline .md editor

### Dependencies
- Docsify v4 (~45KB, loaded from CDN, cached)
- Prism.js (syntax highlighting, loaded from CDN)
- docsify-themeable (dark/light themes)
- docsify-copy-code (copy button plugin)
- Zero npm dependencies in CLI for this feature

### Cost Impact
- Zero additional infrastructure cost
- Only raw .md files stored in R2
- KV cache for sidebar + site detection (1hr TTL)
- 1 R2 list op per cache miss (~$0.36/1M)
- Typical markdown site: 10-50KB stored

### Why This Wins
- **vs Notion**: Private by default, no account needed for readers, custom domain
- **vs GitHub Pages**: OAuth-gated, not public, one-time links
- **vs GitBook/Docusaurus**: Zero config, no build pipeline, 1 command
- **vs Google Docs link sharing**: Beautiful, fast, branded, access control

---

## Testing Strategy

### Unit Tests (102 tests) ✅
- Mock all external APIs (GitHub, Google, Resend)
- Test routing, auth, limits, cookies, XSS escaping
- `cd worker && npm test`
- Run before every deploy

### Integration Tests (staging) — Backlog 📋
Hit real staging worker with real DB/KV/R2:
- [ ] Deploy replaces files (upload A, upload B, A is gone)
- [ ] Markdown site gets Docsify shell
- [ ] Auto-sidebar generated from .md files
- [ ] Approve flow sends real email (verify via Resend API)
- [ ] Deny flow sends real email
- [ ] One-time link: create → consume → expired on reuse
- [ ] View limit: hit 1000 views → 429 page
- [ ] Storage limit: exceed 5MB → 403
- [ ] Deploy limit: exceed 10 → 403
- [ ] Site creation limit: 4th site → 403

### Browser Tests (Playwright) — Backlog 📋
Real browser against staging, tests the full user journey:
- [ ] Landing page loads, animations render
- [ ] Login → GitHub OAuth → redirect to /sites
- [ ] Create site → appears in dashboard
- [ ] Deploy via dashboard drag-drop (future)
- [ ] Preview thumbnail loads
- [ ] Approve/deny from Pending Requests tab
- [ ] Delete site → Danger Zone confirmation flow
- [ ] Mobile: hamburger menu, card layouts, no overflow
- [ ] Markdown site: sidebar nav, theme toggle, search
- [ ] Dark/light theme toggle persists across reload
- [ ] Gate page: sign in buttons, request access, pending state

### CLI Tests — Backlog 📋
Test the CLI binary against staging:
- [ ] `oauthpage login` → opens browser, stores token
- [ ] `oauthpage sites` → lists sites
- [ ] `oauthpage deploy ./dir --site x` → uploads files
- [ ] `oauthpage deploy README.md --site x` → markdown mode
- [ ] `oauthpage add "Name" --slug x` → creates site
- [ ] `oauthpage remove x` → deletes site
- [ ] Deploy folder with no .md → normal static site
- [ ] Deploy folder with only .md → no index.html uploaded
- [ ] Error handling: no auth, invalid site, network failure
