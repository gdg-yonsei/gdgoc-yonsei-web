# Playwright E2E Tests

> [!CAUTION]
> The global setup truncates every mutable application table. Only run these
> commands against a disposable E2E database. Never point `AUTH_DRIZZLE_URL`
> or `REDIS_URL` at a shared, staging, or production service.

## Prerequisites

- `.env` must be configured.
- Database must be reachable because the home header and many routes query DB.
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
