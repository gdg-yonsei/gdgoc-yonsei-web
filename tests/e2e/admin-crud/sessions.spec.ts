import { expect, test, type Page } from '@playwright/test'
import { readSeededData } from '../helpers/read-seeded-data'
import { ADMIN_STORAGE_STATE } from '../setup/constants'
import { openDeleteModalAndConfirm, setHiddenInputValue } from './helpers'

type SeededData = Awaited<ReturnType<typeof readSeededData>>

test.use({ storageState: ADMIN_STORAGE_STATE })
const localizedSessionsListPath = /\/(?:en|ko)\/admin\/sessions$/

async function createSession(
  page: Page,
  sessionName: string,
  seededData: SeededData
) {
  await page.goto('/admin/sessions/create', { waitUntil: 'domcontentloaded' })
  await page.locator('input[name="name"]').fill(sessionName)
  await page.getByRole('button', { name: /^(Korean|한국어)$/ }).nth(0).click()
  await page.locator('input[name="nameKo"]').fill('CRUD 세션')
  await page.locator('input[name="location"]').fill('Room 501')
  await page.getByRole('button', { name: /^(Korean|한국어)$/ }).nth(1).click()
  await page.locator('input[name="locationKo"]').fill('501호')
  await page.locator('textarea[name="description"]').fill('Session description')
  await page.getByRole('button', { name: /^(Korean|한국어)$/ }).nth(2).click()
  await page.locator('textarea[name="descriptionKo"]').fill('세션 설명입니다.')
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
  await expect(page).toHaveURL(localizedSessionsListPath)
}

test.describe('sessions CRUD', () => {
  let seededData: SeededData

  test.beforeAll(async () => {
    seededData = await readSeededData()
  })

  test.describe('read', () => {
    test('reads seeded session detail page', async ({ page }) => {
      await page.goto(`/admin/sessions/${seededData.sessionId}`, {
        waitUntil: 'domcontentloaded',
      })

      await expect(
        page.getByText('E2E Session', { exact: true }).first()
      ).toBeVisible()
    })
  })

  test.describe('update', () => {
    test('updates a newly created session', async ({ page }) => {
      const sessionName = `CRUD Session ${Date.now().toString()}`
      const updatedSessionName = `${sessionName} Updated`

      await createSession(page, sessionName, seededData)
      await page.getByRole('link', { name: sessionName }).click()
      await expect(page.getByText(sessionName, { exact: true })).toBeVisible()

      await page.getByRole('link', { name: 'Edit' }).click()
      await page.locator('input[name="name"]').fill(updatedSessionName)
      await page.getByRole('button', { name: 'Submit' }).click()

      await expect(
        page.getByText(updatedSessionName, { exact: true }).first()
      ).toBeVisible()
    })
  })

  test.describe('delete', () => {
    test('deletes a newly created session', async ({ page }) => {
      const sessionName = `CRUD Session ${Date.now().toString()}`

      await createSession(page, sessionName, seededData)
      await page.getByRole('link', { name: sessionName }).click()

      await openDeleteModalAndConfirm(page)
      await expect(page).toHaveURL(localizedSessionsListPath)
      await expect(page.getByRole('link', { name: sessionName })).toHaveCount(0)
    })
  })
})
