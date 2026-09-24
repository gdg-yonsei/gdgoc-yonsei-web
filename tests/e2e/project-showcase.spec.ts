import { expect, test } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'

test.describe('project showcase', () => {
  test('lists every generation and filters in place', async ({ page }) => {
    const seeded = await readSeededData()
    await page.goto('/en/project', { waitUntil: 'domcontentloaded' })

    await expect(
      page.getByRole('heading', { level: 1, name: 'Projects', exact: true })
    ).toBeVisible()
    const first = page.getByRole('heading', {
      name: 'E2E Project',
      exact: true,
    })
    const second = page.getByRole('heading', {
      name: 'E2E Project 2',
      exact: true,
    })
    await expect(first).toBeVisible()
    await expect(second).toBeVisible()

    await page
      .getByRole('search', { name: 'Filters' })
      .getByText(seeded.secondGenerationName, { exact: true })
      .click()
    await expect(page).toHaveURL(
      new RegExp(`/en/project\\?generation=${seeded.secondGenerationName}$`)
    )
    await expect(first).toBeHidden()
    await expect(second).toBeVisible()

    await page.getByRole('button', { name: 'Reset filters' }).click()
    await expect(first).toBeVisible()
  })

  test('generation pages keep a trail back to all projects', async ({
    page,
  }) => {
    const seeded = await readSeededData()
    await page.goto(`/en/project/${seeded.generationName}`, {
      waitUntil: 'domcontentloaded',
    })

    await expect(
      page.getByRole('heading', {
        level: 1,
        name: `${seeded.generationName} Projects`,
      })
    ).toBeVisible()
    await expect(
      page
        .getByRole('navigation', { name: 'Breadcrumb' })
        .getByRole('link', { name: 'Projects' })
    ).toHaveAttribute('href', '/en/project')
    await expect(
      page.getByRole('heading', { name: 'E2E Project', exact: true })
    ).toBeVisible()
  })

  test('fits a 320px screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto('/en/project', { waitUntil: 'load' })
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

test('project pages carry a trail, the team and a CreativeWork', async ({
  page,
}) => {
  const seeded = await readSeededData()
  await page.goto(`/en/project/${seeded.generationName}/${seeded.projectId}`, {
    waitUntil: 'domcontentloaded',
  })

  await expect(
    page.getByRole('heading', { level: 1, name: 'E2E Project' })
  ).toBeVisible()
  await expect(
    page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Projects' })
  ).toHaveAttribute('href', '/en/project')
  await expect(
    page
      .getByRole('complementary', { name: 'Project details' })
      .getByRole('link', { name: `Meet the ${seeded.generationName} members` })
  ).toHaveAttribute('href', `/en/member/${seeded.generationName}`)

  const data = JSON.parse(
    (await page.locator('#project-structured-data').textContent()) ?? '[]'
  ) as Record<string, unknown>[]
  expect(data[0]).toMatchObject({
    '@type': 'CreativeWork',
    name: 'E2E Project',
  })
  expect(data[1]).toMatchObject({ '@type': 'BreadcrumbList' })
})
