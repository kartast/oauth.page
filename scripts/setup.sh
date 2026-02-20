#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# OAuthPage Setup Script
# Safe to re-run (idempotent)
# ──────────────────────────────────────────────

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

info()  { echo -e "${CYAN}ℹ${NC}  $1"; }
ok()    { echo -e "${GREEN}✓${NC}  $1"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $1"; }
err()   { echo -e "${RED}✗${NC}  $1"; }

header() {
  echo ""
  echo -e "${PURPLE}${BOLD}━━━ $1 ━━━${NC}"
  echo ""
}

# Navigate to project root (one level up from scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

echo ""
echo -e "${PURPLE}${BOLD}  ╔══════════════════════════╗${NC}"
echo -e "${PURPLE}${BOLD}  ║     OAuthPage Setup       ║${NC}"
echo -e "${PURPLE}${BOLD}  ╚══════════════════════════╝${NC}"
echo ""

# ──────────────────────────────────────────────
# 1. Check prerequisites
# ──────────────────────────────────────────────
header "Checking prerequisites"

check_cmd() {
  if command -v "$1" &>/dev/null; then
    ok "$1 found: $(command -v "$1")"
    return 0
  else
    err "$1 not found"
    return 1
  fi
}

MISSING=0
check_cmd node || MISSING=1
check_cmd npm  || MISSING=1
check_cmd npx  || MISSING=1

# Check for wrangler
if command -v wrangler &>/dev/null; then
  ok "wrangler found (global)"
elif npx wrangler --version &>/dev/null 2>&1; then
  ok "wrangler found (via npx)"
  alias wrangler="npx wrangler"
else
  warn "wrangler not found — installing globally..."
  npm install -g wrangler
fi

if [ "$MISSING" -eq 1 ]; then
  err "Missing prerequisites. Please install them and re-run."
  exit 1
fi

# ──────────────────────────────────────────────
# 2. Install dependencies
# ──────────────────────────────────────────────
header "Installing dependencies"

if [ -d "node_modules" ] && [ -d "worker/node_modules" ] && [ -d "dashboard/node_modules" ]; then
  ok "node_modules already present (skipping install)"
else
  npm install
  ok "Dependencies installed"
fi

# ──────────────────────────────────────────────
# 3. Collect credentials
# ──────────────────────────────────────────────
header "Configuring credentials"

prompt_or_env() {
  local VAR_NAME="$1"
  local PROMPT_TEXT="$2"
  local CURRENT_VAL="${!VAR_NAME:-}"

  if [ -n "$CURRENT_VAL" ]; then
    ok "$VAR_NAME already set in environment"
    echo "$CURRENT_VAL"
  else
    read -rp "  $PROMPT_TEXT: " VAL
    if [ -z "$VAL" ]; then
      warn "$VAR_NAME left empty (you can set it later in .dev.vars)"
    fi
    echo "$VAL"
  fi
}

GITHUB_CLIENT_ID=$(prompt_or_env GITHUB_CLIENT_ID "GitHub OAuth Client ID")
GITHUB_CLIENT_SECRET=$(prompt_or_env GITHUB_CLIENT_SECRET "GitHub OAuth Client Secret")
GOOGLE_CLIENT_ID=$(prompt_or_env GOOGLE_CLIENT_ID "Google OAuth Client ID")
GOOGLE_CLIENT_SECRET=$(prompt_or_env GOOGLE_CLIENT_SECRET "Google OAuth Client Secret")
JWT_SECRET=$(prompt_or_env JWT_SECRET "JWT Secret (leave blank to auto-generate)")

if [ -z "$JWT_SECRET" ]; then
  JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n')
  ok "Generated JWT_SECRET"
fi

# ──────────────────────────────────────────────
# 4. Wrangler auth check
# ──────────────────────────────────────────────
header "Cloudflare authentication"

if npx wrangler whoami &>/dev/null 2>&1; then
  ok "Already authenticated with Cloudflare"
else
  warn "Not logged in to Cloudflare"
  echo "  Running 'wrangler login'..."
  npx wrangler login
fi

# ──────────────────────────────────────────────
# 5. Create D1 database
# ──────────────────────────────────────────────
header "Creating D1 database"

cd "$PROJECT_DIR/worker"

D1_OUTPUT=$(npx wrangler d1 create oauth-page-db 2>&1 || true)

if echo "$D1_OUTPUT" | grep -q "already exists"; then
  warn "D1 database 'oauth-page-db' already exists"
  # Try to get existing database ID
  D1_ID=$(npx wrangler d1 list 2>/dev/null | grep oauth-page-db | awk '{print $1}' || echo "")
else
  D1_ID=$(echo "$D1_OUTPUT" | grep -oP 'database_id\s*=\s*"\K[^"]+' || echo "")
  if [ -z "$D1_ID" ]; then
    # Alternate parsing
    D1_ID=$(echo "$D1_OUTPUT" | grep -o '[0-9a-f\-]\{36\}' | head -1 || echo "")
  fi
  ok "D1 database created"
fi

if [ -n "$D1_ID" ]; then
  ok "D1 database_id: $D1_ID"
else
  warn "Could not extract D1 database_id — update wrangler.toml manually"
  D1_ID="REPLACE_WITH_DATABASE_ID"
fi

# ──────────────────────────────────────────────
# 6. Create KV namespaces
# ──────────────────────────────────────────────
header "Creating KV namespaces"

create_kv() {
  local NAME="$1"
  local OUTPUT
  OUTPUT=$(npx wrangler kv:namespace create "$NAME" 2>&1 || true)

  if echo "$OUTPUT" | grep -q "already exists\|already a namespace"; then
    warn "KV namespace '$NAME' already exists"
    # Try to list and find it
    local KV_ID
    KV_ID=$(npx wrangler kv:namespace list 2>/dev/null | grep -A1 "\"title\":.*$NAME" | grep -o '"id":\s*"[^"]*"' | grep -o '[0-9a-f\-]\{32,\}' | head -1 || echo "")
    echo "$KV_ID"
  else
    local KV_ID
    KV_ID=$(echo "$OUTPUT" | grep -o '[0-9a-f]\{32\}' | head -1 || echo "")
    if [ -n "$KV_ID" ]; then
      ok "KV namespace '$NAME' created: $KV_ID"
    fi
    echo "$KV_ID"
  fi
}

KV_ID=$(create_kv "KV")
if [ -z "$KV_ID" ]; then
  warn "Could not extract KV namespace id — update wrangler.toml manually"
  KV_ID="REPLACE_WITH_KV_ID"
fi

# ──────────────────────────────────────────────
# 7. Run D1 migration
# ──────────────────────────────────────────────
header "Running D1 migration"

if [ -f "$PROJECT_DIR/worker/drizzle/0000_init.sql" ]; then
  npx wrangler d1 execute oauth-page-db --local --file=./drizzle/0000_init.sql 2>/dev/null && \
    ok "Migration applied (local)" || \
    warn "Migration may have already been applied (local)"

  if [ "$D1_ID" != "REPLACE_WITH_DATABASE_ID" ]; then
    echo ""
    read -rp "  Apply migration to remote D1? (y/N): " APPLY_REMOTE
    if [[ "$APPLY_REMOTE" =~ ^[Yy]$ ]]; then
      npx wrangler d1 execute oauth-page-db --file=./drizzle/0000_init.sql && \
        ok "Migration applied (remote)" || \
        warn "Remote migration failed — you can run it later"
    fi
  fi
else
  err "Migration file not found: worker/drizzle/0000_init.sql"
fi

# ──────────────────────────────────────────────
# 8. Update wrangler.toml
# ──────────────────────────────────────────────
header "Updating wrangler.toml"

cd "$PROJECT_DIR/worker"

if [ "$D1_ID" != "REPLACE_WITH_DATABASE_ID" ]; then
  sed -i.bak "s/database_id = \"REPLACE_WITH_DATABASE_ID\"/database_id = \"$D1_ID\"/" wrangler.toml 2>/dev/null || \
  sed -i '' "s/database_id = \"REPLACE_WITH_DATABASE_ID\"/database_id = \"$D1_ID\"/" wrangler.toml
  ok "Updated D1 database_id in wrangler.toml"
fi

if [ "$KV_ID" != "REPLACE_WITH_KV_ID" ]; then
  sed -i.bak "s/id = \"REPLACE_WITH_KV_ID\"/id = \"$KV_ID\"/" wrangler.toml 2>/dev/null || \
  sed -i '' "s/id = \"REPLACE_WITH_KV_ID\"/id = \"$KV_ID\"/" wrangler.toml
  ok "Updated KV namespace id in wrangler.toml"
fi

# Clean up backup files
rm -f wrangler.toml.bak

# ──────────────────────────────────────────────
# 9. Create .dev.vars
# ──────────────────────────────────────────────
header "Creating .dev.vars"

DEV_VARS="$PROJECT_DIR/worker/.dev.vars"

if [ -f "$DEV_VARS" ]; then
  warn ".dev.vars already exists — backing up to .dev.vars.bak"
  cp "$DEV_VARS" "$DEV_VARS.bak"
fi

cat > "$DEV_VARS" <<EOF
GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
JWT_SECRET=${JWT_SECRET}
EOF

ok ".dev.vars written"

# ──────────────────────────────────────────────
# Done!
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━ Setup Complete! ━━━${NC}"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo ""
echo -e "  ${CYAN}1.${NC} Start development:"
echo -e "     ${BOLD}npm run dev${NC}"
echo ""
echo -e "  ${CYAN}2.${NC} Open dashboard:"
echo -e "     ${BOLD}http://localhost:5173${NC}"
echo ""
echo -e "  ${CYAN}3.${NC} Worker API:"
echo -e "     ${BOLD}http://localhost:8787${NC}"
echo ""
echo -e "  ${CYAN}4.${NC} Deploy when ready:"
echo -e "     ${BOLD}./scripts/deploy.sh${NC}"
echo ""
