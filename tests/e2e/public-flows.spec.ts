import { expect, test, devices } from '@playwright/test'

const extraPublicRoutes = [
  '/en/privacy-policy',
  '/ko/privacy-policy',
  '/en/terms-of-service',
  '/ko/terms-of-service',
  '/en/recruit',
  '/ko/recruit',
  '/en/2026-freshman-ot',
  '/ko/2026-freshman-ot',
]

test('extra public pages load correctly', async ({ page }) => {
  const failures: string[] = []

  for (const route of extraPublicRoutes) {
    await test.step(`check ${route}`, async () => {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })

      try {
        expect(response).not.toBeNull()
        expect(
          response?.status() ?? 0,
          `${route} returned an unexpected status`,
        ).toBeLessThan(400)
        await expect(page.locator('body')).toBeVisible()
      } catch (error) {
        failures.push(
          `${route}\n${error instanceof Error ? error.message : String(error)}`,
        )
      }
    })
  }

  expect(
    failures,
    `Public route smoke test failures:\n\n${failures.join('\n\n')}`,
  ).toEqual([])
})

test('desktop navigation routes user to calendar page', async ({ page }) => {
  await page.goto('/en', { waitUntil: 'domcontentloaded' })
  await page.getByRole('link', { name: /^Calendar$/ }).first().click()

  await expect(page).toHaveURL(/\/en\/calendar$/)
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
})

test('freshman orientation banner navigates to OT page', async ({ page }) => {
  await page.goto('/en', { waitUntil: 'domcontentloaded' })
  await page
    .getByRole('link', { name: /2026 Freshman Orientation/i })
    .first()
    .click()

  await expect(page).toHaveURL(/\/en\/2026-freshman-ot$/)
  await expect(page.getByText('Google Developer Group').first()).toBeVisible()
})

test.describe('mobile navigation', () => {
  const iPhone13 = devices['iPhone 13']

  test.use({
    viewport: iPhone13.viewport,
    userAgent: iPhone13.userAgent,
    deviceScaleFactor: iPhone13.deviceScaleFactor,
    isMobile: iPhone13.isMobile,
    hasTouch: iPhone13.hasTouch,
  })

  test('menu button opens navigation and routes to calendar', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })

    const menuOpenButton = page.getByRole('button', {
      name: 'Open navigation menu',
    })
    await expect(menuOpenButton).toBeVisible()
    await menuOpenButton.click()

    await page.getByRole('link', { name: /^Calendar$/ }).click()
    await expect(page).toHaveURL(/\/en\/calendar$/)
  })
})
