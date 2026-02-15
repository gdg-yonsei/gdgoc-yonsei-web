import { expect, test } from '@playwright/test'
import { readSeededData } from '../helpers/read-seeded-data'
import { ADMIN_STORAGE_STATE } from '../setup/constants'

type SeededData = Awaited<ReturnType<typeof readSeededData>>

test.use({ storageState: ADMIN_STORAGE_STATE })

test.describe('members update/approve/delete', () => {
  let seededData: SeededData

  test.beforeAll(async () => {
    seededData = await readSeededData()
  })

  test.describe('read', () => {
    test('reads seeded member detail page', async ({ page }) => {
      await page.goto(`/admin/members/${seededData.memberUserId}`, {
        waitUntil: 'domcontentloaded',
      })

      await expect(page.getByText('Tester Member', { exact: true })).toBeVisible()
    })
  })

  test.describe('update', () => {
    test('updates member profile and approves pending member', async ({ page }) => {
      await page.goto(`/admin/members/${seededData.memberUserId}/edit`, {
        waitUntil: 'domcontentloaded',
      })
      await page.locator('input[name="firstName"]').fill('CRUD')
      await page.locator('input[name="telephone"]').fill('01012341234')
      await page.getByRole('button', { name: 'Submit' }).click()

      await expect(page).toHaveURL(
        new RegExp(`/admin/members/${seededData.memberUserId}$`)
      )
      await expect(page.getByText('Tester CRUD', { exact: true })).toBeVisible()

      await page.goto('/admin/members/accept', { waitUntil: 'domcontentloaded' })

      const approveForm = page
        .locator('form')
        .filter({
          has: page.locator(
            `input[name="userId"][value="${seededData.pendingApproveUserId}"]`
          ),
        })
        .filter({
          has: page.getByRole('button', { name: 'Core' }),
        })
        .first()

      await expect(approveForm).toBeVisible()
      await approveForm.getByRole('button', { name: 'Core' }).click()
      await approveForm.getByRole('button', { name: 'Submit' }).click()
      await expect(
        page.getByText('e2e-pending-approve', { exact: true })
      ).toHaveCount(0)
    })
  })

  test.describe('delete', () => {
    test('deletes pending member from approve page', async ({ page }) => {
      await page.goto('/admin/members/accept', { waitUntil: 'domcontentloaded' })

      const deleteForm = page
        .locator('form')
        .filter({
          has: page.locator(
            `input[name="userId"][value="${seededData.pendingDeleteUserId}"]`
          ),
        })
        .filter({
          has: page.getByRole('button', { name: 'Delete' }),
        })
        .first()

      await expect(deleteForm).toBeVisible()
      await deleteForm.getByRole('button', { name: 'Delete' }).click()
      await expect(
        page.getByText('e2e-pending-delete', { exact: true })
      ).toHaveCount(0)
    })
  })
})
