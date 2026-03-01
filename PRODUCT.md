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

### In Progress 🔧
- [ ] Free tier limit enforcement
- [ ] Sentry committed + filtering

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
oauthpage deploy ./notes/ --site notes --theme dark --toc --title "Project Notes"

# Pipe from stdin (combine with other tools)
cat CHANGELOG.md | oauthpage deploy - --site changelog
```

### How It Works (no magic)
```
┌──────────────────────────────────────────┐
│                                          │
│  .md files                               │
│      ↓                                   │
│  CLI (runs locally, no LLM)             │
│      ↓                                   │
│  1. Parse markdown (markdown-it)         │
│  2. Extract frontmatter (title, desc)    │
│  3. Generate table of contents           │
│  4. Syntax highlight code blocks         │
│  5. Wrap in HTML template + CSS          │
│  6. Build nav from folder structure      │
│      ↓                                   │
│  Deploy to OAuthPage (existing flow)     │
│      ↓                                   │
│  Private site with OAuth gate            │
│                                          │
└──────────────────────────────────────────┘
```

### Template Features
- **Typography**: Clean, readable prose (system fonts, proper line-height)
- **Code blocks**: Syntax highlighting via highlight.js (50+ languages)
- **Tables**: Styled, responsive, horizontal scroll on mobile
- **Images**: Lazy-loaded, lightbox on click
- **Table of contents**: Auto-generated from h1-h3, sticky sidebar on desktop
- **Navigation**: Auto-generated from folder structure (multi-file deploys)
- **Dark/light mode**: Toggle, respects system preference
- **Search**: Client-side full-text search across all pages (Ctrl+K)
- **Mobile**: Fully responsive, hamburger nav, touch-friendly

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
1. **Phase 1**: Single .md file → styled HTML (markdown-it + template)
2. **Phase 2**: Folder → multi-page site with nav
3. **Phase 3**: Search, lightbox, advanced features

### Dependencies (all lightweight, no LLM)
- `markdown-it` — markdown parser (~30KB)
- `highlight.js` — syntax highlighting (tree-shakeable, ~20KB per language)
- `gray-matter` — frontmatter parser (~5KB)
- HTML template — single CSS file (~10KB)

### Cost Impact
- Zero additional infrastructure cost
- Processing happens in CLI (client-side)
- Only stores the generated HTML in R2 (existing flow)
- Typical markdown site: 50-200KB total

### Why This Wins
- **vs Notion**: Private by default, no account needed for readers, custom domain
- **vs GitHub Pages**: OAuth-gated, not public, one-time links
- **vs GitBook/Docusaurus**: Zero config, no build pipeline, 1 command
- **vs Google Docs link sharing**: Beautiful, fast, branded, access control
