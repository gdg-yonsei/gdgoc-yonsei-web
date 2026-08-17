import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import sharp from 'sharp'
import { readSeededData } from './helpers/read-seeded-data'

async function expectOptimizedSocialImage(
  request: APIRequestContext,
  url: string
) {
  const response = await request.get(url)
  expect(response.ok()).toBe(true)
  expect(response.headers()['content-type']).toMatch(/^image\/jpeg\b/i)

  const image = await response.body()
  expect(image.byteLength).toBeGreaterThan(5_000)
  expect(image.byteLength).toBeLessThanOrEqual(750 * 1_024)

  const metadata = await sharp(image).metadata()
  expect(metadata).toMatchObject({
    format: 'jpeg',
    width: 1_200,
    height: 630,
  })
}

async function getSocialImageMetadata(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' })

  const ogImage = await page
    .locator('meta[property="og:image"]')
    .first()
    .getAttribute('content')
  const twitterImage = await page
    .locator('meta[name="twitter:image"]')
    .first()
    .getAttribute('content')
  const ogAlt = await page
    .locator('meta[property="og:image:alt"]')
    .first()
    .getAttribute('content')

  expect(ogImage).toBeTruthy()
  expect(twitterImage).toBeTruthy()

  return {
    ogAlt,
    ogImage: ogImage!,
    twitterImage: twitterImage!,
  }
}

test.describe('event-specific social images', () => {
  test.describe.configure({ timeout: 120_000 })

  test('serves optimized OG and Twitter images for a session', async ({
    page,
    request,
  }) => {
    const seededData = await readSeededData()
    const metadata = await getSocialImageMetadata(
      page,
      `/en/session/${seededData.generationName}/${seededData.sessionId}`
    )

    expect(metadata.ogAlt).toContain('E2E Session')
    await expectOptimizedSocialImage(request, metadata.ogImage)
    await expectOptimizedSocialImage(request, metadata.twitterImage)
  })

  test('serves optimized OG and Twitter images for a project', async ({
    page,
    request,
  }) => {
    const seededData = await readSeededData()
    const metadata = await getSocialImageMetadata(
      page,
      `/en/project/${seededData.generationName}/${seededData.projectId}`
    )

    expect(metadata.ogAlt).toContain('E2E Project')
    await expectOptimizedSocialImage(request, metadata.ogImage)
    await expectOptimizedSocialImage(request, metadata.twitterImage)
  })
})
