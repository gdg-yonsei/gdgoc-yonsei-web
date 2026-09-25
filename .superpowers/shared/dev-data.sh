#!/usr/bin/env bash
# Restore the dev-seed dataset (what the perf baseline was measured on).
set -eu
cd "$(git rev-parse --show-toplevel)"
export AUTH_DRIZZLE_URL=postgres://postgres:postgres@localhost:5439/gdgoc
pnpm exec tsx .superpowers/shared/truncate-local.ts
pnpm db:seed
