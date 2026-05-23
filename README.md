# OAuthPage

> Private deploys for AI-built pages, docs, demos, and internal tools.

OAuthPage hosts static sites on Cloudflare and puts an OAuth access gate in front of them. Site owners deploy with the CLI or dashboard, share a `*.oauth.page` URL, and approve or revoke visitors from the dashboard or CLI.

## Quick Start

```bash
npx oauthpage login
npx oauthpage deploy ./dist --name "My App" --slug my-app
```

Your protected site is live at:

```text
https://my-app.oauth.page
```

Visitors sign in with GitHub or Google and request access. You approve them from `https://app.oauth.page` or with:

```bash
npx oauthpage approve my-app user@example.com
```

One-time links are available in beta:

```bash
npx oauthpage link create my-app --ttl 1h
# https://my-app.oauth.page/_otl/...
```

Treat one-time links as bearer-style access links: anyone with the link can open the configured path without OAuth until it is consumed, expires, or is revoked.

## Architecture

```
┌──────────────┐        ┌───────────────────────────┐        ┌──────────────┐
│              │  HTTPS  │      Cloudflare Edge      │  HTTPS  │              │
│   Visitor    │────────▶│                           │────────▶│   Origin     │
│   Browser    │◀────────│   ┌─────────────────┐     │◀────────│   Server     │
│              │         │   │  OAuthPage Worker │     │         │              │
└──────────────┘         │   │  (Hono + D1/KV)  │     │         └──────────────┘
                         │   └────────┬────────┘     │
                         │            │              │
                         │   ┌────────┴────────┐     │
                         │   │  D1 (SQLite)    │     │
                         │   │  KV (Sessions)  │     │
                         │   └─────────────────┘     │
                         └───────────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                    ┌────┴─────┐
                    │ Dashboard│
                    │ (Pages)  │
                    └──────────┘
```

### How It Works

1. Visitor hits `mysite.oauth.page`
2. Worker checks for `gk_session` cookie → validates via KV
3. **Valid** → proxy request to origin
4. **Invalid** → show gate page with "Sign in with GitHub/Google" buttons
5. Visitor signs in via OAuth → identity stored in `gk_visitor` cookie
6. Visitor clicks "Request Access" → request created in D1 with OAuth identity
7. Owner sees request in dashboard with avatar/name/email/provider → approves
8. On approve → session created in KV → visitor refreshes → `gk_session` cookie set → full access

## Cookies

| Cookie | Purpose | TTL |
|---|---|---|
| `gk_session` | Site access (visitor approved) | 30 days |
| `gk_visitor` | Visitor identity during request flow | 1 day |
| `gk_owner` | Dashboard access (owner) | 30 days |

## CLI Commands

| Command | Description |
|---|---|
| `npx oauthpage login` | Authenticate with OAuthPage |
| `npx oauthpage whoami` | Show the current authenticated account |
| `npx oauthpage deploy ./dist --name "My App" --slug my-app` | Create and deploy a protected site |
| `npx oauthpage sites` | List your sites |
| `npx oauthpage status my-app` | Show site details and usage |
| `npx oauthpage access my-app` | List approved users and pending requests |
| `npx oauthpage approve my-app user@example.com` | Approve a pending request |
| `npx oauthpage deny my-app user@example.com` | Deny a pending request |
| `npx oauthpage revoke my-app user@example.com` | Revoke access |
| `npx oauthpage remove my-app --yes` | Delete a site and its files |
| `npx oauthpage link create my-app` | Create a beta one-time link |

Install globally with `npm install -g oauthpage` if you want the shorter `opage` alias.

## Local Development Prerequisites

- **Node.js** 18+
- **Cloudflare** account (Workers, D1, KV, Pages)
- **GitHub OAuth** app ([create one](https://github.com/settings/developers))
- **Google OAuth** app ([create one](https://console.cloud.google.com/apis/credentials))

## Local Development

### 1. Clone and Install

```bash
git clone https://github.com/your-org/oauthpage.git
cd oauthpage
npm install
```

### 2. Run Setup

```bash
./scripts/setup.sh
```

This interactive script will:
- Check prerequisites
- Prompt for OAuth credentials
- Create D1 database + KV namespace
- Run database migration
- Update `wrangler.toml` with resource IDs
- Write `.dev.vars` for local development

### 3. Start Development

```bash
npm run dev
```

Opens both:
- **Worker** → `http://localhost:8787`
- **Dashboard** → `http://localhost:5173` (proxies `/api` to worker)

### 4. Deploy

```bash
./scripts/deploy.sh
```

## Environment Variables

| Variable | Description | Where |
|---|---|---|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID | `.dev.vars` / secret |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret | `.dev.vars` / secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `.dev.vars` / secret |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `.dev.vars` / secret |
| `JWT_SECRET` | Secret for signing owner JWTs | `.dev.vars` / secret |
| `APP_URL` | Dashboard URL | `wrangler.toml` vars |

## API Endpoints

### Auth (Owner — Dashboard)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/github` | GitHub OAuth redirect |
| `GET` | `/api/auth/github/callback` | GitHub OAuth callback |
| `POST` | `/api/auth/google` | Google OAuth redirect |
| `GET` | `/api/auth/google/callback` | Google OAuth callback |
| `GET` | `/api/auth/me` | Current owner session |
| `POST` | `/api/auth/logout` | Clear owner session |

### Auth (Visitor — Gate)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/visitor/auth/github?site=<slug>` | Visitor GitHub OAuth |
| `GET` | `/api/visitor/auth/github/callback` | Visitor GitHub callback |
| `GET` | `/api/visitor/auth/google?site=<slug>` | Visitor Google OAuth |
| `GET` | `/api/visitor/auth/google/callback` | Visitor Google callback |

### Sites (requires owner auth)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/sites` | List owner's sites |
| `POST` | `/api/sites` | Create a new site |
| `GET` | `/api/sites/:id` | Get site details |
| `PUT` | `/api/sites/:id` | Update site |
| `DELETE` | `/api/sites/:id` | Delete site |

### Access Requests

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/access/request` | Submit access request (requires `gk_visitor` cookie) |
| `GET` | `/api/sites/:id/requests` | List access requests (owner auth) |
| `POST` | `/api/sites/:id/requests/:rid/approve` | Approve request (owner auth) |
| `POST` | `/api/sites/:id/requests/:rid/deny` | Deny request (owner auth) |
| `DELETE` | `/api/sites/:id/access/:email` | Revoke access (owner auth) |

### Proxy

Any request to `*.oauth.page` (non-`app` subdomain) is proxied to the origin if the visitor has a valid `gk_session`.

## Project Structure

```
oauthpage/
├── worker/                    # Cloudflare Worker (API + proxy)
│   ├── src/
│   │   ├── index.ts           # Hono app entry
│   │   ├── proxy.ts           # Edge proxy logic
│   │   ├── gate.ts            # Gate page (OAuth sign-in + request access)
│   │   ├── types.ts           # TypeScript types
│   │   ├── auth/
│   │   │   ├── github.ts      # Owner GitHub OAuth flow
│   │   │   ├── google.ts      # Owner Google OAuth flow
│   │   │   ├── visitor-github.ts  # Visitor GitHub OAuth flow
│   │   │   ├── visitor-google.ts  # Visitor Google OAuth flow
│   │   │   └── session.ts     # Session + visitor identity management
│   │   ├── api/
│   │   │   ├── sites.ts       # Sites CRUD
│   │   │   └── access.ts      # Access request management
│   │   └── db/
│   │       └── schema.ts      # Drizzle ORM schema
│   ├── drizzle/
│   │   ├── 0000_init.sql      # Initial migration
│   │   ├── 0001_visitor_oauth.sql  # Add OAuth fields to access_requests
│   │   └── meta/              # Drizzle Kit metadata
│   ├── wrangler.toml          # Worker config
│   └── package.json
├── dashboard/                 # React SPA (CF Pages)
│   ├── src/
│   │   ├── App.tsx            # Router + layout
│   │   ├── pages/             # Login, Sites, SiteDetail, CreateSite
│   │   ├── components/        # Layout, SiteCard, AccessList
│   │   └── lib/api.ts         # API client
│   ├── vite.config.ts         # Vite + proxy config
│   └── package.json
├── scripts/
│   ├── setup.sh               # Interactive setup
│   └── deploy.sh              # Build + deploy
├── package.json               # Root workspace
└── README.md
```

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Cloudflare Workers |
| Framework | Hono |
| ORM | Drizzle (D1 / SQLite) |
| Cache | Cloudflare KV |
| Frontend | React 18 + Vite + Tailwind CSS |
| Auth | GitHub OAuth, Google OAuth, JWT |
| Hosting | CF Workers + CF Pages |

## Development

```bash
# Run both worker + dashboard
npm run dev

# Worker only
npm run dev:worker

# Dashboard only
npm run dev:dashboard

# Generate new migration after schema change
cd worker && npm run db:generate

# Apply migrations locally
cd worker && npm run db:migrate
```

## License

MIT
