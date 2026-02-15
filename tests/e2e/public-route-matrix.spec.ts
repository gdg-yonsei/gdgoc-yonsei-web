import { expect, test } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'

type SeededData = Awaited<ReturnType<typeof readSeededData>>

test.describe('public routes and user interactions', () => {
  let seededData: SeededData

  test.beforeAll(async () => {
    seededData = await readSeededData()
  })

  test('language root pages and key static pages load', async ({ page }) => {
    const routes = [
      '/en',
      '/ko',
      '/en/calendar',
      '/ko/calendar',
      '/en/privacy-policy',
      '/ko/privacy-policy',
      '/en/terms-of-service',
      '/ko/terms-of-service',
      '/en/recruit',
      '/ko/recruit',
      '/en/2026-freshman-ot',
      '/ko/2026-freshman-ot',
    ]

    for (const route of routes) {
      await test.step(route, async () => {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
        expect(response).not.toBeNull()
        expect(response?.status() ?? 0).toBeLessThan(400)
        await expect(page.locator('body')).toBeVisible()
      })
    }
  })

  test('top-level member/project/session routes redirect to latest generation', async ({
    context,
    page,
  }) => {
    const latestGeneration = seededData.generationName

    const redirectTargets = ['member', 'project', 'session']

    for (const target of redirectTargets) {
      const routePage = await context.newPage()
      await routePage.goto(`/en/${target}`, { waitUntil: 'domcontentloaded' })
      await expect(routePage).toHaveURL(
        new RegExp(`/en/${target}/${latestGeneration}$`)
      )
      await routePage.close()
    }

    await page.goto(`/en/project/${latestGeneration}`, {
      waitUntil: 'domcontentloaded',
    })
    await expect(page).toHaveURL(new RegExp(`/en/project/${latestGeneration}$`))
  })

  test('seeded generation pages and detail pages load end-to-end', async ({
    page,
  }) => {
    const generation = seededData.generationName

    const routes = [
      `/en/member/${generation}`,
      `/en/project/${generation}`,
      `/en/session/${generation}`,
      `/en/project/${generation}/${seededData.projectId}`,
      `/en/session/${generation}/${seededData.sessionId}`,
    ]

    for (const route of routes) {
      await test.step(route, async () => {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
        expect(response).not.toBeNull()
        expect(response?.status() ?? 0).toBeLessThan(400)
        await expect(page.locator('body')).toBeVisible()
      })
    }
  })

  test('user can click seeded session and project cards from generation list pages', async ({
    page,
  }) => {
    const generation = seededData.generationName

    await page.goto(`/en/project/${generation}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'E2E Project' }).click()
    await expect(
      page.getByRole('heading', { name: /E2E Project/i }).first()
    ).toBeVisible()

    await page.goto(`/en/session/${generation}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('heading', { name: 'E2E Session' }).click()
    await expect(
      page.getByRole('heading', { name: /E2E Session/i }).first()
    ).toBeVisible()
  })

  test('home navigation buttons route to major sections', async ({ page }) => {
    await page.goto('/en', { waitUntil: 'domcontentloaded' })

    await page.getByRole('link', { name: /^Member(s)?$/ }).first().click()
    await expect(page).toHaveURL(/\/en\/member\//)

    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: /^Project(s)?$/ }).first().click()
    await expect(page).toHaveURL(/\/en\/project\//)

    await page.goto('/en', { waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: /^Session(s)?$/ }).first().click()
    await expect(page).toHaveURL(/\/en\/session\//)
  })
})
