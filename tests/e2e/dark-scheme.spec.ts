import { expect, test } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'

test.describe('dark scheme', () => {
  test.use({ colorScheme: 'dark' })

  test('public pages switch to dark paper and light text', async ({ page }) => {
    const seeded = await readSeededData()
    for (const path of [
      '/en',
      '/en/session',
      '/en/project',
      '/en/member',
      `/en/member/${seeded.generationName}`,
      '/en/calendar',
      '/en/privacy-policy',
    ]) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(
        await page.evaluate(() => [
          getComputedStyle(document.body).backgroundColor,
          getComputedStyle(document.body).color,
        ]),
        path
      ).toEqual(['rgb(22, 22, 22)', 'rgb(240, 240, 240)'])
    }
  })
})
