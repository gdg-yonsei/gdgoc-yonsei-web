import { expect, test } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'

function extractSitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) =>
    match[1]!.replaceAll('&amp;', '&').trim()
  )
}

function extractSitemapPaths(urls: string[]): string[] {
  const paths = urls.map((url) => {
    const parsedUrl = new URL(url)
    return `${parsedUrl.pathname}${parsedUrl.search}`
  })

  return [...new Set(paths)]
}

function assertHealthyResponse(path: string, responseStatus: number) {
  expect(
    responseStatus,
    `${path} returned an unexpected status: ${responseStatus.toString()}`
  ).toBe(200)
}

function getExpectedAlternates(path: string, sitemapOrigin: string) {
  const parsed = new URL(path, sitemapOrigin)
  const suffix = parsed.pathname.replace(/^\/(en|ko)(?=\/|$)/, '')

  return {
    en: `${sitemapOrigin}/en${suffix}`,
    ko: `${sitemapOrigin}/ko${suffix}`,
    'x-default': `${sitemapOrigin}/en${suffix}`,
  }
}

test('root path redirects to a localized home page', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' })

  expect(response).not.toBeNull()
  await expect(page).toHaveURL(/\/(en|ko)\/?$/)
  await expect(page.locator('body')).toBeVisible()
})

test('all sitemap URLs return successful responses', async ({
  page,
  request,
}) => {
  test.setTimeout(8 * 60 * 1000)

  const sitemapResponse = await request.get('/sitemap.xml')
  expect(sitemapResponse.ok()).toBeTruthy()

  const sitemapXml = await sitemapResponse.text()
  const sitemapUrls = extractSitemapUrls(sitemapXml)
  const paths = extractSitemapPaths(sitemapUrls)
  const sitemapOrigin = new URL(sitemapUrls[0]!).origin

  expect(paths.length).toBeGreaterThan(0)
  expect(paths.length % 2).toBe(0)
  expect(paths.filter((path) => path.startsWith('/en')).length).toBe(
    paths.length / 2
  )
  expect(paths.filter((path) => path.startsWith('/ko')).length).toBe(
    paths.length / 2
  )

  for (const requiredPath of [
    '/en/privacy-policy',
    '/ko/privacy-policy',
    '/en/terms-of-service',
    '/ko/terms-of-service',
    '/en/member',
    '/ko/member',
    '/en/project',
    '/ko/project',
    '/en/session',
    '/ko/session',
    '/en/2026-freshman-ot',
    '/ko/2026-freshman-ot',
  ]) {
    expect(paths).toContain(requiredPath)
  }

  for (const path of paths) {
    const pairedPath = path.startsWith('/en')
      ? path.replace(/^\/en/, '/ko')
      : path.replace(/^\/ko/, '/en')
    expect(paths).toContain(pairedPath)
  }

  expect(sitemapXml).toContain('hreflang="en"')
  expect(sitemapXml).toContain('hreflang="ko"')
  expect(sitemapXml).toContain('hreflang="x-default"')
  expect(sitemapXml).not.toContain('<changefreq>')
  expect(sitemapXml).not.toContain('<priority>')

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
        expect(new URL(page.url()).pathname).toBe(path)
        await expect(page.locator('body')).toBeVisible()

        const canonical = await page
          .locator('link[rel="canonical"]')
          .getAttribute('href')
        expect(canonical).toBe(new URL(path, sitemapOrigin).href)

        const expectedAlternates = getExpectedAlternates(path, sitemapOrigin)
        for (const [hrefLang, expectedHref] of Object.entries(
          expectedAlternates
        )) {
          await expect(
            page.locator(`link[rel="alternate"][hreflang="${hrefLang}"]`)
          ).toHaveAttribute('href', expectedHref)
        }

        await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute(
          'content',
          /noindex/i
        )
      } catch (error) {
        failures.push(
          `${path}\n${error instanceof Error ? error.message : String(error)}`
        )
      }
    })
  }

  expect(
    failures,
    `Sitemap smoke test failures:\n\n${failures.join('\n\n')}`
  ).toEqual([])
})

test('invalid duplicate routes are 404 and private routes are noindex', async ({
  page,
  request,
}) => {
  const seededData = await readSeededData()
  const invalidRoutes = [
    '/en/member/not-a-generation',
    '/en/project/not-a-generation',
    '/en/session/not-a-generation',
    `/en/project/not-a-generation/${seededData.projectId}`,
    `/en/session/not-a-generation/${seededData.sessionId}`,
    '/foo.bar',
    '/foo.bar/privacy-policy',
  ]

  for (const route of invalidRoutes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
    const status = response?.status()

    // With Cache Components, a dynamic notFound() can be streamed after the
    // response shell starts. Next.js then returns 200 and injects noindex.
    expect([200, 404], route).toContain(status)
    if (status === 200) {
      await expect(
        page.locator('meta[name="robots"]').first(),
        route
      ).toHaveAttribute('content', /noindex/i)
    }
  }

  for (const route of ['/admin', '/en/admin', '/ko/admin', '/auth/sign-in']) {
    const response = await request.get(route)
    expect(response.status(), route).toBeLessThan(500)

    const headerValue = response.headers()['x-robots-tag'] || ''
    const html = await response.text()
    expect(`${headerValue} ${html}`, route).toMatch(/noindex/i)
  }

  for (const asset of [
    '/opengraph-image.png',
    '/twitter-image.png',
    '/favicon.ico',
    '/manifest.webmanifest',
    '/googleda69d559d3e8d484.html',
    '/naver3b021b84fe69d06591a1108d6f26afac.html',
    '/llms.txt',
  ]) {
    const response = await request.get(asset, { maxRedirects: 0 })
    expect(response.status(), asset).toBe(200)
  }
})
