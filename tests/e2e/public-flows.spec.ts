import { expect, test, devices } from '@playwright/test'

const extraPublicRoutes = [
  '/en/privacy-policy',
  '/ko/privacy-policy',
  '/en/terms-of-service',
  '/ko/terms-of-service',
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
          `${route} returned an unexpected status`
        ).toBeLessThan(400)
        await expect(page.locator('body')).toBeVisible()
      } catch (error) {
        failures.push(
          `${route}\n${error instanceof Error ? error.message : String(error)}`
        )
      }
    })
  }

  expect(
    failures,
    `Public route smoke test failures:\n\n${failures.join('\n\n')}`
  ).toEqual([])
})

test('desktop navigation routes user to calendar page', async ({ page }) => {
  await page.goto('/en', { waitUntil: 'domcontentloaded' })
  await page
    .getByRole('link', { name: /^Calendar$/ })
    .first()
    .click()

  await expect(page).toHaveURL(/\/en\/calendar$/)
  await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible()
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
    // The menu button only works once React mounts; a tap before the scripts run is lost.
    await page.goto('/en', { waitUntil: 'load' })

    const menuOpenButton = page.getByRole('button', {
      name: 'Open navigation menu',
    })
    await expect(menuOpenButton).toBeVisible()
    await menuOpenButton.click()

    await expect(
      page.getByRole('button', { name: 'Close navigation menu' })
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(menuOpenButton).toBeVisible()

    await menuOpenButton.click()

    await page
      .getByRole('dialog', { name: 'Menu' })
      .getByRole('link', { name: /^Calendar/ })
      .click()
    await expect(page).toHaveURL(/\/en\/calendar$/)
  })

  test('a tap before the scripts run still opens the menu', async ({
    page,
  }) => {
    let releaseScripts!: () => void
    const scriptsHeld = new Promise<void>((resolve) => {
      releaseScripts = resolve
    })
    await page.route('**/_next/static/chunks/**', async (route) => {
      await scriptsHeld
      await route.continue()
    })
    await page.goto('/en', { waitUntil: 'commit' })
    const trigger = page.getByRole('button', { name: 'Open navigation menu' })

    await trigger.click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()

    releaseScripts()
    await page.waitForLoadState('load')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await page.getByRole('button', { name: 'Close navigation menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('Escape closes the menu and returns focus to its button', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'load' })
    const trigger = page.getByRole('button', { name: 'Open navigation menu' })

    await trigger.click()
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
    await page.keyboard.press('Escape')

    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
