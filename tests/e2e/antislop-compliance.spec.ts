import { expect, test, type Locator, type Page } from '@playwright/test'
import { ADMIN_STORAGE_STATE } from './setup/constants'
import { readSeededData } from './helpers/read-seeded-data'
import postgres from 'postgres'
import { assertDisposableDatabase } from '../../scripts/lib/disposable-database'
import { setHiddenInputValue } from './admin-crud/helpers'

async function ratio(locator: Locator, property = 'color', pseudo?: string) {
  return locator.evaluate(
    (element, { property, pseudo }) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      function rgba(value: string) {
        ctx.clearRect(0, 0, 1, 1)
        ctx.fillStyle = value
        ctx.fillRect(0, 0, 1, 1)
        return Array.from(ctx.getImageData(0, 0, 1, 1).data)
      }
      function over(front: number[], back: number[]) {
        const frontAlpha = front[3]! / 255
        const backAlpha = back[3]! / 255
        const alpha = frontAlpha + backAlpha * (1 - frontAlpha)
        if (alpha === 0) return [0, 0, 0, 0]
        return front
          .slice(0, 3)
          .map(
            (channel, i) =>
              (channel * frontAlpha + back[i]! * backAlpha * (1 - frontAlpha)) /
              alpha
          )
          .concat(alpha * 255)
      }
      const style = getComputedStyle(element, pseudo)
      let foreground = rgba(style.getPropertyValue(property))
      let background = [0, 0, 0, 0]
      for (
        let node: Element | null = element;
        node;
        node = node.parentElement
      ) {
        const ancestor = getComputedStyle(node)
        const surface = rgba(ancestor.backgroundColor)
        foreground = over(foreground, surface)
        background = over(background, surface)
        foreground[3]! *= Number(ancestor.opacity)
        background[3]! *= Number(ancestor.opacity)
      }
      foreground = over(foreground, [255, 255, 255, 255])
      background = over(background, [255, 255, 255, 255])
      function luminance(channels: number[]) {
        const linear = channels.slice(0, 3).map((channel) => {
          const s = channel / 255
          return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
        })
        return linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722
      }
      const values = [luminance(foreground), luminance(background)].sort(
        (a, b) => a - b
      )
      return {
        ratio: (values[1]! + 0.05) / (values[0]! + 0.05),
        foreground,
        background,
      }
    },
    { property, pseudo }
  )
}

async function expectTouchTarget(locator: Locator) {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.width).toBeGreaterThanOrEqual(44)
  expect(box!.height).toBeGreaterThanOrEqual(44)
}

async function expectTextContrast(locator: Locator) {
  // Visibility and completion labels update before opacity and color transitions finish.
  await expect
    .poll(async () => (await ratio(locator)).ratio)
    .toBeGreaterThanOrEqual(4.5)
}

async function expectNoPageOverflow(page: Page) {
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    )
  ).toBeLessThanOrEqual(1)
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`antislop public ${theme}`, () => {
    test.use({ colorScheme: theme, reducedMotion: 'reduce' })

    test('filter count contrast remains readable after selection and hover', async ({
      page,
    }) => {
      await page.goto('/en/project')
      expect(
        (await ratio(page.getByRole('searchbox'), 'color', '::placeholder'))
          .ratio
      ).toBeGreaterThanOrEqual(4.5)
      const chip = page.locator('.filter-chip').first()
      await expect(chip).toBeVisible()
      await expectTouchTarget(chip)
      const count = chip.locator('.filter-chip-count')
      expect((await ratio(count)).ratio).toBeGreaterThanOrEqual(4.5)
      await chip.click()
      await expect(chip.locator('input')).toBeChecked()
      expect((await ratio(count)).ratio).toBeGreaterThanOrEqual(4.5)
      await chip.hover()
      expect((await ratio(count)).ratio).toBeGreaterThanOrEqual(4.5)
      const reset = page.getByRole('button', { name: /Reset/i })
      await expectTouchTarget(reset)
      await reset.click()
      await expect(chip.locator('input')).not.toBeChecked()
    })

    test('sign-in instructions and legal links have readable contrast', async ({
      page,
    }) => {
      await page.goto('/auth/sign-in')
      expect(
        (await ratio(page.getByText('Yonsei University', { exact: true })))
          .ratio
      ).toBeGreaterThanOrEqual(4.5)
      const instructions = page.getByText('By signing up, you agree to our', {
        exact: false,
      })
      await expect(instructions).toBeVisible()
      expect((await ratio(instructions)).ratio).toBeGreaterThanOrEqual(4.5)
      for (const name of ['Privacy Policy', 'Terms of Service']) {
        const link = page.getByRole('link', { name })
        expect((await ratio(link)).ratio).toBeGreaterThanOrEqual(4.5)
        expect(
          await link.evaluate(
            (element) => getComputedStyle(element).textDecorationLine
          )
        ).toContain('underline')
      }
    })

    test('calendar highlights keep the current day readable', async ({
      page,
    }) => {
      await page.goto('/en/calendar')
      const today = page.locator(
        '.calendar-day[data-today] .calendar-day-number'
      )
      await expect(today).toBeVisible()
      expect((await ratio(today)).ratio).toBeGreaterThanOrEqual(4.5)
    })

    test('public mobile navigation supports keyboard focus and Escape', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto('/en')
      const trigger = page.getByRole('button', { name: 'Open navigation menu' })
      await expectTouchTarget(trigger)
      await trigger.focus()
      await page.keyboard.press('Enter')
      const menu = page.getByRole('dialog', { name: 'Menu' })
      await expect(menu).toBeVisible()
      await page.keyboard.press('Tab')
      expect(
        await menu.evaluate((element) =>
          element.contains(document.activeElement)
        )
      ).toBe(true)
      await page.keyboard.press('Escape')
      await expect(menu).toBeHidden()
      await expect(trigger).toBeFocused()
      expect(
        await trigger.evaluate((element) => {
          const style = getComputedStyle(element)
          return style.outlineStyle !== 'none' || style.boxShadow !== 'none'
        })
      ).toBe(true)
    })

    test('public pages reflow from 320px through tablet and desktop', async ({
      page,
    }) => {
      test.setTimeout(180_000)
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        for (const route of [
          '/en',
          '/en/project',
          '/en/session',
          '/en/member',
          '/en/calendar',
          '/en/privacy-policy',
        ]) {
          await test.step(`${route} at ${width}px`, async () => {
            await page.goto(route)
            await expect(
              page.getByRole('heading', { level: 1 }).first()
            ).toBeVisible()
            await expectNoPageOverflow(page)
          })
        }
      }
    })
  })

  test.describe(`antislop admin ${theme}`, () => {
    test.use({ storageState: ADMIN_STORAGE_STATE, reducedMotion: 'reduce' })
    test.beforeEach(async ({ context, baseURL }) => {
      await context.addCookies([
        { name: 'admin-theme', value: theme, url: baseURL! },
      ])
    })

    test('input text, placeholder and control boundaries meet contrast thresholds', async ({
      page,
    }) => {
      await page.goto('/admin/profile/edit')
      const inputs = page.locator(
        'input.admin-input:not([type="hidden"]):visible, textarea.admin-input:visible, select.admin-input:visible'
      )
      await expect(inputs.first()).toBeVisible()
      expect(await inputs.count()).toBeGreaterThan(0)
      for (const input of await inputs.all()) {
        expect((await ratio(input)).ratio).toBeGreaterThanOrEqual(4.5)
        expect(
          (await ratio(input, 'border-top-color')).ratio
        ).toBeGreaterThanOrEqual(3)
        if (await input.getAttribute('placeholder'))
          expect(
            (await ratio(input, 'color', '::placeholder')).ratio
          ).toBeGreaterThanOrEqual(4.5)
      }
      const submit = page
        .getByRole('button', { name: /Submit|Save|Register/i })
        .first()
      await expectTouchTarget(submit)
      await submit.hover()
      expect((await ratio(submit)).ratio).toBeGreaterThanOrEqual(4.5)
    })

    test('delete confirmation remains readable and can be canceled by keyboard', async ({
      page,
    }) => {
      const seeded = await readSeededData()
      await page.goto(`/admin/generations/${seeded.generationId.toString()}`)
      const trigger = page.getByRole('button', { name: /Delete/i }).first()
      await trigger.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      const danger = dialog.getByRole('button', { name: /Confirm/i })
      await expectTouchTarget(danger)
      await expectTextContrast(danger)
      await danger.hover()
      await expectTextContrast(danger)
      await page.keyboard.press('Escape')
      await expect(dialog).toBeHidden()
      await expect(trigger).toBeFocused()
    })

    test('selected navigation and completed language tabs remain readable', async ({
      page,
    }) => {
      await page.goto('/admin/projects/create')
      const english = page.getByRole('tab', { name: /^English/ }).first()
      await expect(english).toBeVisible()
      await english.click()
      await page.locator('input[name="name"]').fill('Readable project')
      await page
        .getByRole('tab', { name: /^(Korean|한국어)/ })
        .first()
        .click()
      await page.locator('input[name="nameKo"]').fill('읽을 수 있는 프로젝트')
      const tabs = page.getByRole('tab').filter({ hasText: /Done/ })
      await expect(tabs).toHaveCount(2)
      for (const tab of await tabs.all()) {
        await expectTextContrast(tab)
        await expectTextContrast(tab.locator('span'))
      }
      const navigation = page.getByRole('navigation', {
        name: 'Main navigation',
      })
      const active = navigation.locator('[aria-current="page"]')
      expect((await ratio(active)).ratio).toBeGreaterThanOrEqual(4.5)
      for (const link of await navigation.getByRole('link').all())
        await expectTouchTarget(link)
      await expectTouchTarget(
        page.getByRole('link', { name: 'GYMS', exact: true })
      )
    })

    test('admin table links retain 44px targets after fonts load', async ({
      page,
    }) => {
      for (const route of ['/admin/generations', '/admin/parts']) {
        await page.goto(route)
        const rows = page.locator('a.admin-table-row')
        await expect(rows.first()).toBeVisible()
        await page.evaluate(() => document.fonts.ready)
        for (const row of await rows.all()) await expectTouchTarget(row)
      }
    })

    test('selected member metadata keeps full text contrast', async ({
      page,
    }) => {
      await page.goto('/admin/sessions/create')
      const choice = page.locator('button[aria-pressed]').first()
      await expect(choice).toBeVisible()
      await choice.click()
      const labels = page.locator('button[aria-pressed="true"] .text-xs')
      await expect(labels.first()).toBeVisible()
      for (const label of await labels.all())
        expect((await ratio(label)).ratio).toBeGreaterThanOrEqual(4.5)
    })

    test('admin menu and theme controls are usable at phone width', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 320, height: 900 })
      await page.goto('/admin')
      const toggle = page.getByRole('button', { name: /dark mode|light mode/i })
      await expectTouchTarget(toggle)
      const before = await page
        .locator('#admin-theme-root')
        .getAttribute('class')
      await toggle.click()
      await expect
        .poll(() => page.locator('#admin-theme-root').getAttribute('class'))
        .not.toBe(before)
      await expectNoPageOverflow(page)
      const menu = page.getByRole('button', { name: /menu/i }).first()
      await expectTouchTarget(menu)
      await menu.focus()
      await page.keyboard.press('Enter')
      await expect(
        page.getByRole('navigation', { name: 'Main navigation' })
      ).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(menu).toBeFocused()
    })
  })
}

test('failed passkey sign-in announces a retryable error and restores controls', async ({
  page,
}) => {
  await page.route(
    '**/api/auth/passkey/generate-authenticate-options**',
    (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Passkey service unavailable',
        }),
      })
  )
  await page.goto('/auth/sign-in')
  await page.waitForLoadState('networkidle')
  const passkey = page.getByRole('button', { name: 'Sign in with Passkey' })
  await passkey.click()
  await expect(
    page.getByRole('alert').filter({ hasText: /passkey|retry|try again/i })
  ).toBeVisible()
  await expect(passkey).toBeEnabled()
})

test('text and controls reflow at 200 percent desktop zoom', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 640, height: 450 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  try {
    for (const route of [
      '/en',
      '/en/project',
      '/en/privacy-policy',
      '/auth/sign-in',
    ]) {
      await page.goto(route)
      await expectNoPageOverflow(page)
      const heading = page.getByRole('heading', { level: 1 }).first()
      await heading.scrollIntoViewIfNeeded()
      await expect(heading).toBeVisible()
      expect(
        await heading.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1
        )
      ).toBe(true)
    }
  } finally {
    await context.close()
  }
})

test.describe('admin loading and gallery accessibility', () => {
  test.use({ storageState: ADMIN_STORAGE_STATE, reducedMotion: 'reduce' })

  for (const [locale, label] of [
    ['en', 'Loading'],
    ['ko', '불러오는 중'],
  ] as const) {
    test(`initial ${locale} admin navigation announces its locale while the layout is pending`, async ({
      page,
      baseURL,
    }) => {
      const databaseURL = process.env.AUTH_DRIZZLE_URL
      assertDisposableDatabase(databaseURL, 'e2e initial admin loading')
      await page.context().addCookies([
        {
          name: 'admin-locale',
          value: locale === 'ko' ? 'en' : 'ko',
          url: baseURL!,
          httpOnly: true,
          sameSite: 'Lax',
        },
      ])
      const sql = postgres(databaseURL, { max: 1 })
      const reserved = await sql.reserve()
      try {
        await reserved`BEGIN`
        await reserved`LOCK TABLE "user" IN ACCESS EXCLUSIVE MODE`
        await page.goto(`/${locale}/admin/members`, { waitUntil: 'commit' })
        const status = page.getByRole('status')
        await expect(status).toBeVisible()
        await expect(status).toHaveText(label)
        await expect(status).toHaveAttribute('lang', locale)
        await expect(page.locator('#admin-theme-root')).toHaveCount(0)
      } finally {
        await reserved`ROLLBACK`
        reserved.release()
        await sql.end()
      }
      await expect(page.locator('#admin-theme-root')).toBeVisible()
      await expect(page.getByRole('status')).toHaveCount(0)
    })
  }

  test('a delayed admin response announces loading until content arrives', async ({
    page,
  }) => {
    const databaseURL = process.env.AUTH_DRIZZLE_URL
    assertDisposableDatabase(databaseURL, 'e2e loading-state verification')
    await page.goto('/admin/projects/create')
    await page.waitForLoadState('networkidle')
    const sql = postgres(databaseURL, { max: 1 })
    const reserved = await sql.reserve()
    try {
      await reserved`BEGIN`
      await reserved`LOCK TABLE tags IN ACCESS EXCLUSIVE MODE`
      await page.goto('/admin/projects/create', { waitUntil: 'commit' })
      await expect(
        page
          .getByRole('status')
          .filter({ hasText: /loading/i })
          .first()
      ).toBeVisible()
    } finally {
      await reserved`ROLLBACK`
      reserved.release()
      await sql.end()
    }
    await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
    await expect(
      page.getByRole('status').filter({ hasText: /loading/i })
    ).toHaveCount(0)
  })

  test('gallery controls work by keyboard and jump immediately with reduced motion', async ({
    page,
  }) => {
    const seeded = await readSeededData()
    const name = `Accessibility gallery ${Date.now().toString()}`
    await page.goto('/admin/projects/create')
    const generationId = await page
      .locator('input[name="generationId"]')
      .inputValue()
    for (const [index, english, korean] of [
      [0, 'name', 'nameKo'],
      [1, 'description', 'descriptionKo'],
      [2, 'content', 'contentKo'],
    ] as const) {
      await page
        .getByRole('tab', { name: /^English/ })
        .nth(index)
        .click()
      await page
        .locator(`input[name="${english}"], textarea[name="${english}"]`)
        .fill(name)
      await page
        .getByRole('tab', { name: /^(Korean|한국어)/ })
        .nth(index)
        .click()
      await page
        .locator(`input[name="${korean}"], textarea[name="${korean}"]`)
        .fill('접근성 갤러리 테스트')
    }
    await setHiddenInputValue(
      page,
      'participants',
      JSON.stringify([seeded.adminUserId])
    )
    await setHiddenInputValue(page, 'mainImage', '/gdgoc-logo.png')
    await setHiddenInputValue(
      page,
      'contentImages',
      JSON.stringify(['/gdgoc-logo.png', '/default-user-profile.png'])
    )
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page).toHaveURL(/\/admin\/projects$/)
    await page.getByRole('link', { name }).click()
    await expect(page).toHaveURL(/\/admin\/projects\/[^/]+$/)
    const projectId = new URL(page.url()).pathname.split('/').at(-1)!
    const generation =
      generationId === seeded.generationId.toString()
        ? seeded.generationName
        : seeded.secondGenerationName
    await page.goto(`/en/project/${generation}/${projectId}`)
    const gallery = page.getByRole('group', { name, exact: true })
    await expect(gallery).toBeVisible()
    for (const button of await gallery.getByRole('button').all())
      await expectTouchTarget(button)
    const track = gallery.locator('.site-gallery-track')
    await track.focus()
    await page.keyboard.press('ArrowRight')
    expect(
      await track.evaluate((element) =>
        Math.abs(element.scrollLeft - element.clientWidth)
      )
    ).toBeLessThanOrEqual(1)
    await expect(gallery.locator('[aria-live="polite"]')).toContainText(
      'image 2 of 2'
    )
    await page.keyboard.press('ArrowLeft')
    expect(
      await track.evaluate((element) => element.scrollLeft)
    ).toBeLessThanOrEqual(1)
    await expect(
      gallery.getByRole('button', { name: 'Previous image' })
    ).toBeDisabled()
  })
})
