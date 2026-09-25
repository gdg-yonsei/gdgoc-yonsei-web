import { defineConfig, devices } from '@playwright/test'
import { assertDisposableDatabase } from './scripts/lib/disposable-database'

// The global setup truncates every table and the admin specs write through
// the app, so the whole run must target a disposable database.
assertDisposableDatabase(process.env.AUTH_DRIZZLE_URL, 'Playwright e2e')

const port = Number(process.env.PORT ?? 3100)
// localhost, not 127.0.0.1: WebAuthn rejects IP addresses as a relying-party
// ID, so the passkey e2e can only run on a hostname.
const baseURL = `http://localhost:${port.toString()}`

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/setup/global-setup.ts',
  fullyParallel: true,
  forbidOnly: true,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // Instant-navigation shells run before anything edits data. With the
    // testing API exposed, Next never rebuilds a route's prerendered shell
    // after an admin edit invalidates it (production rebuilds it on the next
    // request), so these checks would see a degraded shell.
    {
      name: 'instant-navigation',
      testMatch: 'instant-navigation.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'production-chromium',
      testIgnore: 'instant-navigation.spec.ts',
      dependencies: ['instant-navigation'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: [
      'pnpm exec tsx tests/e2e/setup/prepare-production.ts',
      'pnpm exec next build',
      `pnpm exec next start --port ${port.toString()}`,
    ].join(' && '),
    url: baseURL,
    env: {
      ...process.env,
      BETTER_AUTH_URL: baseURL,
      NEXT_EXPOSE_TESTING_API: '1',
    },
    reuseExistingServer: false,
    timeout: 5 * 60 * 1000,
  },
})
