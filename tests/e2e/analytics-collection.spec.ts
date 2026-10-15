import { randomUUID } from 'node:crypto'
import { expect, test, type Page } from '@playwright/test'
import postgres from 'postgres'

// Playwright 브라우저는 navigator.webdriver가 true라 수집기가 꺼진다. 이 스펙에서만 사람 방문처럼 보이게 한다.
async function behaveLikeAVisitor(page: Page, visitorId: string) {
  await page.addInitScript((id) => {
    Object.defineProperty(Navigator.prototype, 'webdriver', {
      get: () => false,
    })
    if (
      !localStorage.getItem('gyms_vid') &&
      !localStorage.getItem('gyms_optout')
    ) {
      localStorage.setItem('gyms_vid', id)
    }
  }, visitorId)
}

function database() {
  return postgres(process.env.AUTH_DRIZZLE_URL!, { max: 1 })
}

test('a public visit is stored and the opt-out stops collection', async ({
  page,
}) => {
  const visitorId = randomUUID()
  const sql = database()
  const countViews = async () =>
    (
      await sql<{ count: number }[]>`
      select count(*)::int as count from analytics_page_views where "visitorId" = ${visitorId}
    `
    )[0]!.count

  try {
    await behaveLikeAVisitor(page, visitorId)

    const beacon = page.waitForRequest(
      (request) =>
        request.url().endsWith('/api/pulse') && request.method() === 'POST'
    )
    await page.goto('/ko')
    await beacon
    await expect.poll(countViews).toBe(1)

    await page.goto('/ko/privacy-policy')
    await expect.poll(countViews).toBe(2)

    const [session] = await sql<{ isInternal: boolean; landingPath: string }[]>`
      select "isInternal", "landingPath" from analytics_sessions where "visitorId" = ${visitorId}
    `
    expect(session).toEqual({ isInternal: false, landingPath: '/ko' })

    await page.getByRole('button', { name: '수집 거부' }).click()
    await expect(
      page.getByRole('status').filter({ hasText: '거부했습니다' })
    ).toBeVisible()

    await page.goto('/ko/session')
    await page.waitForTimeout(1_000)
    expect(await countViews()).toBe(2)
  } finally {
    await sql.end()
  }
})
