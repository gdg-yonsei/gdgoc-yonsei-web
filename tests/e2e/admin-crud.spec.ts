import { expect, test, type Page } from '@playwright/test'
import { readSeededData } from './helpers/read-seeded-data'
import { ADMIN_STORAGE_STATE } from './setup/constants'

type SeededData = Awaited<ReturnType<typeof readSeededData>>

test.use({ storageState: ADMIN_STORAGE_STATE })
test.describe.configure({ mode: 'serial' })

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function setHiddenInputValue(page: Page, name: string, value: string) {
  await page.evaluate(
    ({ inputName, inputValue }) => {
      const input = document.querySelector(
        `input[name="${inputName}"]`
      ) as HTMLInputElement | null

      if (!input) {
        throw new Error(`Input not found: ${inputName}`)
      }

      input.value = inputValue
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },
    {
      inputName: name,
      inputValue: value,
    }
  )
}

async function openDeleteModalAndConfirm(page: Page) {
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(
    page.getByText('Are you sure you want to delete this data?')
  ).toBeVisible()
  await page.getByRole('button', { name: 'Confirm' }).click()
}

async function openDeleteModalAndCancel(page: Page) {
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(
    page.getByText('Are you sure you want to delete this data?')
  ).toBeVisible()
  await page.getByRole('button', { name: 'Cancel' }).click()
}

test.describe('admin CRUD flows', () => {
  let seededData: SeededData

  test.beforeAll(async () => {
    seededData = await readSeededData()
  })

  test('generation CRUD with delete cancel/confirm', async ({ page }) => {
    const generationName = `crud-generation-${Date.now().toString()}`
    const updatedName = `${generationName}-updated`

    await page.goto('/admin/generations/create', { waitUntil: 'domcontentloaded' })
    await page.locator('input[name="name"]').fill(generationName)
    await page.locator('input[name="startDate"]').fill('2027-01-01')
    await page.locator('input[name="endDate"]').fill('2027-12-31')
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page).toHaveURL(/\/admin\/generations$/)

    await page
      .getByRole('link', {
        name: new RegExp(`Generation: ${escapeRegExp(generationName)}`),
      })
      .click()

    await expect(
      page.getByText(`Generation: ${generationName}`, { exact: true })
    ).toBeVisible()

    await page.getByRole('link', { name: 'Edit' }).click()
    await page.locator('input[name="name"]').fill(updatedName)
    await page.locator('input[name="endDate"]').fill('2028-01-01')
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page).toHaveURL(/\/admin\/generations\/\d+$/)
    await expect(
      page.getByText(`Generation: ${updatedName}`, { exact: true })
    ).toBeVisible()

    await openDeleteModalAndCancel(page)
    await expect(
      page.getByText(`Generation: ${updatedName}`, { exact: true })
    ).toBeVisible()

    await openDeleteModalAndConfirm(page)
    await expect(page).toHaveURL(/\/admin\/generations$/)
    await expect(
      page.getByRole('link', {
        name: new RegExp(`Generation: ${escapeRegExp(updatedName)}`),
      })
    ).toHaveCount(0)
  })

  test('part CRUD', async ({ page }) => {
    const partName = `CRUD Part ${Date.now().toString()}`
    const updatedPartName = `${partName} Updated`

    await page.goto('/admin/parts/create', { waitUntil: 'domcontentloaded' })
    await page.locator('input[name="name"]').fill(partName)
    await page
      .locator('textarea[name="description"]')
      .fill('Part description for CRUD e2e test')
    await page.getByRole('button', { name: seededData.generationName }).click()
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page).toHaveURL(/\/admin\/parts$/)
    await page.getByRole('link', { name: partName }).click()
    await expect(page.getByText(updatedPartName)).toHaveCount(0)

    await page.getByRole('link', { name: 'Edit' }).click()
    await page.locator('input[name="name"]').fill(updatedPartName)
    await page
      .locator('textarea[name="description"]')
      .fill('Part description updated')
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page).toHaveURL(/\/admin\/parts\/\d+$/)
    await expect(page.getByText(updatedPartName, { exact: true })).toBeVisible()

    await openDeleteModalAndConfirm(page)
    await expect(page).toHaveURL(/\/admin\/parts$/)
    await expect(page.getByRole('link', { name: updatedPartName })).toHaveCount(0)
  })

  test('project CRUD', async ({ page }) => {
    const projectName = `CRUD Project ${Date.now().toString()}`
    const updatedProjectName = `${projectName} Updated`

    await page.goto('/admin/projects/create', { waitUntil: 'domcontentloaded' })
    await page.locator('input[name="name"]').fill(projectName)
    await page.locator('input[name="nameKo"]').fill('CRUD 프로젝트')
    await page
      .locator('textarea[name="description"]')
      .fill('One-line description for project')
    await page.locator('textarea[name="descriptionKo"]').fill('프로젝트 한 줄 설명')
    await page.locator('textarea[name="content"]').fill('## Project English Content')
    await page.locator('textarea[name="contentKo"]').fill('## 프로젝트 한국어 내용')
    await page.getByRole('button', { name: seededData.generationName }).click()

    await page.getByRole('button', { name: 'Open' }).first().click()
    await page.getByRole('button', { name: '테스터관리' }).click()

    await setHiddenInputValue(
      page,
      'mainImage',
      '/project-default.png'
    )
    await setHiddenInputValue(
      page,
      'contentImages',
      JSON.stringify(['/project-default.png'])
    )

    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page).toHaveURL(/\/admin\/projects$/)
    await page.getByRole('link', { name: projectName }).click()
    await expect(page.getByText(projectName, { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Edit' }).click()
    await page.locator('input[name="name"]').fill(updatedProjectName)
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(
      page.getByText(updatedProjectName, { exact: true }).first()
    ).toBeVisible()

    await openDeleteModalAndConfirm(page)
    await expect(page).toHaveURL(/\/admin\/projects$/)
    await expect(page.getByRole('link', { name: updatedProjectName })).toHaveCount(
      0
    )
  })

  test('session CRUD', async ({ page }) => {
    const sessionName = `CRUD Session ${Date.now().toString()}`
    const updatedSessionName = `${sessionName} Updated`

    await page.goto('/admin/sessions/create', { waitUntil: 'domcontentloaded' })
    await page.locator('input[name="name"]').fill(sessionName)
    await page.locator('input[name="nameKo"]').fill('CRUD 세션')
    await page.locator('input[name="location"]').fill('Room 501')
    await page.locator('input[name="locationKo"]').fill('501호')
    await page.locator('textarea[name="description"]').fill('Session description')
    await page
      .locator('textarea[name="descriptionKo"]')
      .fill('세션 설명입니다.')
    await page.locator('input[name="maxCapacity"]').fill('20')
    await page.locator('input[name="startAt"]').fill('2027-03-20T10:00')
    await page.locator('input[name="endAt"]').fill('2027-03-20T12:00')

    await setHiddenInputValue(page, 'partId', seededData.partId.toString())
    await setHiddenInputValue(
      page,
      'participantId',
      JSON.stringify([seededData.memberUserId])
    )

    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(page).toHaveURL(/\/admin\/sessions$/)
    await page.getByRole('link', { name: sessionName }).click()
    await expect(page.getByText(sessionName, { exact: true })).toBeVisible()

    await page.getByRole('link', { name: 'Edit' }).click()
    await page.locator('input[name="name"]').fill(updatedSessionName)
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(
      page.getByText(updatedSessionName, { exact: true }).first()
    ).toBeVisible()

    await openDeleteModalAndConfirm(page)
    await expect(page).toHaveURL(/\/admin\/sessions$/)
    await expect(page.getByRole('link', { name: updatedSessionName })).toHaveCount(
      0
    )
  })

  test('member update + approve/delete pending members', async ({ page }) => {
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
    await expect(page.getByText('e2e-pending-approve', { exact: true })).toHaveCount(
      0
    )

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
    await expect(page.getByText('e2e-pending-delete', { exact: true })).toHaveCount(
      0
    )
  })

  test('generation create validation error is shown for invalid date range', async ({
    page,
  }) => {
    await page.goto('/admin/generations/create', { waitUntil: 'domcontentloaded' })
    await page.locator('input[name="name"]').fill('invalid-range-generation')
    await page.locator('input[name="startDate"]').fill('2029-12-31')
    await page.locator('input[name="endDate"]').fill('2029-01-01')
    await page.getByRole('button', { name: 'Submit' }).click()

    await expect(
      page.getByText('The end date must be later than the start date.')
    ).toBeVisible()
    await expect(page).toHaveURL(/\/admin\/generations\/create$/)
  })
})
