import { expect, test } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'

test.describe('members', () => {
  test('the hub lists generations and opens one', async ({ page }) => {
    const seeded = await readSeededData()
    await page.goto('/en/member', { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { level: 1, name: 'Members', exact: true })
    ).toBeVisible()
    await page.locator(`a[href="/en/member/${seeded.generationName}"]`).click()
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: `${seeded.generationName} Members`,
      })
    ).toBeVisible()
    await expect(
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .getByRole('link', { name: 'Members' })
    ).toHaveAttribute('href', '/en/member')
  })

  test('generation pages group members by part', async ({ page }) => {
    const seeded = await readSeededData()
    await page.goto(`/en/member/${seeded.generationName}`, {
      waitUntil: 'domcontentloaded',
    })

    await expect(page.getByRole('region', { name: 'E2E Part' })).toBeVisible()
  })

  test('fits a 320px screen without sideways scrolling', async ({ page }) => {
    const seeded = await readSeededData()
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(`/ko/member/${seeded.generationName}`, {
      waitUntil: 'load',
    })
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
