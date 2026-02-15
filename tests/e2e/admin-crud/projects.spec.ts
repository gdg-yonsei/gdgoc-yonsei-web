import { expect, test, type Page } from '@playwright/test'
import { readSeededData } from '../helpers/read-seeded-data'
import { ADMIN_STORAGE_STATE } from '../setup/constants'
import { openDeleteModalAndConfirm, setHiddenInputValue } from './helpers'

type SeededData = Awaited<ReturnType<typeof readSeededData>>

test.use({ storageState: ADMIN_STORAGE_STATE })

async function createProject(
  page: Page,
  projectName: string,
  generationName: string
) {
  await page.goto('/admin/projects/create', { waitUntil: 'domcontentloaded' })
  await page.locator('input[name="name"]').fill(projectName)
  await page.locator('input[name="nameKo"]').fill('CRUD 프로젝트')
  await page
    .locator('textarea[name="description"]')
    .fill('One-line description for project')
  await page.locator('textarea[name="descriptionKo"]').fill('프로젝트 한 줄 설명')
  await page.locator('textarea[name="content"]').fill('## Project English Content')
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
  await expect(page).toHaveURL(/\/admin\/projects$/)
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
  })

  test.describe('delete', () => {
    test('deletes a newly created project', async ({ page }) => {
      const projectName = `CRUD Project ${Date.now().toString()}`

      await createProject(page, projectName, seededData.generationName)
      await page.getByRole('link', { name: projectName }).click()

      await openDeleteModalAndConfirm(page)
      await expect(page).toHaveURL(/\/admin\/projects$/)
      await expect(page.getByRole('link', { name: projectName })).toHaveCount(0)
    })
  })
})
