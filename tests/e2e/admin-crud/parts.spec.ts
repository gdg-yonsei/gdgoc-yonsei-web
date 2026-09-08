import { expect, test, type Page } from '@playwright/test'
import { readSeededData } from '../helpers/read-seeded-data'
import { ADMIN_STORAGE_STATE } from '../setup/constants'
import { openDeleteModalAndConfirm } from './helpers'

type SeededData = Awaited<ReturnType<typeof readSeededData>>

test.use({ storageState: ADMIN_STORAGE_STATE })

async function createPart(page: Page, partName: string) {
  await page.goto('/admin/parts/create', { waitUntil: 'domcontentloaded' })
  await page.locator('input[name="name"]').fill(partName)
  await page
    .locator('textarea[name="description"]')
    .fill('Part description for CRUD e2e test')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page).toHaveURL(/\/admin\/parts$/)
}

test.describe('parts CRUD', () => {
  let seededData: SeededData

  test.beforeAll(async () => {
    seededData = await readSeededData()
  })

  test.describe('read', () => {
    test('reads seeded part detail page', async ({ page }) => {
      await page.goto(`/admin/parts/${seededData.partId.toString()}`, {
        waitUntil: 'domcontentloaded',
      })

      await expect(
        page.getByText('E2E Part', {
          exact: true,
        })
      ).toBeVisible()
    })
  })

  test.describe('update', () => {
    test('updates a newly created part', async ({ page }) => {
      const partName = `CRUD Part ${Date.now().toString()}`
      const updatedPartName = `${partName} Updated`

      await createPart(page, partName)
      await page.getByRole('link', { name: partName }).click()
      await expect(page.getByText(updatedPartName)).toHaveCount(0)

      await page.getByRole('link', { name: 'Edit' }).click()
      await expect(page).toHaveURL(/\/admin\/parts\/\d+\/edit$/)
      await page.getByRole('textbox', { name: 'Name' }).fill(updatedPartName)
      await page.getByRole('spinbutton', { name: 'Display Order' }).fill('0')
      await page
        .getByRole('textbox', { name: 'Description' })
        .fill('Part description updated')
      await page.getByRole('button', { name: 'Submit' }).click()

      await expect(page).toHaveURL(/\/admin\/parts\/\d+$/)
      await expect(
        page.getByText(updatedPartName, { exact: true })
      ).toBeVisible()
      await page.getByRole('link', { name: 'Edit' }).click()
      await expect(
        page.getByRole('spinbutton', { name: 'Display Order' })
      ).toHaveValue('0')
      const memberPicker = page.getByRole('group', {
        name: 'Members',
        exact: true,
      })
      await expect(memberPicker.getByRole('button')).toHaveCount(0)
      await memberPicker
        .getByRole('textbox', { name: 'Search name' })
        .fill('Member')
      await memberPicker.getByRole('button', { name: /Member/ }).click()
      await memberPicker
        .getByRole('textbox', { name: 'Search name' })
        .fill('no-match')
      await expect(
        memberPicker.getByRole('button', { name: /Remove/ })
      ).toHaveCount(1)
      await page.getByRole('button', { name: 'Submit' }).click()
      await page.getByRole('link', { name: 'Edit' }).click()
      await expect(
        page
          .getByRole('group', { name: 'Members', exact: true })
          .getByRole('button', { name: /Remove/ })
      ).toHaveCount(1)
    })
  })

  test.describe('delete', () => {
    test('deletes a newly created part', async ({ page }) => {
      const partName = `CRUD Part ${Date.now().toString()}`

      await createPart(page, partName)
      await page.getByRole('link', { name: partName }).click()

      await openDeleteModalAndConfirm(page)
      await expect(page).toHaveURL(/\/admin\/parts$/)
      await expect(page.getByRole('link', { name: partName })).toHaveCount(0)
    })
  })
})
