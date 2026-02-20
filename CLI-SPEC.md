# OAuthPage CLI Specification

## Package
- Name: `oauthpage` (npm)
- Usage: `npx oauthpage <command>`
- Runtime: Node.js (18+)
- Zero native deps — pure JS/TS

## Commands

### `oauthpage login`
Opens browser for OAuth login, receives token via localhost callback.

```
$ npx oauthpage login
🔑 Opening browser for login...
   → https://oauth.page/cli/auth?port=9876

   Waiting for authentication...

✅ Logged in as karta@unplug.io (via GitHub)
   Token saved to ~/.oauthpage/credentials.json
```

**Flow:**
1. CLI starts temporary HTTP server on random port (e.g., 9876)
2. Opens browser to `https://oauth.page/cli/auth?port=9876&callback=http://localhost:9876/callback`
3. User signs in with GitHub/Google on oauth.page
4. oauth.page redirects to `http://localhost:9876/callback?token=<api_token>`
5. CLI receives token, saves to `~/.oauthpage/credentials.json`
6. Temporary server shuts down

**Credentials file (`~/.oauthpage/credentials.json`):**
```json
{
  "token": "op_xxxxxxxxxxxx",
  "email": "karta@unplug.io",
  "name": "Karta Sutanto",
  "provider": "github",
  "created_at": "2026-02-20T14:00:00Z"
}
```

### `oauthpage deploy [dir]`
Deploy a static site to oauth.page.

```
$ npx oauthpage deploy ./dist
📦 Deploying ./dist to oauth.page...
   Found 42 files (1.2 MB)
   Uploading... ████████████████████ 100%

🚀 Live at: https://myapp.oauth.page
   Protected: visitors need GitHub/Google sign-in
   Dashboard: https://app.oauth.page/sites/abc123
```

**Options:**
- `--slug <name>` — custom subdomain (default: directory name or auto-generated)
- `--origin <url>` — protect an existing URL instead of uploading files
- `--open` — open browser after deploy
- `--public` — deploy WITHOUT protection (opt-out)

**Two modes:**
1. **Upload mode** (`deploy ./dist`) — uploads static files, we host them + protect
2. **Proxy mode** (`deploy --origin https://mysite.vercel.app`) — just set up the proxy, no upload

### `oauthpage list`
List your protected sites.

```
$ npx oauthpage list
┌──────────────┬────────────────────────────┬────────┬─────────┐
│ Slug         │ Origin                     │ Users  │ Pending │
├──────────────┼────────────────────────────┼────────┼─────────┤
│ myapp        │ (hosted)                   │ 5      │ 2       │
│ staging      │ https://staging.vercel.app │ 3      │ 0       │
│ client-demo  │ https://demo.netlify.app   │ 1      │ 1       │
└──────────────┴────────────────────────────┴────────┴─────────┘
```

### `oauthpage allow <email> [--site <slug>]`
Pre-approve a visitor by email.

```
$ npx oauthpage allow client@company.com --site staging
✅ client@company.com approved for staging.oauth.page
```

### `oauthpage revoke <email> [--site <slug>]`
Remove a visitor's access.

### `oauthpage status [slug]`
Show site details, access list, pending requests.

### `oauthpage logout`
Remove saved credentials.

### `oauthpage whoami`
Show current logged-in user.

## API Endpoints Needed (Worker)

### CLI Auth
- `GET /cli/auth?port=PORT&callback=URL` — renders OAuth page with CLI callback
- `POST /api/cli/token` — exchange OAuth session for long-lived API token
- API tokens stored in D1: `api_tokens` table (token, user_id, name, created_at, last_used)

### Site Deploy (Upload Mode)
- `POST /api/sites/:id/upload` — multipart upload of static files
- Files stored in CF R2 (or served from KV for small sites)
- Worker serves uploaded files for hosted sites

### Existing API (already built)
- All /api/sites/* endpoints work with Bearer token auth (already supported)

## File Hosting Architecture

For upload mode, we need to store + serve static files:

**Option A: KV-based (MVP, simple)**
- Store each file as KV key: `file:{site_id}:{path}` → content
- Worker serves from KV on proxy requests
- Limit: 25MB per value, good enough for static sites
- Free tier: 100K reads/day

**Option B: R2-based (scale)**
- Store files in R2 bucket
- Worker fetches from R2 on proxy requests
- Better for larger sites
- Free tier: 10GB storage, 10M reads/month

Recommend: Start with KV for MVP, migrate to R2 later.

## NPM Package Structure

```
oauthpage/
├── bin/
│   └── oauthpage.js       # CLI entry point (#!/usr/bin/env node)
├── src/
│   ├── cli.ts             # Command parser (use commander.js)
│   ├── commands/
│   │   ├── login.ts
│   │   ├── deploy.ts
│   │   ├── list.ts
│   │   ├── allow.ts
│   │   ├── revoke.ts
│   │   ├── status.ts
│   │   └── logout.ts
│   ├── auth.ts            # Token management (~/.oauthpage/)
│   ├── api.ts             # HTTP client for oauth.page API
│   └── upload.ts          # File upload logic
├── package.json
├── tsconfig.json
└── README.md
```

## Priority
- Phase 1 MVP: `login`, `deploy --origin`, `list` (proxy mode only)
- Phase 2: `deploy ./dist` (upload mode), `allow`, `revoke`
- Phase 3: `status`, custom domains, team features
