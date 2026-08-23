import { expect, test } from '@playwright/test'
import { instant } from '@next/playwright'
import { readSeededData } from './helpers/read-seeded-data'

test.describe('public instant navigation shells', () => {
  test.describe.configure({ timeout: 90_000 })

  test('homepage to project index exposes a useful shared shell', async ({
    page,
  }) => {
    await page.goto('/en')

    await instant(page, async () => {
      await page.locator('a[href="/en/project"]').first().click()
      await page.waitForURL((url) => url.pathname === '/en/project')
      await expect(page.locator('header')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Projects by Generation' })
      ).toBeVisible()
      await expect(page.getByTestId('generation-index-shell')).toBeVisible()
    })
  })

  test('homepage to session index exposes a useful shared shell', async ({
    page,
  }) => {
    await page.goto('/en')

    await instant(page, async () => {
      await page.locator('a[href="/en/session"]').first().click()
      await page.waitForURL((url) => url.pathname === '/en/session')
      await expect(page.locator('header')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Sessions by Generation' })
      ).toBeVisible()
      await expect(page.getByTestId('generation-index-shell')).toBeVisible()
    })
  })

  test('member index to a generation is prefetched for a likely navigation', async ({
    page,
  }) => {
    const seededData = await readSeededData()
    const destination = `/en/member/${seededData.generationName}`

    await page.goto('/en/member')
    const generationLink = page.locator(`a[href="${destination}"]`)
    await expect(generationLink).toBeVisible()

    await instant(page, async () => {
      await generationLink.click()
      await page.waitForURL((url) => url.pathname === destination)
      await expect(page.locator('header')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible()
    })
  })

  test('project index to a generation is prefetched for a likely navigation', async ({
    page,
  }) => {
    const seededData = await readSeededData()
    const destination = `/en/project/${seededData.generationName}`

    await page.goto('/en/project')
    const generationLink = page.locator(`a[href="${destination}"]`)
    await expect(generationLink).toBeVisible()

    await instant(page, async () => {
      await generationLink.click()
      await page.waitForURL((url) => url.pathname === destination)
      await expect(page.locator('header')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Projects' })
      ).toBeVisible()
    })
  })

  test('project generation to detail exposes the route fallback immediately', async ({
    page,
  }) => {
    const seededData = await readSeededData()
    const listPath = `/en/project/${seededData.generationName}`
    const destination = `${listPath}/${seededData.projectId}`

    await page.goto(listPath)
    const projectLink = page.locator(`a[href="${destination}"]`)
    await expect(projectLink).toBeVisible()

    await instant(page, async () => {
      await projectLink.click()
      await page.waitForURL((url) => url.pathname === destination)
      await expect(page.locator('header')).toBeVisible()
      await expect(
        page.getByRole('status', { name: 'Loading project details' })
      ).toBeVisible()
    })

    await expect(
      page.getByRole('heading', { name: /E2E Project/i }).first()
    ).toBeVisible()
  })

  test('session index to a generation is prefetched for a likely navigation', async ({
    page,
  }) => {
    const seededData = await readSeededData()
    const destination = `/en/session/${seededData.generationName}`

    await page.goto('/en/session')
    const generationLink = page.locator(`a[href="${destination}"]`)
    await expect(generationLink).toBeVisible()

    await instant(page, async () => {
      await generationLink.click()
      await page.waitForURL((url) => url.pathname === destination)
      await expect(page.locator('header')).toBeVisible()
      await expect(
        page.getByRole('heading', { name: 'Sessions' })
      ).toBeVisible()
      await expect(page.getByText('Generation')).toBeVisible()
    })
  })

  test('session generation to detail exposes the route fallback immediately', async ({
    page,
  }) => {
    const seededData = await readSeededData()
    const listPath = `/en/session/${seededData.generationName}`
    const destination = `${listPath}/${seededData.sessionId}`

    await page.goto(listPath)
    const sessionLink = page.locator(`a[href="${destination}"]`)
    await expect(sessionLink).toBeVisible()

    await instant(page, async () => {
      await sessionLink.click()
      await page.waitForURL((url) => url.pathname === destination)
      await expect(page.locator('header')).toBeVisible()
      await expect(
        page.getByRole('status', { name: 'Loading session details' })
      ).toBeVisible()
    })

    await expect(
      page.getByRole('heading', { name: /E2E Session/i }).first()
    ).toBeVisible()
  })

})
