#!/usr/bin/env bash
# Usage: e2e-prod.sh <log-path> [playwright args…]
# Seeds the local DB, builds, starts and runs Playwright's production config
# with CI's fake credentials (.github/workflows/performance.yml).
set -u
cd "$(git rev-parse --show-toplevel)"
HOST=${E2E_HOST:-localhost}
export AUTH_DRIZZLE_URL=postgres://postgres:postgres@localhost:5439/gdgoc \
  BETTER_AUTH_SECRET=test-secret-at-least-32-characters-long \
  BETTER_AUTH_URL=http://$HOST:3100 \
  GITHUB_CLIENT_ID=test-github-client-id GITHUB_CLIENT_SECRET=test-github-client-secret \
  GOOGLE_CLIENT_ID=test-google-client-id GOOGLE_CLIENT_SECRET=test-google-client-secret \
  NEXT_PUBLIC_SITE_URL=http://$HOST:3100 NEXT_PUBLIC_IMAGE_URL=https://cdn.example/ \
  CLOUDFLARE_ACCOUNT_ID=test-account R2_ACCESS_KEY=test-access-key \
  R2_SECRET_KEY=test-secret-key R2_BUCKET_NAME=test-bucket \
  RESEND_API_KEY=test-resend-key E2E_SEEDED_BEFORE_BUILD=1 NEXT_EXPOSE_TESTING_API=1
LOG="$1"; shift
pnpm exec playwright test --config=playwright.production.config.ts --reporter=line "$@" > "$LOG" 2>&1
status=$?
echo "exit $status" >> "$LOG"
exit $status
