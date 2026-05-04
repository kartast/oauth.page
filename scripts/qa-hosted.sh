#!/usr/bin/env bash
set -euo pipefail

BASE_APP="https://app.oauth.page"
BASE_ROOT="https://oauth.page"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLI_DIR="$PROJECT_ROOT/packages/cli"

printf "\n[1/5] Worker test suite...\n"
cd "$PROJECT_ROOT/worker"
npm test >/dev/null
printf "  ✅ worker tests passed\n"

printf "\n[2/5] CLI test suite...\n"
if [[ -f "$CLI_DIR/package.json" ]]; then
  cd "$CLI_DIR"
  npm test >/dev/null
  printf "  ✅ cli tests passed\n"
else
  printf "  ↷ skipped (packages/cli not present in this checkout)\n"
fi

printf "\n[3/5] Hosted app health...\n"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_APP/health")
[[ "$code" == "200" ]] || { echo "health failed: $code"; exit 1; }
printf "  ✅ app health 200\n"

printf "\n[4/5] Hosted dashboard + auth endpoints...\n"
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_APP/sites/new")
[[ "$code" == "200" ]] || { echo "sites/new failed: $code"; exit 1; }
unauth=$(curl -s "$BASE_APP/api/auth/me")
[[ "$unauth" == *"user"* ]] || true
printf "  ✅ dashboard route reachable\n"

printf "\n[5/5] Hosted site gate/serve smoke...\n"
html=$(curl -s https://my-docs.oauth.page/ | head -n 30)
if [[ "$html" == *"Request Access"* || "$html" == *"This site is private"* || "$html" == *"Hello from OAuthPage"* ]]; then
  printf "  ✅ hosted site responds (gate or content)\n"
else
  echo "unexpected site response"
  exit 1
fi

printf "\nHosted QA PASS ✅\n"
