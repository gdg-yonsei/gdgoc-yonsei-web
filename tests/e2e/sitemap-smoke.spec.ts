import { expect, test } from '@playwright/test'

function extractSitemapPaths(xml: string): string[] {
  const paths = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
    .map((match) => match[1]!.replaceAll('&amp;', '&').trim())
    .map((url) => {
      const parsedUrl = new URL(url)
      return `${parsedUrl.pathname}${parsedUrl.search}`
    })

  return [...new Set(paths)]
}

function assertHealthyResponse(path: string, responseStatus: number) {
  expect(
    responseStatus,
    `${path} returned an unexpected status: ${responseStatus.toString()}`,
  ).toBeLessThan(400)
}

test('root path redirects to a localized home page', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' })

  expect(response).not.toBeNull()
  await expect(page).toHaveURL(/\/(en|ko)\/?$/)
  await expect(page.locator('body')).toBeVisible()
})

test('all sitemap URLs return successful responses', async ({ page, request }) => {
  test.setTimeout(5 * 60 * 1000)

  const sitemapResponse = await request.get('/sitemap.xml')
  expect(sitemapResponse.ok()).toBeTruthy()

  const sitemapXml = await sitemapResponse.text()
  const paths = extractSitemapPaths(sitemapXml)

  expect(paths.length).toBeGreaterThan(0)

  const failures: string[] = []

  for (const path of paths) {
    await test.step(`check ${path}`, async () => {
      try {
        const response = await page.goto(path, {
          waitUntil: 'domcontentloaded',
          timeout: 15 * 1000,
        })
        expect(response).not.toBeNull()
        assertHealthyResponse(path, response?.status() ?? 0)
        await expect(page.locator('body')).toBeVisible()
      } catch (error) {
        failures.push(
          `${path}\n${error instanceof Error ? error.message : String(error)}`,
        )
      }
    })
  }

  expect(
    failures,
    `Sitemap smoke test failures:\n\n${failures.join('\n\n')}`,
  ).toEqual([])
})
