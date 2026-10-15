import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import postgres from 'postgres'
import {
  MEMBER_STORAGE_STATE,
  UNVERIFIED_STORAGE_STATE,
} from './setup/constants'

test.describe('member', () => {
  test.use({ storageState: MEMBER_STORAGE_STATE })

  test('sees collected visits on every analytics tab', async ({ page }) => {
    const sql = postgres(process.env.AUTH_DRIZZLE_URL!, { max: 1 })
    const sessionId = randomUUID()
    const visitorId = randomUUID()
    try {
      await sql`
        insert into analytics_sessions (id, "visitorId", "startedAt", "lastSeenAt", "isNewVisitor", "isInternal",
          "landingPath", "referrerHost", channel, "deviceType", browser, os, country)
        values (${sessionId}, ${visitorId}, now() at time zone 'utc' - interval '1 hour', now() at time zone 'utc',
          true, false, '/ko/e2e-analytics', 'google.com', 'Organic Search', 'mobile', 'Safari', 'iOS', 'KR')`
      await sql`
        insert into analytics_page_views (id, "sessionId", "visitorId", "occurredAt", sequence, path, locale, title,
          "engagementMs", "maxScrollPercent")
        values (${randomUUID()}, ${sessionId}, ${visitorId}, now() at time zone 'utc' - interval '1 hour', 1,
          '/ko/e2e-analytics', 'ko', 'E2E 분석 | GDGoC Yonsei', 30000, 80)`

      await page.goto('/admin/analytics?range=7d')
      await expect(
        page.getByRole('heading', { level: 1, name: 'Analytics' })
      ).toBeVisible()
      await expect(page.getByRole('figure', { name: 'Trend' })).toBeVisible()

      for (const [tab, marker] of [
        ['Acquisition', 'Sessions by channel'],
        ['Engagement', 'E2E 분석'],
        ['Audience', 'Weekly retention'],
        ['Performance', 'Core Web Vitals (75th percentile)'],
        ['Explore', 'Break down by'],
      ] as const) {
        await page.getByRole('link', { name: tab }).click()
        await expect(page.getByText(marker).first()).toBeVisible()
        await expect(page).toHaveURL(/range=7d/)
      }

      await page.getByRole('link', { name: 'Engagement' }).click()
      const download = page.waitForEvent('download')
      await page.getByRole('link', { name: 'Download CSV' }).first().click()
      expect((await download).suggestedFilename()).toBe(
        'gdgoc-analytics-pages.csv'
      )
    } finally {
      await sql`delete from analytics_sessions where id = ${sessionId}`
      await sql.end()
    }
  })
})

test.describe('unverified', () => {
  test.use({ storageState: UNVERIFIED_STORAGE_STATE })

  test('cannot open analytics', async ({ page }) => {
    await page.goto('/admin/analytics', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', { level: 1, name: '403 Forbidden' })
    ).toBeVisible()
  })
})
