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
