import { expect, test } from '@playwright/test'

test.describe('home page', () => {
  test('tells the story from the hero to the join bookend', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    for (const name of [
      'What is GDGoC Yonsei?',
      'Programs',
      'Six parts',
      'Latest sessions',
      'Latest projects',
      'Build with us',
    ]) {
      await expect(
        page.getByRole('heading', { level: 2, name, exact: true })
      ).toBeVisible()
    }
    await expect(
      page.getByRole('figure', { name: 'Solution Challenge 2023' })
    ).toBeVisible()
  })

  test('links the latest sessions and projects', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    // Other specs add sessions and projects, so count rather than name them.
    const sessions = page
      .getByRole('region', { name: 'Latest sessions' })
      .locator('a[href^="/en/session/"]')
    const projects = page
      .getByRole('region', { name: 'Latest projects' })
      .locator('li.release-item')

    await expect(sessions.first()).toHaveAttribute(
      'href',
      /^\/en\/session\/[^/]+\/[0-9a-f-]{36}$/
    )
    expect(await sessions.count()).toBeLessThanOrEqual(6)
    await expect(projects.first()).toBeVisible()
    expect(await projects.count()).toBeLessThanOrEqual(3)
  })

  test('part links open the Session Log filtered by that part', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Cloud sessions' }).click()

    await expect(page).toHaveURL(/\/en\/session\?part=Cloud$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Session Log' })
    ).toBeVisible()
  })

  test('fits a 320px screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/ko', { waitUntil: 'load' })
    // Scroll through, so scroll-driven states (joining brackets) settle.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y)
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
    })

    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBe(0)
  })

  test('shows every section statically under reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/en', { waitUntil: 'load' })

    expect(
      await page
        .locator('.program-card')
        .first()
        .evaluate((card) => getComputedStyle(card).position)
    ).toBe('static')
    expect(
      await page
        .locator('.manifesto-word')
        .first()
        .evaluate((word) => getComputedStyle(word).animationName)
    ).toBe('none')
  })

  test('defers rendering of the sections below the first screen', async ({
    page,
  }) => {
    await page.goto('/ko', { waitUntil: 'load' })

    // Long Korean pages re-lay out on every Pretendard subset swap; sections
    // off screen skip that work until they near the viewport.
    expect(
      await page
        .locator('.home-section')
        .evaluateAll((sections) =>
          sections.map((section) => getComputedStyle(section).contentVisibility)
        )
    ).toEqual(Array(5).fill('auto'))
  })
})
