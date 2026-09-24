import { expect, test } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'

test.describe('session log hub', () => {
  test('lists public sessions by generation and filters them in place', async ({
    page,
  }) => {
    const seeded = await readSeededData()
    await page.goto('/en/session', { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { level: 1, name: 'Session Log' })
    ).toBeVisible()
    const row = page
      .getByRole('region', { name: new RegExp(seeded.generationName) })
      .getByRole('heading', { name: 'E2E Session', exact: true })
    await expect(row).toBeVisible()

    const filters = page.getByRole('search', { name: 'Filters' })
    await filters.getByText('Tech Talk', { exact: true }).click()
    await expect(page).toHaveURL(/\/en\/session\?category=tech_talk$/)
    await expect(row).toBeVisible()

    await filters
      .getByRole('searchbox', { name: 'Search sessions' })
      .fill('no-such-session')
    await expect(
      page.getByText('No sessions match these filters.')
    ).toBeVisible()
    await expect(row).toBeHidden()

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('searchbox', { name: 'Search sessions' })
    ).toHaveValue('no-such-session')
    await expect(
      page.getByRole('heading', { name: 'E2E Session', exact: true })
    ).toBeHidden()

    await page.getByRole('button', { name: 'Reset filters' }).click()
    await expect(page).toHaveURL(/\/en\/session$/)
    await expect(
      page.getByRole('heading', { name: 'E2E Session', exact: true })
    ).toBeVisible()
  })

  test('fits a 320px screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/en/session', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBe(0)
  })
})
