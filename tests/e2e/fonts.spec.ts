import { expect, test, type Page } from '@playwright/test'

/* Hangul renders in Pretendard, loaded as unicode-range subsets on demand.
   Pages whose only Korean text is visually hidden must not pay for them. */

async function pretendardRequests(page: Page, route: string) {
  const requested: string[] = []
  page.on('request', (request) => {
    const { pathname } = new URL(request.url())
    if (pathname.startsWith('/fonts/pretendard/')) requested.push(pathname)
  })
  await page.goto(route, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  return requested
}

test('Korean pages set Hangul in Pretendard', async ({ page }) => {
  const requested = await pretendardRequests(page, '/ko')

  expect(requested.length).toBeGreaterThan(0)
  expect(
    await page.evaluate(() =>
      [...document.fonts].some(
        (face) =>
          face.family.replace(/["']/g, '') === 'Pretendard Variable' &&
          face.status === 'loaded'
      )
    )
  ).toBe(true)
})

test('English pages download no Korean font', async ({ page }) => {
  expect(await pretendardRequests(page, '/en')).toEqual([])
})
