import { expect, test } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'

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

test('long-form prose takes its colours from the site scheme', async ({
  page,
}) => {
  // Tailwind's typography plugin sets its own palette; the scheme tokens
  // (--s-fg-muted body, --s-fg headings) must win on every prose surface.
  const seeded = await readSeededData()
  for (const path of [
    '/en/privacy-policy',
    `/en/session/${seeded.generationName}/${seeded.sessionId}`,
  ]) {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    const prose = page.locator('.site-prose').first()
    await expect(prose).toBeVisible()
    expect(
      await prose.evaluate((element) => {
        // Resolve the variables to colours (the build minifies hex values).
        const probe = document.createElement('span')
        element.append(probe)
        const resolve = (name: string) => {
          probe.style.color = `var(${name})`
          return getComputedStyle(probe).color
        }
        const colours = [
          resolve('--tw-prose-body'),
          resolve('--tw-prose-headings'),
        ]
        probe.remove()
        return colours
      }),
      path
    ).toEqual(['rgb(85, 85, 85)', 'rgb(30, 30, 30)'])
  }
})

test('overscroll shows the stage while pages stay on paper', async ({
  page,
}) => {
  await page.goto('/en/session', { waitUntil: 'domcontentloaded' })

  expect(
    await page.evaluate(() => [
      getComputedStyle(document.documentElement).backgroundColor,
      getComputedStyle(document.body).backgroundColor,
    ])
  ).toEqual(['rgb(30, 30, 30)', 'rgb(240, 240, 240)'])
})

test('the footer wordmark fits a 320px screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto('/en', { waitUntil: 'load' })
  const wordmark = page.locator('.site-footer-wordmark')

  expect(
    await wordmark.evaluate(
      (element) => element.scrollWidth <= element.clientWidth
    )
  ).toBe(true)
})

test('public pages leave admin-only boundaries out of their scripts', async ({
  page,
}) => {
  // Only admin pages can be forbidden; a root forbidden.tsx put the admin
  // sign-out button's client code on every public page.
  const bodies: Promise<string>[] = []
  page.on('response', (response) => {
    if (response.request().resourceType() === 'script') {
      bodies.push(response.text().catch(() => ''))
    }
  })
  await page.goto('/en', { waitUntil: 'networkidle' })
  const scripts = await Promise.all(bodies)

  expect(scripts.length).toBeGreaterThan(0)
  for (const script of scripts) expect(script).not.toContain('Sign Out')
})
