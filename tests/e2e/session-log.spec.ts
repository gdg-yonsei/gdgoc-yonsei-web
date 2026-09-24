import { expect, test } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'

test.describe('session log hub', () => {
  test('lists public sessions by generation and filters them in place', async ({
    page,
  }) => {
    const seeded = await readSeededData()
    await page.goto('/en/session', { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { level: 1, name: 'Session Log' })
    ).toBeVisible()
    const row = page
      .getByRole('region', { name: new RegExp(seeded.generationName) })
      .getByRole('heading', { name: 'E2E Session', exact: true })
    await expect(row).toBeVisible()

    const filters = page.getByRole('search', { name: 'Filters' })
    await filters.getByText('Tech Talk', { exact: true }).click()
    await expect(page).toHaveURL(/\/en\/session\?category=tech_talk$/)
    await expect(row).toBeVisible()

    await filters
      .getByRole('searchbox', { name: 'Search sessions' })
      .fill('no-such-session')
    await expect(
      page.getByText('No sessions match these filters.')
    ).toBeVisible()
    await expect(row).toBeHidden()

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('searchbox', { name: 'Search sessions' })
    ).toHaveValue('no-such-session')
    await expect(
      page.getByRole('heading', { name: 'E2E Session', exact: true })
    ).toBeHidden()

    await page.getByRole('button', { name: 'Reset filters' }).click()
    await expect(page).toHaveURL(/\/en\/session$/)
    await expect(
      page.getByRole('heading', { name: 'E2E Session', exact: true })
    ).toBeVisible()
  })

  test('fits a 320px screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/en/session', { waitUntil: 'load' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      )
    ).toBe(0)
  })
})

test.describe('session generation pages', () => {
  test('show one generation with a trail back to the log', async ({ page }) => {
    const seeded = await readSeededData()
    await page.goto(`/en/session/${seeded.generationName}`, {
      waitUntil: 'domcontentloaded',
    })

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: `${seeded.generationName} Sessions`,
      })
    ).toBeVisible()
    await expect(
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .getByRole('link', { name: 'Sessions' })
    ).toHaveAttribute('href', '/en/session')
    await expect(
      page.getByRole('heading', { name: 'E2E Session', exact: true })
    ).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow'
    )
  })

  test('keep empty generations reachable but out of the index', async ({
    page,
  }) => {
    const seeded = await readSeededData()
    const response = await page.goto(
      `/en/session/${seeded.secondGenerationName}`,
      { waitUntil: 'domcontentloaded' }
    )

    expect(response?.status()).toBe(200)
    await expect(page.getByText('No public sessions yet')).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, follow'
    )
  })
})

test('session pages carry a trail, KST facts and a valid Event', async ({
  page,
}) => {
  const seeded = await readSeededData()
  await page.goto(`/en/session/${seeded.generationName}/${seeded.sessionId}`, {
    waitUntil: 'domcontentloaded',
  })

  await expect(
    page.getByRole('heading', { level: 1, name: 'E2E Session' })
  ).toBeVisible()
  await expect(page).toHaveTitle(
    'E2E Session · Tech Talk · Jun 1, 2025 | GDGoC Yonsei'
  )
  await expect(
    page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: seeded.generationName })
  ).toHaveAttribute('href', `/en/session/${seeded.generationName}`)
  await expect(page.getByText('10:00–12:00 KST')).toBeVisible()

  const data = JSON.parse(
    (await page.locator('#session-structured-data').textContent()) ?? '[]'
  ) as Record<string, unknown>[]
  expect(data[0]).toMatchObject({
    '@type': 'Event',
    startDate: '2025-06-01T10:00:00+09:00',
    eventStatus: 'https://schema.org/EventScheduled',
  })
  expect(data[1]).toMatchObject({ '@type': 'BreadcrumbList' })
})
