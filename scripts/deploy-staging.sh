#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# OAuthPage Deploy (Staging)
# ──────────────────────────────────────────────

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load .env if present
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

echo ""
echo -e "${YELLOW}${BOLD}  ╔══════════════════════════════╗${NC}"
echo -e "${YELLOW}${BOLD}  ║    OAuthPage Deploy (STG)     ║${NC}"
echo -e "${YELLOW}${BOLD}  ╚══════════════════════════════╝${NC}"
echo ""

# ──────────────────────────────────────────────
# 1. Run tests
# ──────────────────────────────────────────────
echo -e "${CYAN}▸${NC} Running tests..."
cd "$PROJECT_DIR/worker"
npm test
echo -e "${GREEN}✓${NC} Tests passed"

# ──────────────────────────────────────────────
# 2. Build Dashboard
# ──────────────────────────────────────────────
echo ""
echo -e "${CYAN}▸${NC} Building dashboard..."
cd "$PROJECT_DIR/dashboard"
npm run build
echo -e "${GREEN}✓${NC} Dashboard built"

# ──────────────────────────────────────────────
# 3. Deploy Worker to staging
# ──────────────────────────────────────────────
echo ""
echo -e "${CYAN}▸${NC} Deploying worker to staging..."
cd "$PROJECT_DIR/worker"
npx wrangler deploy --env staging
WORKER_URL="https://oauth-page-worker-staging.karta.workers.dev"
echo -e "${GREEN}✓${NC} Worker deployed to staging"

# ──────────────────────────────────────────────
# 4. Deploy Dashboard to staging Pages
# ──────────────────────────────────────────────
echo ""
echo -e "${CYAN}▸${NC} Deploying dashboard to staging Pages..."
cd "$PROJECT_DIR/dashboard"
npx wrangler pages deploy dist --project-name=oauth-page-dashboard --commit-dirty=true
DASHBOARD_URL="https://oauth-page-dashboard-staging.pages.dev"
echo -e "${GREEN}✓${NC} Dashboard deployed to staging"

# ──────────────────────────────────────────────
# Done
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━ Staging Deploy Complete! ━━━${NC}"
echo ""
echo -e "  ${BOLD}Worker:${NC}    ${WORKER_URL}"
echo -e "  ${BOLD}Dashboard:${NC} ${DASHBOARD_URL}"
echo ""
