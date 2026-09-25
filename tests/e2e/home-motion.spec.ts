import { expect, test, type Page } from '@playwright/test'

/** anime.js's scroll observer ships this class name; no other code has it. */
const ANIME_SIGNATURE = 'animejs-onscroll-debug'

async function scriptsContaining(page: Page, needle: string) {
  const urls = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => /\.js(\?|$)/.test(url))
  )
  const hits: string[] = []
  for (const url of urls) {
    if ((await (await page.request.get(url)).text()).includes(needle)) {
      hits.push(url)
    }
  }
  return hits
}

async function motionReady(page: Page) {
  await expect(page.locator('html')).toHaveAttribute(
    'data-home-motion',
    'ready',
    { timeout: 10_000 }
  )
}

test.describe('home motion', () => {
  test('marks every landing section with its scene', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })

    expect(
      await page
        .locator('[data-scene]')
        .evaluateAll((sections) =>
          sections.map((section) => section.getAttribute('data-scene'))
        )
    ).toEqual([
      'hero',
      'manifesto',
      'programs',
      'parts',
      'log',
      'releases',
      'join',
    ])
  })

  test('brings the landing to life once the browser is idle', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'load' })

    await expect(page.locator('html')).toHaveAttribute(
      'data-home-motion',
      'ready',
      { timeout: 10_000 }
    )
  })

  test('downloads anime.js only for visitors who want motion', async ({
    page,
  }) => {
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    expect(
      (await scriptsContaining(page, ANIME_SIGNATURE)).length
    ).toBeGreaterThan(0)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/ko', { waitUntil: 'load' })
    await page.waitForTimeout(3_000)
    expect(await scriptsContaining(page, ANIME_SIGNATURE)).toEqual([])
  })

  test('opens the hero title with the brackets as the stage scrolls away', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    const shifts = () =>
      page
        .locator('.hero-word')
        .evaluateAll((words) =>
          words.map(
            (word) =>
              new DOMMatrixReadOnly(getComputedStyle(word).transform).m41
          )
        )

    expect(await shifts()).toEqual([0, 0])
    await page.evaluate(() => scrollTo(0, innerHeight * 0.5))
    await expect
      .poll(async () => {
        const [left = 0, right = 0] = await shifts()
        return left < -20 && right > 20
      })
      .toBe(true)

    await page.evaluate(() => scrollTo(0, 0))
    await expect
      .poll(async () => (await shifts()).every((x) => Math.abs(x) < 1))
      .toBe(true)
  })

  test('draws the hero calls to action toward a nearby pointer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    const cta = page.locator('.hero-actions > a').first()
    const box = (await cta.boundingBox())!
    const pull = () =>
      cta.evaluate((link) => parseFloat(getComputedStyle(link).translate) || 0)

    await page.mouse.move(box.x + box.width + 16, box.y + box.height / 2, {
      steps: 4,
    })
    await expect.poll(pull).toBeGreaterThan(1)

    await page.mouse.move(8, 700, { steps: 4 })
    await expect.poll(pull).toBeLessThan(0.5)
  })

  test('walks a bracket band through the manifesto as its words light up', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    const lit = page.locator('.manifesto-word[data-lit]')
    const crossTo = (share: number) =>
      page.evaluate((fraction) => {
        const statement = document.querySelector('.manifesto-statement')!
        const box = statement.getBoundingClientRect()
        scrollBy(0, box.top - innerHeight * fraction)
      }, share)

    await crossTo(0.6)
    await expect.poll(() => lit.count()).toBeGreaterThan(0)
    await expect(page.locator('.manifesto-cursor')).toHaveCount(1)
    // The band settles behind the word lit last.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const band = document
            .querySelector('.manifesto-cursor')!
            .getBoundingClientRect()
          const word = [
            ...document.querySelectorAll('.manifesto-word[data-lit]'),
          ]
            .at(-1)!
            .getBoundingClientRect()
          const x = (band.left + band.right) / 2
          const y = (band.top + band.bottom) / 2
          return (
            x > word.left && x < word.right && y > word.top && y < word.bottom
          )
        })
      )
      .toBe(true)
    const litEarlier = await lit.count()

    await page.evaluate(() => scrollBy(0, 240))
    await expect.poll(() => lit.count()).toBeGreaterThan(litEarlier)
  })

  test('puts the manifesto band away when the page scrolls back above it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    const lit = page.locator('.manifesto-word[data-lit]')
    const crossTo = (share: number) =>
      page.evaluate((fraction) => {
        const statement = document.querySelector('.manifesto-statement')!
        scrollBy(
          0,
          statement.getBoundingClientRect().top - innerHeight * fraction
        )
      }, share)

    await crossTo(0.4)
    await expect.poll(() => lit.count()).toBeGreaterThan(2)

    // In one jump, back to where the statement sits low on the screen,
    // before its crossing starts.
    await crossTo(0.95)
    await expect.poll(() => lit.count()).toBe(0)
    await expect(page.locator('.manifesto-statement')).toHaveAttribute(
      'data-cursor',
      'off'
    )
  })

  test('lets each stacked program card recede under the next', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    await page.locator('.program-card').last().scrollIntoViewIfNeeded()
    for (let pass = 0; pass < 3; pass += 1) {
      await page.evaluate(() => {
        const last = document.querySelector('.program-card:last-child')!
        const slot = parseFloat(getComputedStyle(last).top)
        scrollBy({
          top: last.getBoundingClientRect().top - slot,
          behavior: 'instant',
        })
      })
      await page.waitForTimeout(200)
    }
    const scales = () =>
      page
        .locator('.program-inner')
        .evaluateAll((sheets) =>
          sheets.map(
            (sheet) =>
              Math.round(
                new DOMMatrixReadOnly(getComputedStyle(sheet).transform).a * 100
              ) / 100
          )
        )

    await expect
      .poll(async () => {
        const all = await scales()
        return all.slice(0, -1).every((scale) => scale < 0.97) && all.at(-1)
      })
      .toBe(1)
    // Covered sheets are dimmed; the top one is not.
    const shades = await page
      .locator('.program-inner')
      .evaluateAll((sheets) =>
        sheets.map((sheet) =>
          Number(
            getComputedStyle(sheet.querySelector('.program-shade')!).opacity
          )
        )
      )
    expect(shades.slice(0, -1).every((shade) => shade > 0.1)).toBe(true)
    expect(shades.at(-1)).toBeLessThan(0.02)
  })

  test('sets the stack back when the page jumps back above it', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    const jumpTo = (offset: number) =>
      page.evaluate((by) => {
        const stack = document.querySelector('.program-stack')!
        scrollTo(0, stack.getBoundingClientRect().top + scrollY + by)
      }, offset)
    const receded = () =>
      page
        .locator('.program-inner')
        .evaluateAll(
          (sheets) =>
            sheets.filter(
              (sheet) =>
                new DOMMatrixReadOnly(getComputedStyle(sheet).transform).a <
                0.99
            ).length
        )

    await jumpTo(-1600)
    await page.waitForTimeout(800)
    await jumpTo(1200)
    await expect.poll(receded).toBeGreaterThan(1)

    // One jump back above the stack: every sheet returns to full size.
    await jumpTo(-1600)
    await expect.poll(receded).toBe(0)
  })

  test('plays the Solution Challenge funnel once its card takes its slot', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    const figures = () =>
      page
        .locator('.sc-funnel-value')
        .evaluateAll((values) =>
          values.map((value) => value.firstChild?.textContent)
        )
    const final = ['2,100', '6', '3', '1']

    // The section arms within a screen of the viewport, the funnel still
    // below the fold: its figures will count on overlays.
    await page.evaluate(() => {
      const section = document.querySelector('[data-scene="programs"]')!
      scrollBy(0, section.getBoundingClientRect().top - innerHeight * 1.5)
    })
    await expect(page.locator('.sc-funnel-count')).toHaveCount(4)
    await page.evaluate(() => {
      const card = document
        .querySelector('.sc-funnel')!
        .closest('.program-card')!
      const slot = parseFloat(getComputedStyle(card).top)
      scrollBy(0, card.getBoundingClientRect().top - slot + 4)
    })
    await page.waitForTimeout(300)
    // Mid-count, the numbers in the document are already the real ones.
    expect(await figures()).toEqual(final)

    await expect(page.locator('.sc-funnel-count')).toHaveCount(0, {
      timeout: 5_000,
    })
    expect(await figures()).toEqual(final)
    // Every band has opened all the way.
    expect(
      await page.locator('.sc-funnel-step').evaluateAll((bands) =>
        bands.map((band) => {
          const open = getComputedStyle(band).getPropertyValue('--open').trim()
          return open === '' ? 1 : parseFloat(open)
        })
      )
    ).toEqual([1, 1, 1, 1])
  })

  /** Brings a section within arming range, its content still below the fold. */
  async function armBelowFold(page: Page, scene: string) {
    await page.evaluate((name) => {
      const section = document.querySelector(`[data-scene="${name}"]`)!
      scrollBy(0, section.getBoundingClientRect().top - innerHeight * 1.5)
    }, scene)
    // Sections arm when the browser is next idle, within 300ms.
    await page.waitForTimeout(700)
  }

  test('raises the part modules in a ripple from the centre of the grid', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    await armBelowFold(page, 'parts')

    // When each module first shows past half opacity, as the grid arrives.
    const shownAt = await page.evaluate(async () => {
      const modules = [...document.querySelectorAll('.part-module')]
      const seen = modules.map(() => Infinity)
      const start = performance.now()
      const grid = document.querySelector('.part-grid')!
      scrollBy(0, grid.getBoundingClientRect().top - innerHeight * 0.3)
      await new Promise<void>((resolve) => {
        const tick = () => {
          modules.forEach((module, index) => {
            if (
              seen[index] === Infinity &&
              parseFloat(getComputedStyle(module).opacity) > 0.5
            ) {
              seen[index] = performance.now() - start
            }
          })
          if (seen.every(Number.isFinite) || performance.now() - start > 4000) {
            resolve()
          } else {
            requestAnimationFrame(tick)
          }
        }
        requestAnimationFrame(tick)
      })
      return seen
    })

    // Three columns here: the middle one (1 and 4) leads the four corners.
    const [a, b, c, d, e, f] = shownAt
    expect(Math.max(b!, e!)).toBeLessThan(Math.min(a!, c!, d!, f!))
  })

  test('follows a fine pointer across a part module with a spotlight', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    await armBelowFold(page, 'parts')
    const card = page.locator('.part-module').first()
    await card.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1_200)
    const box = (await card.boundingBox())!
    const spot = () =>
      card.evaluate((element) => {
        const style = getComputedStyle(element)
        return [
          parseFloat(style.getPropertyValue('--spot-x')),
          parseFloat(style.getPropertyValue('--spot-y')),
        ]
      })

    await page.mouse.move(box.x + 30, box.y + box.height - 30)
    await page.mouse.move(box.x + 60, box.y + box.height - 50, { steps: 4 })

    await expect
      .poll(async () => {
        const [x, y] = await spot()
        return Math.abs(x! - 60) < 3 && Math.abs(y! - (box.height - 50)) < 3
      })
      .toBe(true)
  })

  test('sends a dot along the UI/UX curve while it is hovered', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    await page.locator('.part-grid').scrollIntoViewIfNeeded()
    const rider = page.locator('.pg-rider')
    const place = () => rider.evaluate((dot) => getComputedStyle(dot).transform)

    await page
      .locator('.part-module', { has: page.locator('.pg-draw') })
      .hover()
    await expect
      .poll(() => rider.evaluate((dot) => getComputedStyle(dot).opacity))
      .toBe('1')
    const before = await place()
    await page.waitForTimeout(300)
    expect(await place()).not.toBe(before)

    await page.mouse.move(4, 4)
    await expect
      .poll(() => rider.evaluate((dot) => getComputedStyle(dot).opacity))
      .toBe('0')
  })

  test('draws the log lane down as the sessions scroll by', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    await armBelowFold(page, 'log')
    // How much of the lane is drawn: its rendered height over its own.
    const lane = () =>
      page
        .locator('.log-lane')
        .evaluate(
          (drawn: HTMLElement) =>
            drawn.getBoundingClientRect().height / drawn.offsetHeight
        )
    const bring = (share: number) =>
      page.evaluate((fraction) => {
        const rows = document.querySelector('.log-rows')!
        scrollBy(0, rows.getBoundingClientRect().top - innerHeight * fraction)
      }, share)

    await bring(0.7)
    await page.waitForTimeout(500)
    const early = await lane()
    expect(early).toBeLessThan(0.6)
    await bring(-0.2)
    await expect.poll(lane).toBeGreaterThan(early + 0.2)

    await page.evaluate(() => {
      const rows = document.querySelector('.log-rows')!
      scrollBy(0, rows.getBoundingClientRect().bottom - innerHeight * 0.3)
    })
    await expect
      .poll(() =>
        page
          .locator('.log-entry')
          .evaluateAll((entries) =>
            entries.every((entry) => getComputedStyle(entry).opacity === '1')
          )
      )
      .toBe(true)
  })

  test('prints the featured cover in and tilts cards toward the pointer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    await armBelowFold(page, 'releases')
    await expect(page.locator('[data-print]')).toHaveCount(1)

    await page.locator('.release-grid').scrollIntoViewIfNeeded()
    await expect(page.locator('[data-print]')).toHaveCount(0, {
      timeout: 5_000,
    })

    const card = page.locator('.release-item').first()
    const box = (await card.boundingBox())!
    await page.mouse.move(box.x + box.width * 0.9, box.y + box.height / 2, {
      steps: 5,
    })
    await expect
      .poll(() =>
        card.evaluate((item) =>
          parseFloat(getComputedStyle(item).getPropertyValue('--tilt-y'))
        )
      )
      .toBeGreaterThan(1)
  })

  /** Landing blocks (past the hero, which fades away by design) that are
      still invisible: opacity 0 on themselves or any ancestor. */
  function hiddenBlocks(page: Page) {
    return page.evaluate(() =>
      [
        ...document.querySelectorAll(
          '[data-scene]:not([data-scene="hero"]) :is(h2, h3, p, .pillar, .program-inner, .sc-funnel-step, .part-module, .log-entry, .release-item)'
        ),
      ]
        .filter((block) => block.getBoundingClientRect().height > 0)
        .filter((block) => !block.checkVisibility({ opacityProperty: true }))
        .map(
          (block) =>
            `${block.closest('[data-scene]')?.getAttribute('data-scene')}: ${block.textContent?.trim().slice(0, 40)}`
        )
    )
  }

  test('leaves nothing hidden after walking from the top to the bottom', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
        scrollTo(0, y)
        await new Promise((resolve) => setTimeout(resolve, 80))
      }
    })
    await page.waitForTimeout(2_500)

    expect(await hiddenBlocks(page)).toEqual([])
  })

  test('leaves nothing hidden after jumping straight past armed sections', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    for (const scene of ['manifesto', 'programs', 'parts', 'log', 'releases']) {
      await armBelowFold(page, scene)
    }
    await page.evaluate(() =>
      scrollTo(0, document.documentElement.scrollHeight)
    )
    await page.waitForTimeout(2_500)

    expect(await hiddenBlocks(page)).toEqual([])
  })

  test('re-measures its scroll lines on a resize without re-rendering a scene', async ({
    page,
  }) => {
    // anime.js re-measures every scroll observer after the page changes
    // size (a section rendering as it nears, streamed rows arriving). That
    // must stay a read: re-rendering scenes to measure forced a style
    // recalculation per observer, long frames in the middle of a scroll.
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
        scrollTo(0, y)
        await new Promise((resolve) => setTimeout(resolve, 80))
      }
      // Settle halfway down the program stack, mid-scrub.
      const stack = document.querySelector('.program-stack')!
      const box = stack.getBoundingClientRect()
      scrollBy(0, box.top + box.height / 2 - innerHeight / 2)
    })
    await page.waitForTimeout(2_500)

    const rewritten = await page.evaluate(async () => {
      const styled = new Set<string>()
      const watcher = new MutationObserver((records) => {
        for (const { target } of records) {
          const element = target as Element
          styled.add(
            `${element.closest('[data-scene]')?.getAttribute('data-scene')} ${element.getAttribute('class')}`
          )
        }
      })
      watcher.observe(document.querySelector('main')!, {
        subtree: true,
        attributeFilter: ['style'],
      })
      const spacer = document.createElement('div')
      spacer.style.height = '40px'
      document.body.append(spacer)
      await new Promise((resolve) => setTimeout(resolve, 1_000))
      watcher.disconnect()
      spacer.remove()
      return [...styled]
    })

    expect(rewritten).toEqual([])
  })

  /** Scrolls the join section's centre to the centre of the screen, where
      its brackets have closed. */
  async function closeJoin(page: Page) {
    await armBelowFold(page, 'join')
    await page.evaluate(() => {
      const box = document
        .querySelector('[data-scene="join"]')!
        .getBoundingClientRect()
      scrollBy(0, box.top + box.height / 2 - innerHeight / 2)
    })
    await page.waitForTimeout(1_600)
  }

  const bracketShifts = (page: Page) =>
    page
      .locator('.join-bracket')
      .evaluateAll((brackets) =>
        brackets.map(
          (bracket) =>
            new DOMMatrixReadOnly(getComputedStyle(bracket).transform).m41
        )
      )

  test('closes the join brackets around the call to action', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    await armBelowFold(page, 'join')

    await page.evaluate(() => {
      const section = document.querySelector('[data-scene="join"]')!
      scrollBy(0, section.getBoundingClientRect().top - innerHeight * 0.95)
    })
    await page.waitForTimeout(600)
    const [left = 0, right = 0] = await bracketShifts(page)
    expect(left).toBeLessThan(-100)
    expect(right).toBeGreaterThan(100)

    await closeJoin(page)
    await expect
      .poll(async () =>
        (await bracketShifts(page)).every((shift) => Math.abs(shift) < 2)
      )
      .toBe(true)
  })

  /** Whether the dot at (column, row) of the join field has swelled: it
      then paints 3.5px out from its centre, where a 2px dot at rest does
      not. Negative indices count from the far end. */
  const swollen = (page: Page, column: number, row: number) =>
    page.locator('.join-field').evaluate(
      (field: HTMLCanvasElement, { column, row }) => {
        const columns = Number(field.dataset.columns)
        const rows = Number(field.dataset.rows)
        const x =
          (((column + columns) % columns) + 0.5) *
            (field.clientWidth / columns) +
          3.5
        const y = (((row + rows) % rows) + 0.5) * (field.clientHeight / rows)
        const scale = field.width / field.clientWidth
        const [, , , alpha] = field
          .getContext('2d')!
          .getImageData(Math.round(x * scale), Math.round(y * scale), 1, 1).data
        return alpha! > 0
      },
      { column, row }
    )

  test('waves the join field out from its centre once the brackets close', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    await armBelowFold(page, 'join')
    const [columns, rows] = await page
      .locator('.join-field')
      .evaluate((field) => [
        Number(field.dataset.columns),
        Number(field.dataset.rows),
      ])
    const centre = [Math.floor(columns! / 2), Math.floor(rows! / 2)] as const

    // Scroll just past the point where the brackets clamp shut, then note
    // when the centre dot and a corner dot first swell.
    await page.evaluate(() => {
      const box = document
        .querySelector('[data-scene="join"]')!
        .getBoundingClientRect()
      scrollBy(0, box.top + box.height / 2 - innerHeight / 2 + 20)
    })
    const start = Date.now()
    let centreAt: number | undefined
    let cornerAt: number | undefined
    while (Date.now() - start < 2_500 && cornerAt === undefined) {
      centreAt ??= (await swollen(page, ...centre)) ? Date.now() : undefined
      cornerAt ??= (await swollen(page, 0, 0)) ? Date.now() : undefined
    }

    expect(centreAt).toBeDefined()
    expect(cornerAt).toBeDefined()
    expect(centreAt!).toBeLessThan(cornerAt!)
  })

  test('ripples the join halftone field out from a tap', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    await closeJoin(page)
    const box = (await page.locator('[data-scene="join"]').boundingBox())!

    await page.mouse.click(box.x + 24, box.y + box.height - 20)
    await page.waitForTimeout(150)

    // The dot under the tap has swelled; the far corner has not been reached.
    expect(await swollen(page, 0, -1)).toBe(true)
    expect(await swollen(page, -1, 0)).toBe(false)
  })

  test('lets a fine pointer pull a join bracket, which springs home', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 768 })
    await page.goto('/en', { waitUntil: 'load' })
    await motionReady(page)
    await closeJoin(page)
    const poster = page.locator(
      '.join-bracket[data-side="right"] .bracket-poster'
    )
    const pulled = () =>
      poster.evaluate(
        (art) => new DOMMatrixReadOnly(getComputedStyle(art).transform).m41
      )
    const box = (await poster.boundingBox())!

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(
      box.x + box.width / 2 - 90,
      box.y + box.height / 2 + 30,
      { steps: 8 }
    )
    expect(await pulled()).toBeLessThan(-40)

    await page.mouse.up()
    await expect.poll(async () => Math.abs(await pulled())).toBeLessThan(1)
  })

  test('stays static when motion is reduced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/en', { waitUntil: 'load' })
    // Longer than the idle timeout the loader waits for.
    await page.waitForTimeout(3_000)

    await expect(page.locator('html')).not.toHaveAttribute('data-home-motion')
    await expect(page.locator('[data-motion]')).toHaveCount(0)
  })
})
