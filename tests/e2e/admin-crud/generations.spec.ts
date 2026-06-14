import { expect, test, type Page } from '@playwright/test'
import { readSeededData } from '../helpers/read-seeded-data'
import { ADMIN_STORAGE_STATE } from '../setup/constants'
import {
  escapeRegExp,
  openDeleteModalAndCancel,
  openDeleteModalAndConfirm,
} from './helpers'

test.use({ storageState: ADMIN_STORAGE_STATE })

type SeededData = Awaited<ReturnType<typeof readSeededData>>
const adminGenerationsListPath = /\/(?:(?:en|ko)\/)?admin\/generations$/
const adminGenerationDetailPath = /\/(?:(?:en|ko)\/)?admin\/generations\/\d+$/
const adminGenerationCreatePath =
  /\/(?:(?:en|ko)\/)?admin\/generations\/create$/

async function createGeneration(page: Page, name: string) {
  await page.goto('/admin/generations/create', {
    waitUntil: 'domcontentloaded',
  })
  await page.locator('input[name="name"]').filter({ visible: true }).fill(name)
  await page
    .locator('input[name="startDate"]')
    .filter({ visible: true })
    .fill('2024-01-01')
  await page
    .locator('input[name="endDate"]')
    .filter({ visible: true })
    .fill('2024-12-31')
  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page).toHaveURL(adminGenerationsListPath, { timeout: 30_000 })
}

async function openGenerationByName(page: Page, name: string) {
  await page
    .getByRole('link', {
      name: new RegExp(`Generation: ${escapeRegExp(name)}`),
    })
    .click()
}

test.describe('generations CRUD', () => {
  let seededData: SeededData

  test.beforeAll(async () => {
    seededData = await readSeededData()
  })

  test.describe('read', () => {
    test('reads seeded generation detail page', async ({ page }) => {
      await page.goto(
        `/admin/generations/${seededData.generationId.toString()}`,
        {
          waitUntil: 'domcontentloaded',
        }
      )

      await expect(
        page.getByText(`Generation: ${seededData.generationName}`, {
          exact: true,
        })
      ).toBeVisible()
    })
  })

  test.describe('update', () => {
    test('updates a newly created generation', async ({ page }) => {
      test.setTimeout(150_000)

      const generationName = `crud-generation-${Date.now().toString()}`
      const updatedName = `${generationName}-updated`

      await createGeneration(page, generationName)
      await openGenerationByName(page, generationName)
      await expect(
        page.getByText(`Generation: ${generationName}`, { exact: true })
      ).toBeVisible()

      await page.getByRole('link', { name: 'Edit' }).click()
      await page
        .locator('input[name="name"]')
        .filter({ visible: true })
        .fill(updatedName)
      await page
        .locator('input[name="endDate"]')
        .filter({ visible: true })
        .fill('2028-01-01')
      await page.getByRole('button', { name: 'Submit' }).click()

      await expect(page).toHaveURL(adminGenerationDetailPath, {
        timeout: 30_000,
      })
      await expect(
        page.getByText(`Generation: ${updatedName}`, { exact: true })
      ).toBeVisible()

      await openDeleteModalAndConfirm(page)
      await expect(page).toHaveURL(adminGenerationsListPath, {
        timeout: 30_000,
      })
      await expect(
        page.getByRole('link', {
          name: new RegExp(`Generation: ${escapeRegExp(updatedName)}`),
        })
      ).toHaveCount(0)
    })

    test('shows validation error for invalid date range', async ({ page }) => {
      await page.goto('/admin/generations/create', {
        waitUntil: 'domcontentloaded',
      })
      await page
        .locator('input[name="name"]')
        .filter({ visible: true })
        .fill('invalid-range-generation')
      await page
        .locator('input[name="startDate"]')
        .filter({ visible: true })
        .fill('2029-12-31')
      await page
        .locator('input[name="endDate"]')
        .filter({ visible: true })
        .fill('2029-01-01')
      await page.getByRole('button', { name: 'Submit' }).click()

      await expect(
        page.getByText('The end date must be later than the start date.')
      ).toBeVisible()
      await expect(page).toHaveURL(adminGenerationCreatePath, {
        timeout: 30_000,
      })
    })
  })

  test.describe('delete', () => {
    test('deletes generation after cancel/confirm flow', async ({ page }) => {
      const generationName = `crud-generation-${Date.now().toString()}`

      await createGeneration(page, generationName)
      await openGenerationByName(page, generationName)

      await openDeleteModalAndCancel(page)
      await expect(
        page.getByText(`Generation: ${generationName}`, { exact: true })
      ).toBeVisible()

      await openDeleteModalAndConfirm(page)
      await expect(page).toHaveURL(adminGenerationsListPath, {
        timeout: 30_000,
      })
      await expect(
        page.getByRole('link', {
          name: new RegExp(`Generation: ${escapeRegExp(generationName)}`),
        })
      ).toHaveCount(0)
    })
  })
})
