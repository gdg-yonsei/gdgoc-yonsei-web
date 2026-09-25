import { expect, test } from '@playwright/test'

/** Site-wide chrome motion: CSS and View Transitions only, on every page. */
test.describe('chrome motion', () => {
  test('wraps a hovered nav link in code brackets', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en/session', { waitUntil: 'load' })
    const link = page
      .getByRole('navigation', { name: /primary/i })
      .getByRole('link', {
        name: 'Projects',
      })
    const brackets = () =>
      link.evaluate((element) =>
        (['::before', '::after'] as const).map((pseudo) => {
          const style = getComputedStyle(element, pseudo)
          return [style.content, style.opacity]
        })
      )

    expect((await brackets()).map(([, opacity]) => opacity)).toEqual(['0', '0'])
    await link.hover()
    await expect.poll(brackets).toEqual([
      ['"<"', '1'],
      ['">"', '1'],
    ])
  })

  test('traces reading progress along the header capsule', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en/session', { waitUntil: 'load' })
    const progress = () =>
      page
        .locator('.site-header-bar')
        .evaluate(
          (bar) =>
            new DOMMatrixReadOnly(getComputedStyle(bar, '::after').transform).a
        )

    await expect.poll(progress).toBeLessThan(0.02)
    await page.evaluate(() =>
      scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2)
    )
    await expect.poll(progress).toBeGreaterThan(0.4)
    await expect.poll(progress).toBeLessThan(0.6)
  })

  test('sweeps the GDG colours through the footer wordmark on hover', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en/calendar', { waitUntil: 'load' })
    const wordmark = page.locator('.site-footer-wordmark')
    await wordmark.scrollIntoViewIfNeeded()
    const position = () =>
      wordmark.evaluate(
        (element) => getComputedStyle(element).backgroundPositionX
      )

    expect(await position()).toBe('100%')
    await wordmark.hover()
    // The band has swept across once the background reaches its far end.
    await expect
      .poll(async () => parseFloat(await position()), { timeout: 3_000 })
      .toBe(0)
  })

  test('lets the mobile menu leave instead of vanishing', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/en/session', { waitUntil: 'load' })
    await page.getByRole('button', { name: 'Open navigation menu' }).click()
    const menu = page.locator('#mobile-primary-navigation')
    await expect(menu).toBeVisible()
    await page.waitForTimeout(600)

    await page.getByRole('button', { name: 'Close navigation menu' }).click()
    // Still on its way out a moment after closing, gone once it has left.
    expect(
      await menu.evaluate((dialog) => getComputedStyle(dialog).display)
    ).not.toBe('none')
    await expect(menu).toBeHidden({ timeout: 2_000 })
  })
})
