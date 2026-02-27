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

- [ ] **Bring Google OAuth live** — set wrangler secrets (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), add localhost + prod redirect URIs in Google Console, publish consent screen, smoke test owner + visitor login flows
- [ ] Site thumbnails on site cards (Vercel-style preview)
- [ ] Deploy history timeline (timestamp, file count, actor)
- [ ] Drag-drop upload zone with per-file status rows
- [ ] CLI npm publish + install docs (`npx oauthpage`)
- [ ] Audit/security hardening pass (rate limits, MIME policy, abuse controls)
- [ ] Monitoring/alerts for worker + R2 errors
- [ ] Billing tiers enforcement (storage/requests/bandwidth limits)
