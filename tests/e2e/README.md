# Playwright E2E Tests

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

## Optional
- UI mode: `pnpm test:e2e:ui`
- Headed mode: `pnpm test:e2e:headed`
- Use an existing server:
  - Set `PLAYWRIGHT_BASE_URL`, e.g. `PLAYWRIGHT_BASE_URL=http://localhost:3000`
  - Then run `pnpm test:e2e`
