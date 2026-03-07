import { expect, test, type Page } from '@playwright/test'
import { readSeededData } from '../helpers/read-seeded-data'
import { ADMIN_STORAGE_STATE } from '../setup/constants'
import { openDeleteModalAndConfirm, setHiddenInputValue } from './helpers'

type SeededData = Awaited<ReturnType<typeof readSeededData>>

test.use({ storageState: ADMIN_STORAGE_STATE })
const localizedProjectsListPath = /\/(?:en|ko)\/admin\/projects$/

async function createProject(
  page: Page,
  projectName: string,
  generationName: string,
  projectNameKo = 'CRUD 프로젝트'
) {
  await page.goto('/admin/projects/create', { waitUntil: 'domcontentloaded' })
  await page.locator('input[name="name"]').fill(projectName)
  await page.getByRole('button', { name: /^(Korean|한국어)/ }).nth(0).click()
  await page.locator('input[name="nameKo"]').fill(projectNameKo)
  await page
    .locator('textarea[name="description"]')
    .fill('One-line description for project')
  await page.getByRole('button', { name: /^(Korean|한국어)/ }).nth(1).click()
  await page.locator('textarea[name="descriptionKo"]').fill('프로젝트 한 줄 설명')
  await page.locator('textarea[name="content"]').fill('## Project English Content')
  await page.getByRole('button', { name: /^(Korean|한국어)/ }).nth(2).click()
  await page.locator('textarea[name="contentKo"]').fill('## 프로젝트 한국어 내용')
  await page.getByRole('button', { name: generationName }).click()

  await page.getByRole('button', { name: 'Open' }).first().click()
  await page.getByRole('button', { name: '테스터관리' }).click()

  await setHiddenInputValue(page, 'mainImage', '/project-default.png')
  await setHiddenInputValue(
    page,
    'contentImages',
    JSON.stringify(['/project-default.png'])
  )

  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page).toHaveURL(localizedProjectsListPath)
}

test.describe('projects CRUD', () => {
  let seededData: SeededData

  test.beforeAll(async () => {
    seededData = await readSeededData()
  })

  test.describe('read', () => {
    test('reads seeded project detail page', async ({ page }) => {
      await page.goto(`/admin/projects/${seededData.projectId}`, {
        waitUntil: 'domcontentloaded',
      })

      await expect(
        page.getByText('E2E Project', { exact: true }).first()
      ).toBeVisible()
    })
  })

  test.describe('update', () => {
    test('updates a newly created project', async ({ page }) => {
      const projectName = `CRUD Project ${Date.now().toString()}`
      const updatedProjectName = `${projectName} Updated`

      await createProject(page, projectName, seededData.generationName)
      await page.getByRole('link', { name: projectName }).click()
      await expect(page.getByText(projectName, { exact: true })).toBeVisible()

      await page.getByRole('link', { name: 'Edit' }).click()
      await page.locator('input[name="name"]').fill(updatedProjectName)
      await page.getByRole('button', { name: 'Submit' }).click()

      await expect(
        page.getByText(updatedProjectName, { exact: true }).first()
      ).toBeVisible()
    })

    test('invalidates localized public caches after admin update and keeps admin fresh', async ({
      page,
    }) => {
      const suffix = Date.now().toString()
      const projectName = `Cache Project ${suffix}`
      const projectNameKo = `캐시 프로젝트 ${suffix}`
      const updatedProjectName = `Cache Project Updated ${suffix}`
      const updatedProjectNameKo = `캐시 프로젝트 수정 ${suffix}`

      await createProject(
        page,
        projectName,
        seededData.generationName,
        projectNameKo
      )

      await page.goto(`/en/project/${seededData.generationName}`, {
        waitUntil: 'domcontentloaded',
      })
      await expect(
        page.getByRole('heading', { name: projectName, exact: true }).first()
      ).toBeVisible()

      await page.goto(`/ko/project/${seededData.generationName}`, {
        waitUntil: 'domcontentloaded',
      })
      await expect(
        page.getByRole('heading', { name: projectNameKo, exact: true }).first()
      ).toBeVisible()

      await page.goto('/admin/projects', { waitUntil: 'domcontentloaded' })
      await page
        .getByRole('link')
        .filter({ hasText: projectName })
        .first()
        .click()
      await page.getByRole('link', { name: 'Edit' }).click()
      await page.locator('input[name="name"]').fill(updatedProjectName)
      await page.getByRole('button', { name: /^(Korean|한국어)/ }).nth(0).click()
      await page.locator('input[name="nameKo"]').fill(updatedProjectNameKo)
      await page.getByRole('button', { name: 'Submit' }).click()

      await expect(
        page.getByText(updatedProjectName, { exact: true }).first()
      ).toBeVisible()

      await page.goto('/admin/projects', { waitUntil: 'domcontentloaded' })
      await expect(
        page.getByRole('link').filter({ hasText: updatedProjectName }).first()
      ).toBeVisible()
      await expect(
        page.getByText(projectName, { exact: true })
      ).toHaveCount(0)

      await page.goto(`/en/project/${seededData.generationName}`, {
        waitUntil: 'domcontentloaded',
      })
      await expect(
        page
          .getByRole('heading', { name: updatedProjectName, exact: true })
          .first()
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: projectName, exact: true })
      ).toHaveCount(0)

      await page.goto(`/ko/project/${seededData.generationName}`, {
        waitUntil: 'domcontentloaded',
      })
      await expect(
        page
          .getByRole('heading', { name: updatedProjectNameKo, exact: true })
          .first()
      ).toBeVisible()
      await expect(
        page.getByRole('heading', { name: projectNameKo, exact: true })
      ).toHaveCount(0)
    })
  })

  test.describe('delete', () => {
    test('deletes a newly created project', async ({ page }) => {
      const projectName = `CRUD Project ${Date.now().toString()}`

      await createProject(page, projectName, seededData.generationName)
      await page.getByRole('link', { name: projectName }).click()

      await openDeleteModalAndConfirm(page)
      await expect(page).toHaveURL(localizedProjectsListPath)
      await expect(page.getByRole('link', { name: projectName })).toHaveCount(0)
    })
  })
})
