import { expect, test } from '@playwright/test'
import { MEMBER_STORAGE_STATE } from './setup/constants'

test.use({ storageState: MEMBER_STORAGE_STATE })

// CI와 로컬 e2e에는 Search Console 자격 증명이 없으므로 설정 안내가 보여야 한다.
test('the search tab explains how to connect Search Console', async ({
  page,
}) => {
  await page.goto('/admin/analytics/search')
  await expect(
    page.getByRole('heading', { name: 'Connect Google Search Console' })
  ).toBeVisible()
  await expect(
    page.getByText('GSC_CLIENT_EMAIL', { exact: false })
  ).toBeVisible()
})
