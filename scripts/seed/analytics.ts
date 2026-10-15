/**
 * 개발 중 대시보드를 볼 수 있게 가상 방문 데이터를 만든다. 같은 seed면 같은 결과다.
 * 방문자 ID는 SEED_VISITOR_PREFIX로 시작해, 시드를 다시 돌릴 때 이 행만 골라 지운다.
 */
import type {
  analyticsEvents,
  analyticsPageViews,
  analyticsSessions,
} from '../../db/schema/analytics'

export const SEED_VISITOR_PREFIX = 'de5eed00'

type SessionRow = typeof analyticsSessions.$inferInsert & {
  id: string
  visitorId: string
  startedAt: Date
}
type PageViewRow = typeof analyticsPageViews.$inferInsert & {
  id: string
  sessionId: string
  sequence: number
}
type EventRow = Omit<typeof analyticsEvents.$inferInsert, 'id'> & {
  sessionId: string
  pageViewId: string
}

// mulberry32: 작고 결정적인 의사 난수.
function random(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(next: () => number, weighted: Array<[T, number]>): T {
  const total = weighted.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = next() * total
  for (const [value, weight] of weighted) {
    roll -= weight
    if (roll <= 0) return value
  }
  return weighted.at(-1)![0]
}

function uuid(prefix: string, n: number) {
  const hex = n.toString(16).padStart(24, '0')
  return `${prefix}-${hex.slice(0, 4)}-4${hex.slice(5, 8)}-8${hex.slice(9, 12)}-${hex.slice(12, 24)}`
}

const SOURCES: Array<
  [
    {
      channel: string
      referrerHost: string | null
      utmSource: string | null
      utmMedium: string | null
    },
    number,
  ]
> = [
  [
    { channel: 'Direct', referrerHost: null, utmSource: null, utmMedium: null },
    30,
  ],
  [
    {
      channel: 'Organic Search',
      referrerHost: 'google.com',
      utmSource: null,
      utmMedium: null,
    },
    22,
  ],
  [
    {
      channel: 'Organic Search',
      referrerHost: 'm.search.naver.com',
      utmSource: null,
      utmMedium: null,
    },
    14,
  ],
  [
    {
      channel: 'Organic Social',
      referrerHost: 'l.instagram.com',
      utmSource: null,
      utmMedium: null,
    },
    12,
  ],
  [
    {
      channel: 'Organic Social',
      referrerHost: 'everytime.kr',
      utmSource: null,
      utmMedium: null,
    },
    8,
  ],
  [
    {
      channel: 'AI Assistants',
      referrerHost: 'chatgpt.com',
      utmSource: 'chatgpt.com',
      utmMedium: null,
    },
    4,
  ],
  [
    {
      channel: 'Referral',
      referrerHost: 'velog.io',
      utmSource: null,
      utmMedium: null,
    },
    5,
  ],
  [
    {
      channel: 'Campaign',
      referrerHost: null,
      utmSource: 'poster',
      utmMedium: 'qr',
    },
    5,
  ],
]

const DEVICES: Array<
  [
    {
      deviceType: string
      browser: string
      os: string
      screen: [number, number]
    },
    number,
  ]
> = [
  [
    { deviceType: 'mobile', browser: 'Safari', os: 'iOS', screen: [390, 844] },
    30,
  ],
  [
    {
      deviceType: 'mobile',
      browser: 'KakaoTalk',
      os: 'iOS',
      screen: [393, 852],
    },
    12,
  ],
  [
    {
      deviceType: 'mobile',
      browser: 'Samsung Internet',
      os: 'Android',
      screen: [412, 915],
    },
    12,
  ],
  [
    {
      deviceType: 'desktop',
      browser: 'Chrome',
      os: 'macOS',
      screen: [1512, 982],
    },
    25,
  ],
  [
    {
      deviceType: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
      screen: [1920, 1080],
    },
    15,
  ],
  [
    {
      deviceType: 'tablet',
      browser: 'Safari',
      os: 'iPadOS',
      screen: [820, 1180],
    },
    6,
  ],
]

// 저녁(서울 19~23시)과 평일에 방문이 몰리는 동아리 사이트 모양.
const HOUR_WEIGHTS: Array<[number, number]> = Array.from(
  { length: 24 },
  (_, hour) => [
    hour,
    hour >= 19 && hour <= 23 ? 6 : hour >= 9 && hour <= 18 ? 3 : 1,
  ]
)

export function buildAnalyticsSeed(options: {
  now: Date
  days: number
  seed: number
  paths: string[]
}) {
  const next = random(options.seed)
  const sessions: SessionRow[] = []
  const pageViews: PageViewRow[] = []
  const events: EventRow[] = []
  const visitorCount = options.days * 8
  let sessionCounter = 0
  let viewCounter = 0
  const dayMs = 24 * 3600 * 1000

  for (let visitor = 1; visitor <= visitorCount; visitor += 1) {
    const visitorId = uuid(SEED_VISITOR_PREFIX, visitor)
    const visits = next() < 0.25 ? 2 + Math.floor(next() * 3) : 1
    const device = pick(next, DEVICES)
    let dayOffset = Math.floor(next() * options.days)

    for (let visit = 0; visit < visits && dayOffset >= 0; visit += 1) {
      const hour = pick(next, HOUR_WEIGHTS)
      const dayStartSeoul =
        Math.floor((options.now.getTime() + 9 * 3600 * 1000) / dayMs) * dayMs -
        9 * 3600 * 1000
      const startedAt = new Date(
        dayStartSeoul -
          dayOffset * dayMs +
          hour * 3600 * 1000 +
          Math.floor(next() * 3600) * 1000
      )
      if (startedAt > options.now) {
        dayOffset -= 1
        continue
      }
      sessionCounter += 1
      const sessionId = uuid('5e551000', sessionCounter)
      const source = visit === 0 ? pick(next, SOURCES) : SOURCES[0]![0]
      const viewTotal = next() < 0.45 ? 1 : 2 + Math.floor(next() * 4)
      let at = startedAt.getTime()

      sessions.push({
        id: sessionId,
        visitorId,
        startedAt,
        lastSeenAt: startedAt,
        isNewVisitor: visit === 0,
        isInternal: false,
        landingPath: '',
        referrerHost: source.referrerHost,
        referrerPath: source.referrerHost ? '/' : null,
        utmSource: source.utmSource,
        utmMedium: source.utmMedium,
        utmCampaign: source.channel === 'Campaign' ? 'recruit-2026' : null,
        utmTerm: null,
        utmContent: null,
        channel: source.channel,
        deviceType: device.deviceType,
        browser: device.browser,
        os: device.os,
        screenWidth: device.screen[0],
        screenHeight: device.screen[1],
        language: next() < 0.85 ? 'ko-KR' : 'en-US',
        timezone: 'Asia/Seoul',
        country: next() < 0.95 ? 'KR' : 'US',
      })
      const session = sessions.at(-1)!

      for (let sequence = 1; sequence <= viewTotal; sequence += 1) {
        viewCounter += 1
        const id = uuid('9a9e0000', viewCounter)
        const path = options.paths[Math.floor(next() * options.paths.length)]!
        const engagementMs = Math.round(2_000 + next() * 90_000)
        pageViews.push({
          id,
          sessionId,
          visitorId,
          occurredAt: new Date(at),
          sequence,
          path,
          locale: path.split('/')[1] === 'en' ? 'en' : 'ko',
          title: `${path} | GDGoC Yonsei`,
          isNotFound: false,
          engagementMs,
          maxScrollPercent: Math.min(100, Math.round(20 + next() * 90)),
        })
        if (sequence === 1) session.landingPath = path
        const lcp = Math.round(1200 + next() * next() * 4000)
        events.push({
          sessionId,
          pageViewId: id,
          occurredAt: new Date(at + 1500),
          name: 'web_vital',
          path,
          metric: 'LCP',
          value: lcp,
          rating:
            lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor',
        })
        if (path.endsWith('/ko') && next() < 0.08) {
          events.push({
            sessionId,
            pageViewId: id,
            occurredAt: new Date(at + 4000),
            name: 'cta',
            path,
            label: 'join_instagram',
          })
        }
        at += engagementMs + 5_000
      }
      session.lastSeenAt = new Date(at)
      dayOffset -= 1 + Math.floor(next() * 7)
    }
  }
  return { sessions, pageViews, events }
}
