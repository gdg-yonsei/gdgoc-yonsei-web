import { expect, test } from '@playwright/test'

/*
 * Layout regressions a unit test cannot see: both depend on real font
 * metrics and viewport-relative type sizes.
 */

test('hero title stays on one line while hovered on wide screens', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/en', { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)

  const title = page.getByRole('heading', { level: 1, name: /GDGoC Yonsei/ })
  const tagline = page.locator('.hero-tagline')
  // Let the entrance animation finish before taking the resting measurements.
  await title.evaluate((element) =>
    Promise.all(element.getAnimations().map((animation) => animation.finished))
  )

  const measure = async () => ({
    titleHeight: (await title.boundingBox())?.height,
    taglineTop: (await tagline.boundingBox())?.y,
  })
  const resting = await measure()

  await title.hover()
  // The hover morph has finished once roundness reaches its hover value.
  await expect
    .poll(() =>
      title.evaluate(
        (element) => getComputedStyle(element).fontVariationSettings
      )
    )
    .toBe('"ROND" 0')

  expect(await measure()).toEqual(resting)
})

test('decorative hover morphs stay still under reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/en', { waitUntil: 'load' })

  // Hover, jump any running transition to its end, then read the result.
  const settledHoverStyle = async (selector: string) => {
    const element = page.locator(selector)
    await element.hover()
    return element.evaluate((node) => {
      node.getAnimations().forEach((animation) => animation.finish())
      return {
        hovered: node.matches(':hover'),
        roundness: getComputedStyle(node).fontVariationSettings,
      }
    })
  }

  expect(await settledHoverStyle('.hero-title')).toEqual({
    hovered: true,
    roundness: '"ROND" 100',
  })
  expect(await settledHoverStyle('.site-footer-wordmark')).toEqual({
    hovered: true,
    roundness: '"ROND" 0',
  })
})

test('root 404 page fits a 320px screen without sideways scrolling', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 })
  const response = await page.goto('/en/this-route-does-not-exist', {
    waitUntil: 'load',
  })

  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('404')
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    )
  ).toBe(0)
})
