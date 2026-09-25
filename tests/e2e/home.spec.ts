import { expect, test, type Page } from '@playwright/test'

/** Screens where the programs stack is active, including the room a real
    1366×768 laptop leaves below the browser chrome (1366×657). */
const STACK_VIEWPORTS = [
  { width: 1366, height: 768 },
  { width: 1366, height: 657 },
  { width: 1440, height: 789 },
  { width: 1024, height: 700 },
  { width: 768, height: 1024 },
]

/** Two frames, so scroll-linked styles have caught up. */
async function settle(page: Page) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  )
}

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

  for (const [lang, viewport] of [
    ...STACK_VIEWPORTS.map((size) => ['en', size] as const),
    ['ko', { width: 1366, height: 657 }] as const,
  ]) {
    test(`every program card joins the stack at ${viewport.width}×${viewport.height} (${lang})`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto(`/${lang}`, { waitUntil: 'load' })
      const cards = page.locator('.program-card')

      expect(
        await cards.evaluateAll((all) =>
          all.map((card) => getComputedStyle(card).position)
        )
      ).toEqual(Array(6).fill('sticky'))

      // Scroll to where the last card reaches its slot. Repeat, so sections
      // that render late (content-visibility) cannot leave the target stale.
      await cards.last().scrollIntoViewIfNeeded()
      for (let pass = 0; pass < 3; pass += 1) {
        await page.evaluate(() => {
          const last = document.querySelector('.program-card:last-child')!
          const slot = parseFloat(getComputedStyle(last).top)
          window.scrollBy({
            top: last.getBoundingClientRect().top - slot,
            behavior: 'instant',
          })
        })
        await settle(page)
      }

      // Every card, Solution Challenge included, is still held in its own
      // slot (within a pixel; larger offsets are reported as they are).
      expect(
        await cards.evaluateAll((all) =>
          all.map((card) => {
            const offset =
              card.getBoundingClientRect().top -
              parseFloat(getComputedStyle(card).top)
            return Math.abs(offset) <= 1 ? 0 : Math.round(offset)
          })
        )
      ).toEqual(Array(6).fill(0))
    })
  }

  for (const viewport of [
    ...STACK_VIEWPORTS,
    { width: 844, height: 390 },
  ]) {
    test(`every program card can be read in full at ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto('/en', { waitUntil: 'load' })
      const stackEdges = () =>
        page.evaluate(() => {
          const box = document
            .querySelector('.program-stack')!
            .getBoundingClientRect()
          return [box.top + scrollY, box.bottom + scrollY] as const
        })
      const [top] = await stackEdges()

      // Walk the stack: a sticky card must never keep part of itself below
      // the fold or under the next card for the whole way through. The end
      // is re-read each step: sections above may render late and move it.
      const leastHidden = new Map<string, number>()
      for (let y = top - viewport.height; y < (await stackEdges())[1]; y += 40) {
        await page.evaluate((scroll) => scrollTo(0, scroll), y)
        const hidden = await page.evaluate(() => {
          const cards = [...document.querySelectorAll('.program-card')]
          return cards.map((card, index) => {
            const box = card.getBoundingClientRect()
            const coveredAt = cards
              .slice(index + 1)
              .map((next) => next.getBoundingClientRect().top)
              .filter((nextTop) => nextTop > box.top)
              .reduce((min, nextTop) => Math.min(min, nextTop), Infinity)
            const shownTo = Math.min(box.bottom, innerHeight, coveredAt)
            return [
              card.querySelector('h3')!.textContent!,
              Math.max(0, box.bottom - Math.max(shownTo, box.top)),
            ] as const
          })
        })
        for (const [name, px] of hidden) {
          leastHidden.set(name, Math.min(leastHidden.get(name) ?? Infinity, px))
        }
      }

      expect(Object.fromEntries(leastHidden)).toEqual(
        Object.fromEntries([...leastHidden.keys()].map((name) => [name, 0]))
      )
    })
  }
})
