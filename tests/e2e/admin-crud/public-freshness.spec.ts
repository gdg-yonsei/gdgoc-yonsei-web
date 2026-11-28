import { expect, test } from '@playwright/test'
import { readSeededData } from '../helpers/read-seeded-data'
import { ADMIN_STORAGE_STATE } from '../setup/constants'
import { openDeleteModalAndConfirm, setHiddenInputValue } from './helpers'

type SeededData = Awaited<ReturnType<typeof readSeededData>>

test.use({ storageState: ADMIN_STORAGE_STATE })
const adminSessionsListPath = /\/(?:en|ko)\/admin\/sessions$/

// 빌드 때 prerender한 기수 페이지가 관리자 수정 뒤에도 빌드 시점 목록을 보여 주지 않는지 확인한다.
// (프로젝트는 projects.spec.ts의 캐시 테스트가 다룬다.)
test.describe('public generation pages after admin edits', () => {
  let seededData: SeededData

  test.beforeAll(async () => {
    seededData = await readSeededData()
  })

  test('a newly published session appears on its generation log', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    const sessionName = `Fresh Session ${Date.now().toString()}`
    const logPath = `/en/session/${seededData.secondGenerationName}`

    // 메타데이터는 스트리밍될 수 있으므로 문서를 끝까지 받은(load) 뒤 robots를 읽는다.
    const robots = page.locator('meta[name="robots"]')

    // 첫 방문으로 기수 기록 캐시를 데운다. 시드의 두 번째 기수 세션은 아직 끝나지 않아
    // 공개 기록이 비어 있으므로 색인 제외(noindex)여야 한다.
    await page.goto(logPath, { waitUntil: 'load' })
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: `${seededData.secondGenerationName} Sessions`,
      })
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: sessionName })).toHaveCount(
      0
    )
    await expect(robots).toHaveAttribute('content', /noindex/)

    await page.goto('/admin/sessions/create', {
      waitUntil: 'domcontentloaded',
    })
    await page.locator('input[name="name"]').fill(sessionName)
    await page
      .getByRole('tab', { name: /^(Korean|한국어)/ })
      .nth(0)
      .click()
    await page.locator('input[name="nameKo"]').fill('신선도 세션')
    await page.locator('input[name="location"]').fill('Room 301')
    await page
      .getByRole('tab', { name: /^(Korean|한국어)/ })
      .nth(1)
      .click()
    await page.locator('input[name="locationKo"]').fill('301호')
    await page.locator('textarea[name="description"]').fill('Fresh session')
    await page
      .getByRole('tab', { name: /^(Korean|한국어)/ })
      .nth(2)
      .click()
    await page.locator('textarea[name="descriptionKo"]').fill('신선도 세션')
    await page.locator('input[name="maxCapacity"]').fill('20')
    // 공개 기록은 끝난 세션만 보여 주므로 지난 날짜로 만든다.
    await page.locator('input[name="startAt"]').fill('2026-03-20T10:00')
    await page.locator('input[name="endAt"]').fill('2026-03-20T12:00')
    await page.locator('input[name="displayOnWebsite"]').check()
    await setHiddenInputValue(
      page,
      'partId',
      seededData.secondPartId.toString()
    )
    await setHiddenInputValue(
      page,
      'participantId',
      JSON.stringify([seededData.adminUserId])
    )
    await page.getByRole('button', { name: 'Submit' }).click()
    await expect(page).toHaveURL(adminSessionsListPath)

    try {
      await page.goto(logPath, { waitUntil: 'load' })
      await expect(
        page.getByRole('heading', { name: sessionName }).first()
      ).toBeVisible()
      // 첫 공개 기록이 생겼으므로 바로 색인 대상이 되어야 한다.
      await expect(robots).toHaveAttribute('content', /(^|,\s*)index/)
      await expect(robots).not.toHaveAttribute('content', /noindex/)
    } finally {
      // 두 번째 기수를 빈 기록으로 기대하는 테스트(session-log.spec.ts)가 있으므로 지운다.
      await page.goto('/admin/sessions', { waitUntil: 'domcontentloaded' })
      await page
        .locator('a[href*="/admin/sessions/"]')
        .filter({ hasText: sessionName })
        .last()
        .click()
      await openDeleteModalAndConfirm(page)
      await expect(page).toHaveURL(adminSessionsListPath)
    }

    // 삭제도 바로 반영되어 다시 빈 기록과 noindex로 돌아가야 한다.
    await page.goto(logPath, { waitUntil: 'load' })
    await expect(page.getByText('No public sessions yet')).toBeVisible()
    await expect(page.getByRole('heading', { name: sessionName })).toHaveCount(
      0
    )
    await expect(robots).toHaveAttribute('content', /noindex/)
  })

  test('a renamed member shows the new name in the member directory', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    const directoryPath = `/en/member/${seededData.generationName}`
    const editPath = `/admin/members/${seededData.memberUserId}/edit`
    const firstName = page.locator('input[name="firstName"]')

    // 첫 방문으로 기수 구성원 캐시를 데운다.
    await page.goto(directoryPath, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('region', { name: 'E2E Part' })).toBeVisible()

    await page.goto(editPath, { waitUntil: 'domcontentloaded' })
    const originalFirstName = await firstName.inputValue()
    const freshFirstName = `Fresh${Date.now().toString()}`

    try {
      await firstName.fill(freshFirstName)
      await page.getByRole('button', { name: 'Submit' }).click()
      await expect(page).toHaveURL(
        new RegExp(`/admin/members/${seededData.memberUserId}$`)
      )

      await page.goto(directoryPath, { waitUntil: 'domcontentloaded' })
      await expect(
        page
          .getByRole('region', { name: 'E2E Part' })
          .getByText(freshFirstName)
          .first()
      ).toBeVisible()
    } finally {
      // 다른 테스트가 시드 이름을 기대하므로 되돌린다.
      await page.goto(editPath, { waitUntil: 'domcontentloaded' })
      await firstName.fill(originalFirstName)
      await page.getByRole('button', { name: 'Submit' }).click()
      await expect(page).toHaveURL(
        new RegExp(`/admin/members/${seededData.memberUserId}$`)
      )
    }
  })
})
