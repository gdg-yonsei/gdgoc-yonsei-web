import { defineConfig, devices } from '@playwright/test'
import { assertDisposableDatabase } from './scripts/lib/disposable-database'

// Global setup truncates tables and admin tests write through the app, so the entire run needs a disposable DB.
assertDisposableDatabase(process.env.AUTH_DRIZZLE_URL, 'Playwright e2e')

const port = Number(process.env.PORT ?? 3100)
// WebAuthn rejects IP relying-party IDs, so passkey e2e uses the localhost hostname.
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
    // Instant checks run before admin edits: the test API prevents Next from rebuilding invalidated prerender shells.
    // Production rebuilds on the next request, so edits would give these checks an unrepresentative degraded shell.
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
      // 빌드 워커들이 동시에 OAuth 리소스를 시드하다 충돌하지 않도록 먼저 한 번 초기화한다.
      'pnpm auth:prepare',
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
