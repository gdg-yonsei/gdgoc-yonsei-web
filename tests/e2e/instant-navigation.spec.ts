import { expect, test } from '@playwright/test'
import { instant } from '@next/playwright'
import { readSeededData } from './helpers/read-seeded-data'

test.describe('public event prerendering', () => {
  test.describe.configure({ timeout: 90_000 })

  test('serves a known session in the initial static UI', async ({
    page,
    baseURL,
  }) => {
    const seededData = await readSeededData()
    const destination = `/en/session/${seededData.generationName}/${seededData.sessionId}`

    await instant(
      page,
      async () => {
        await page.goto(destination)
        await expect(
          page.getByRole('heading', { name: /E2E Session/i }).first()
        ).toBeVisible()
      },
      { baseURL }
    )
  })

  test('prefetches a session before client navigation', async ({ page }) => {
    const seededData = await readSeededData()
    const listPath = `/en/session/${seededData.generationName}`
    const destination = `${listPath}/${seededData.sessionId}`

    await page.goto(listPath)
    const eventLink = page.locator(`a[href="${destination}"]`)
    await expect(eventLink).toBeVisible()

    await instant(page, async () => {
      await eventLink.click()
      await page.waitForURL((url) => url.pathname === destination)
      await expect(
        page.getByRole('heading', { name: /E2E Session/i }).first()
      ).toBeVisible()
    })
  })
})
