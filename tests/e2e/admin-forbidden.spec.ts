import { expect, test } from '@playwright/test'
import { UNVERIFIED_STORAGE_STATE } from './setup/constants'

test.use({ storageState: UNVERIFIED_STORAGE_STATE })

test('an unverified account gets the 403 page inside the admin shell', async ({
  page,
}) => {
  // The admin layout streams its shell before it can call forbidden(), so
  // the response is already committed as 200; the 403 is the UI.
  await page.goto('/admin', { waitUntil: 'domcontentloaded' })

  await expect(
    page.getByRole('heading', { level: 1, name: '403 Forbidden' })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible()
})
