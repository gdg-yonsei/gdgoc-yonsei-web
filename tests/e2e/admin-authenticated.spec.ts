import { expect, test } from '@playwright/test'
import { setAdminGenerationScope } from './admin-crud/helpers'
import { readSeededData } from './helpers/read-seeded-data'
import { ADMIN_STORAGE_STATE } from './setup/constants'

type SeededData = Awaited<ReturnType<typeof readSeededData>>

test.use({ storageState: ADMIN_STORAGE_STATE })

test.describe('authenticated admin routes', () => {
  let seededData: SeededData

  test.beforeAll(async () => {
    seededData = await readSeededData()
  })

  test('opens admin home and shows management links', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/\/admin$/)
    await expect(page.getByRole('link', { name: /Generations/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Parts/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Members/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Sessions/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Projects/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Profile/i })).toBeVisible()
  })

  test('all primary admin list pages are reachable', async ({ page }) => {
    const routes = [
      '/admin/generations',
      '/admin/parts',
      '/admin/members',
      '/admin/sessions',
      '/admin/projects',
      '/admin/profile',
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

  test('all admin create pages expose submit controls', async ({ page }) => {
    const createRoutes = [
      '/admin/generations/create',
      '/admin/parts/create',
      '/admin/sessions/create',
      '/admin/projects/create',
    ]

    for (const route of createRoutes) {
      await test.step(route, async () => {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' })

        expect(response).not.toBeNull()
        expect(response?.status() ?? 0).toBeLessThan(400)
        await expect(
          page.getByRole('button', { name: /Submit|Register/i }).first()
        ).toBeVisible()
      })
    }
  })

  test('seeded admin detail/edit/register pages are reachable', async ({
    page,
  }) => {
    const routes = [
      `/admin/generations/${seededData.generationId.toString()}`,
      `/admin/generations/${seededData.generationId.toString()}/edit`,
      `/admin/parts/${seededData.partId.toString()}`,
      `/admin/parts/${seededData.partId.toString()}/edit`,
      `/admin/projects/${seededData.projectId}`,
      `/admin/projects/${seededData.projectId}/edit`,
      `/admin/sessions/${seededData.sessionId}`,
      `/admin/sessions/${seededData.sessionId}/edit`,
      `/admin/sessions/${seededData.sessionId}/register`,
      `/admin/members/${seededData.memberUserId}`,
      `/admin/members/${seededData.memberUserId}/edit`,
      '/admin/profile/edit',
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

  test('generation scope filters admin lists and persists across pages', async ({
    page,
  }) => {
    await page.goto('/admin/parts', { waitUntil: 'domcontentloaded' })

    await expect(
      page.locator(`a[href$="/admin/parts/${seededData.secondPartId.toString()}"]`)
    ).toBeVisible()
    await expect(
      page.locator(`a[href$="/admin/parts/${seededData.partId.toString()}"]`)
    ).toHaveCount(0)

    await setAdminGenerationScope(page, seededData.generationName)

    await expect(
      page.locator(`a[href$="/admin/parts/${seededData.partId.toString()}"]`)
    ).toBeVisible()
    await expect(
      page.locator(`a[href$="/admin/parts/${seededData.secondPartId.toString()}"]`)
    ).toHaveCount(0)

    await page.goto('/admin/projects', { waitUntil: 'domcontentloaded' })
    await expect(
      page.locator(`a[href$="/admin/projects/${seededData.projectId}"]`)
    ).toBeVisible()
    await expect(
      page.locator(`a[href$="/admin/projects/${seededData.secondProjectId}"]`)
    ).toHaveCount(0)

    await page.goto('/admin/sessions', { waitUntil: 'domcontentloaded' })
    await expect(
      page.locator(`a[href$="/admin/sessions/${seededData.sessionId}"]`)
    ).toBeVisible()
    await expect(
      page.locator(`a[href$="/admin/sessions/${seededData.secondSessionId}"]`)
    ).toHaveCount(0)
    await expect(
      page.locator(
        `a[href$="/admin/sessions/${seededData.secondSessionId}/register"]`
      )
    ).toBeVisible()
  })
})
