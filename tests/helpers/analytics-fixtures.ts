/** 분석 쿼리 테스트용으로 세션·조회·이벤트 행을 짧게 만든다. 기본값은 직접 방문한 서울 데스크톱 사용자다. */
import type { PGlite } from '@electric-sql/pglite'

export type FixtureView = {
  path: string
  at: string
  engagementMs?: number
  scroll?: number
  title?: string
  isNotFound?: boolean
}

export type FixtureEvent = {
  name: string
  at: string
  viewIndex?: number
  label?: string
  targetUrl?: string
  metric?: string
  rating?: string
  value?: number
}

export type FixtureSession = {
  id: string
  visitorId: string
  startedAt: string
  isNewVisitor?: boolean
  isInternal?: boolean
  channel?: string
  referrerHost?: string | null
  utmSource?: string | null
  utmMedium?: string | null
  utmCampaign?: string | null
  deviceType?: string
  browser?: string
  os?: string
  country?: string
  language?: string
  screen?: [number, number]
  views?: FixtureView[]
  events?: FixtureEvent[]
}

let counter = 0
function nextUuid() {
  counter += 1
  return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`
}

/** 시각은 'YYYY-MM-DD HH:MM:SS'(UTC). 조회 순번은 배열 순서로 매긴다. */
export async function insertSession(
  client: PGlite,
  session: FixtureSession
): Promise<void> {
  const views = session.views ?? [{ path: '/ko', at: session.startedAt }]
  const lastSeen = views.at(-1)?.at ?? session.startedAt
  await client.query(
    `insert into analytics_sessions (id, "visitorId", "startedAt", "lastSeenAt", "isNewVisitor", "isInternal",
      "landingPath", "referrerHost", "utmSource", "utmMedium", "utmCampaign", channel, "deviceType", browser, os,
      "screenWidth", "screenHeight", language, timezone, country)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'Asia/Seoul',$19)`,
    [
      session.id,
      session.visitorId,
      session.startedAt,
      lastSeen,
      session.isNewVisitor ?? true,
      session.isInternal ?? false,
      views[0]!.path,
      session.referrerHost ?? null,
      session.utmSource ?? null,
      session.utmMedium ?? null,
      session.utmCampaign ?? null,
      session.channel ?? 'Direct',
      session.deviceType ?? 'desktop',
      session.browser ?? 'Chrome',
      session.os ?? 'macOS',
      session.screen?.[0] ?? 1440,
      session.screen?.[1] ?? 900,
      session.language ?? 'ko-KR',
      session.country ?? 'KR',
    ]
  )
  const viewIds: string[] = []
  for (const [index, view] of views.entries()) {
    const id = nextUuid()
    viewIds.push(id)
    await client.query(
      `insert into analytics_page_views (id, "sessionId", "visitorId", "occurredAt", sequence, path, locale, title,
        "isNotFound", "engagementMs", "maxScrollPercent")
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        id,
        session.id,
        session.visitorId,
        view.at,
        index + 1,
        view.path,
        view.path.split('/')[1] === 'en' ? 'en' : 'ko',
        view.title ?? null,
        view.isNotFound ?? false,
        view.engagementMs ?? 0,
        view.scroll ?? 0,
      ]
    )
  }
  for (const event of session.events ?? []) {
    await client.query(
      `insert into analytics_events ("sessionId", "pageViewId", "occurredAt", name, path, label, "targetUrl",
        metric, rating, value)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        session.id,
        viewIds[event.viewIndex ?? 0],
        event.at,
        event.name,
        views[event.viewIndex ?? 0]!.path,
        event.label ?? null,
        event.targetUrl ?? null,
        event.metric ?? null,
        event.rating ?? null,
        event.value ?? null,
      ]
    )
  }
}
