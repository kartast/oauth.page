#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# OAuthPage Deploy Script
# ──────────────────────────────────────────────

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo -e "${PURPLE}${BOLD}  ╔══════════════════════════╗${NC}"
echo -e "${PURPLE}${BOLD}  ║    OAuthPage Deploy       ║${NC}"
echo -e "${PURPLE}${BOLD}  ╚══════════════════════════╝${NC}"
echo ""

# ──────────────────────────────────────────────
# 1. Deploy Worker
# ──────────────────────────────────────────────
echo -e "${CYAN}▸${NC} Deploying worker..."
cd "$PROJECT_DIR/worker"
npx wrangler deploy
WORKER_URL="https://app.oauth.page"
echo -e "${GREEN}✓${NC} Worker deployed"

# ──────────────────────────────────────────────
# 2. Build + Deploy Dashboard
# ──────────────────────────────────────────────
echo ""
echo -e "${CYAN}▸${NC} Building dashboard..."
cd "$PROJECT_DIR/dashboard"
npm run build
echo -e "${GREEN}✓${NC} Dashboard built"

echo -e "${CYAN}▸${NC} Deploying dashboard to Pages..."
npx wrangler pages deploy dist --project-name=oauth-page-dashboard
DASHBOARD_URL="https://oauth-page-dashboard.pages.dev"
echo -e "${GREEN}✓${NC} Dashboard deployed"

# ──────────────────────────────────────────────
# Done
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━ Deploy Complete! ━━━${NC}"
echo ""
echo -e "  ${BOLD}Worker:${NC}    ${WORKER_URL}"
echo -e "  ${BOLD}Dashboard:${NC} ${DASHBOARD_URL}"
echo ""
echo -e "  Don't forget to set production secrets if you haven't:"
echo -e "  ${CYAN}cd worker && npx wrangler secret put GITHUB_CLIENT_SECRET${NC}"
echo ""
