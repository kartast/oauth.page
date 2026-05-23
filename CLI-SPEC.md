# OAuthPage CLI Specification

This file tracks the current shipped CLI contract for launch-facing docs.

## Package

- npm package: `oauthpage`
- One-off usage: `npx oauthpage <command>`
- Global install: `npm install -g oauthpage`
- Global aliases after install: `oauthpage`, `opage`
- Config file: `~/.oauthpage/config.json`
- Config override: `OAUTHPAGE_CONFIG_DIR=/path/to/dir`

## Commands

```bash
npx oauthpage login
npx oauthpage whoami
npx oauthpage logout
npx oauthpage sites
npx oauthpage status [slug]
npx oauthpage add <name> --slug <slug>
npx oauthpage deploy <dir-or-file> --site <slug>
npx oauthpage deploy <dir-or-file> --name <name> --slug <slug>
npx oauthpage access <slug>
npx oauthpage approve <slug> <email>
npx oauthpage deny <slug> <email>
npx oauthpage revoke <slug> <email>
npx oauthpage remove <slug> --yes
npx oauthpage link create <slug> --ttl 1h
npx oauthpage link list <slug>
npx oauthpage link revoke <slug> <link-id>
```

All commands support `--json` for script and agent use.

## Current Auth Flow

1. CLI calls `POST https://app.oauth.page/api/cli/auth`.
2. Backend returns a short-lived device code and browser URL.
3. CLI opens the browser URL.
4. User authenticates with GitHub.
5. CLI polls `/api/cli/auth/poll?code=...`.
6. On completion, CLI stores the owner token and profile in `~/.oauthpage/config.json`.

## Deploy Contract

The CLI sends bulk deploys to:

```text
POST /api/sites/:id/deploy
```

Request body:

```json
{
  "files": [
    {
      "path": "index.html",
      "content_base64": "..."
    }
  ]
}
```

The backend treats deploys as full replacement: existing files for the site are removed before new files are written.

## One-Time Links

One-time links are beta bearer-style access links. The generated URL shape is:

```text
https://<slug>.oauth.page/_otl/<token>
```

Anyone with the link can open the configured path without OAuth until the link is consumed, expires, or is revoked.
