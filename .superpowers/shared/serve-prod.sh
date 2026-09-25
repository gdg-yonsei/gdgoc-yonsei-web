#!/usr/bin/env bash
# Usage: serve-prod.sh [--no-build|--no-seed]  — CI fake env, local DB, next start :3100
# --no-seed builds without reseeding the e2e fixture (keeps dev-data.sh data).
set -u
cd "$(git rev-parse --show-toplevel)"
export AUTH_DRIZZLE_URL=postgres://postgres:postgres@localhost:5439/gdgoc \
  BETTER_AUTH_SECRET=test-secret-at-least-32-characters-long \
  BETTER_AUTH_URL=http://localhost:3100 \
  GITHUB_CLIENT_ID=test-github-client-id GITHUB_CLIENT_SECRET=test-github-client-secret \
  GOOGLE_CLIENT_ID=test-google-client-id GOOGLE_CLIENT_SECRET=test-google-client-secret \
  NEXT_PUBLIC_SITE_URL=http://localhost:3100 NEXT_PUBLIC_IMAGE_URL=https://cdn.example/ \
  CLOUDFLARE_ACCOUNT_ID=test-account R2_ACCESS_KEY=test-access-key \
  R2_SECRET_KEY=test-secret-key R2_BUCKET_NAME=test-bucket \
  RESEND_API_KEY=test-resend-key E2E_SEEDED_BEFORE_BUILD=1 NEXT_EXPOSE_TESTING_API=${NEXT_EXPOSE_TESTING_API-1}
case "${1:-}" in
  --no-build) ;;
  --no-seed) pnpm exec next build || exit 1 ;;
  *) pnpm exec tsx tests/e2e/setup/prepare-production.ts && pnpm exec next build || exit 1 ;;
esac
exec pnpm exec next start --port 3100
