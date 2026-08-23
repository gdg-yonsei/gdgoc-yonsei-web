import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PORT ?? 3100)
const baseURL = `http://127.0.0.1:${port.toString()}`

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
    {
      name: 'production-chromium',
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
