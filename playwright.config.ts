import { defineConfig, devices } from '@playwright/test'
import { assertDisposableDatabase } from './scripts/lib/disposable-database'

// The global setup truncates every table and the admin specs write through
// the app, so the whole run must target a disposable database.
assertDisposableDatabase(process.env.AUTH_DRIZZLE_URL, 'Playwright e2e')

const port = Number(process.env.PORT ?? 3100)
// localhost, not 127.0.0.1: WebAuthn rejects IP addresses as a relying-party
// ID, so the passkey e2e can only run on a hostname.
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${port.toString()}`

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/setup/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
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
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `pnpm exec next dev --port ${port.toString()}`,
        url: baseURL,
        env: {
          ...process.env,
          BETTER_AUTH_URL: baseURL,
        },
        reuseExistingServer: false,
        timeout: 120 * 1000,
      },
})
