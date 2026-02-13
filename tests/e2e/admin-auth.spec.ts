import { expect, test } from '@playwright/test'

test('anonymous user is redirected to sign-in when visiting admin', async ({
  page,
}) => {
  await page.goto('/admin', { waitUntil: 'domcontentloaded' })

  await expect(page).toHaveURL(/\/auth\/sign-in$/)
  await expect(
    page.getByRole('button', { name: /Sign in with Github/i }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Sign in with Google/i }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Sign in with Passkey/i }),
  ).toBeVisible()
})

test('privacy policy and terms links are reachable from sign-in page', async ({
  page,
}) => {
  await page.goto('/auth/sign-in', { waitUntil: 'domcontentloaded' })

  await page.getByRole('link', { name: /Privacy Policy/i }).click()
  await expect(page).toHaveURL(/\/(en|ko)\/privacy-policy$/)

  await page.goto('/auth/sign-in', { waitUntil: 'domcontentloaded' })
  await page.getByRole('link', { name: /Terms of Service/i }).click()
  await expect(page).toHaveURL(/\/(en|ko)\/terms-of-service$/)
})
