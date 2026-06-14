import { expect, test } from '@playwright/test'

test('anonymous user is redirected to sign-in when visiting admin', async ({
  page,
}) => {
  test.setTimeout(60_000)

  await page.goto('/admin', { waitUntil: 'domcontentloaded' })

  await expect(page).toHaveURL(/\/auth\/sign-in$/, { timeout: 30_000 })
  await expect(
    page.getByRole('button', { name: /Sign in with Github/i })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Sign in with Google/i })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /Sign in with Passkey/i })
  ).toBeVisible()
})

test('privacy policy and terms links are reachable from sign-in page', async ({
  page,
}) => {
  test.setTimeout(90_000)

  await page.goto('/auth/sign-in', { waitUntil: 'domcontentloaded' })

  const privacyHref = await page
    .getByRole('link', { name: /Privacy Policy/i })
    .getAttribute('href')
  if (!privacyHref) {
    throw new Error('Missing privacy policy href')
  }
  expect(privacyHref).toBe('/privacy-policy')

  await page.goto(privacyHref, { waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('heading', {
      name: /Website Privacy Policy|개인정보처리방침/i,
    })
  ).toBeVisible({ timeout: 45_000 })

  await page.goto('/auth/sign-in', { waitUntil: 'domcontentloaded' })

  const termsHref = await page
    .getByRole('link', { name: /Terms of Service/i })
    .getAttribute('href')
  if (!termsHref) {
    throw new Error('Missing terms of service href')
  }
  expect(termsHref).toBe('/terms-of-service')

  await page.goto(termsHref, { waitUntil: 'domcontentloaded' })
  await expect(
    page.getByRole('heading', {
      name: /Website Terms of Service|웹사이트 이용약관/i,
    })
  ).toBeVisible({ timeout: 45_000 })
})
