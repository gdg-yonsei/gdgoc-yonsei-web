# Playwright E2E Tests

> [!CAUTION]
> The global setup truncates every table, auth included. The Playwright
> configs and the reset refuse any `AUTH_DRIZZLE_URL` that is not a local
> database (`scripts/lib/disposable-database.ts`). To allow one specific
> remote database, set `E2E_DISPOSABLE_DATABASE_URL` to its exact URL. Never
> point `AUTH_DRIZZLE_URL` or `REDIS_URL` at a shared, staging, or production
> service.

## Prerequisites

- Export the environment yourself; the Playwright process does not read
  `.env`. Use the variables from `.github/workflows/performance.yml`, with
  `AUTH_DRIZZLE_URL` pointing at a disposable local Postgres (for example
  `postgres://postgres:postgres@localhost:5439/gdgoc`).
- Export every variable in that list. The Next.js server that Playwright
  starts falls back to `.env` for anything missing, which would hand real
  Resend or R2 credentials to the test run.
- The database must be reachable because the home header and many routes
  query it.
- Install browser binaries once:

```bash
pnpm test:e2e:install
```

## Run

```bash
pnpm test:e2e
```

For the production-build path used by CI (including the Next.js `instant()`
testing API):

```bash
pnpm test:e2e:prod
```

The production command seeds before `next build`, so Cache Components and
`generateStaticParams()` see the deterministic fixture. It intentionally uses
the in-process cache handler; leave `REDIS_URL` unset for this disposable run.

## Optional

- UI mode: `pnpm test:e2e:ui`
- Headed mode: `pnpm test:e2e:headed`
- Use an existing server:
  - Set `PLAYWRIGHT_BASE_URL`, e.g. `PLAYWRIGHT_BASE_URL=http://localhost:3000`
  - Then run `pnpm test:e2e`

For non-destructive checks against an already-running production build:

```bash
pnpm perf:instant
PERF_OUTPUT=performance.json pnpm perf:measure
pnpm perf:budget performance.json baseline.json
```
