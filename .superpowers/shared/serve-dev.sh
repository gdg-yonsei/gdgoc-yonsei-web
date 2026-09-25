#!/usr/bin/env bash
# Usage: serve-dev.sh [port] — next dev with CI's fake env and the local DB.
set -u
cd "$(git rev-parse --show-toplevel)"
PORT=${1:-3200}
export AUTH_DRIZZLE_URL=postgres://postgres:postgres@localhost:5439/gdgoc \
  BETTER_AUTH_SECRET=test-secret-at-least-32-characters-long \
  BETTER_AUTH_URL=http://localhost:$PORT \
  GITHUB_CLIENT_ID=test-github-client-id GITHUB_CLIENT_SECRET=test-github-client-secret \
  GOOGLE_CLIENT_ID=test-google-client-id GOOGLE_CLIENT_SECRET=test-google-client-secret \
  NEXT_PUBLIC_SITE_URL=http://localhost:$PORT NEXT_PUBLIC_IMAGE_URL=https://cdn.example/ \
  CLOUDFLARE_ACCOUNT_ID=test-account R2_ACCESS_KEY=test-access-key \
  R2_SECRET_KEY=test-secret-key R2_BUCKET_NAME=test-bucket RESEND_API_KEY=test-resend-key
unset REDIS_URL
exec pnpm exec next dev --port "$PORT"
