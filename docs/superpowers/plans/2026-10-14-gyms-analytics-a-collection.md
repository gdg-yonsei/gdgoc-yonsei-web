# GYMS 웹 분석 — 계획 A: 수집 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공개 사이트 방문 행동을 자체 수집 스크립트로 모아 Postgres 분석 테이블 3개에 저장하고, GA4를 제거하고, 처리방침에 수집 안내와 거부 버튼을 추가한다.

**Architecture:** 공개 레이아웃의 작은 클라이언트 트래커(`lib/analytics/tracker/*` + `AnalyticsTracker`)가 이벤트를 모아 `sendBeacon`으로 `POST /api/pulse`에 보낸다. 라우트는 얇은 어댑터이고, `lib/server/analytics/collect/*`가 출처·크기·zod 검증, 봇·속도 제한, UA·채널·국가 보강, 트랜잭션 저장, 하루 한 번 보관 기간 정리를 맡는다.

**Tech Stack:** Next.js 16 App Router(`cacheComponents`), React 19(React Compiler), Drizzle ORM + PostgreSQL, zod 4, Vitest(jsdom) + `@electric-sql/pglite`(SQL 테스트), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-gyms-analytics-design.md` (이 계획은 4·5·6·12·13장과 16장의 수집 부분을 구현한다)

## Global Constraints

- 트래커와 Web Vitals 코드를 합쳐 **압축 3KB 이하**. 홈 JS 상한 **200,000B**(`scripts/check-performance-budget.mjs`)를 넘기면 안 된다.
- 트래커 코드(`lib/analytics/**`, `app/components/site/analytics-*.tsx`)는 `zod`, `server-only`, `@/db`, `lib/server/**`를 import하지 않는다(클라이언트 번들 크기).
- 수집 API는 거부·오류 때도 항상 **`204`**를 돌려준다. IP는 속도 제한 판정에만 쓰고 **저장하지 않는다**.
- 세션 만료 **30분**, 배치당 이벤트 **20개**, 본문 **16KB**, 이벤트 경과 시간 상한 **5분**, 보관 **26개월**, 속도 제한 **IP당 분당 120 이벤트**.
- **`.env`의 `AUTH_DRIZZLE_URL`은 원격 DB(`129.154.50.184:5436`)다.** `pnpm db:migrate`·`db:seed`·e2e·성능 측정은 반드시
  `AUTH_DRIZZLE_URL=postgres://gdgoc:gdgoc@127.0.0.1:5432/gdgoc_dev`를 명령 앞에 붙여 실행한다. 접두 없이 `pnpm db:migrate`를 실행하지 않는다.
  `pnpm db:generate`는 DB에 연결하지 않으므로 접두가 필요 없다.
- 생성된 마이그레이션 SQL은 손으로 고치지 않고, 기존 마이그레이션 파일은 절대 수정하지 않는다.
- 주석 규칙(`docs/architecture/code-organization.md` §6): 파일 맨 위 한국어 헤더 주석, export마다 한국어 JSDoc, "왜"만 적는다. 셰이더 외 주석은 한국어.
- React Compiler가 켜져 있으므로 `useMemo`/`useCallback`/`React.memo`를 쓰지 않는다. `lib/**`는 named export만, 컴포넌트 파일은 default export.
- 각 Task 끝에 `pnpm test:types && pnpm lint --max-warnings=0 && pnpm test`가 통과해야 한다(Task 안의 단계는 해당 테스트 파일만 돌려도 된다).
- 커밋 메시지 끝에 다음 두 줄을 붙인다:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01QVp92ACkA5gSYkZUvkGB33
  ```
- **명세 대비 단순화(사용자에게 보고됨):** 속도 제한과 하루 한 번 정리 판정은 인스턴스 메모리로만 한다(Redis 사용 안 함). 운영은 단일 인스턴스이고, 정리는 여러 번 돌아도 결과가 같다.

## Review Focus

1. **`page_view` 비콘이 유실된 뒤 그 조회의 `engagement`·`click`이 도착** → 저장을 건너뛰고 나머지 배치는 정상 저장해야 한다(FK 오류로 배치 전체가 실패하면 안 됨). Task 5에 테스트.
2. **같은 비콘이 두 번 도착(재전송, 개발 모드 StrictMode의 effect 이중 실행)** → 행이 중복되지 않아야 한다. Task 5(`onConflictDoNothing`)와 Task 9(같은 경로 재호출 무시)에 테스트.
3. **리퍼러 URL 쿼리에 개인정보(이메일, 토큰)가 들어 있음** → 쿼리는 저장하지 않는다. Task 3에 테스트.
4. **localStorage를 쓸 수 없는 브라우저(사파리 사생활 보호, 차단 설정)** → 트래커가 예외 없이 동작하고 신규 방문자로 세지 않는다. Task 8·10에 테스트.
5. **로그인한 운영진이 공개 사이트를 봄** → 세션이 `isInternal = true`로 저장되고, 내부 판정 DB 조회가 실패해도 배치는 저장된다. Task 7에 테스트.

---

## File Structure

| 파일                                               | 책임                                                            |
| -------------------------------------------------- | --------------------------------------------------------------- |
| `lib/analytics/constants.ts`                       | 저장소 키, 엔드포인트, 한도 값(클라이언트·서버 공용)            |
| `lib/analytics/events.ts`                          | 이벤트 전송 형식 타입(클라이언트·서버 공용, 런타임 코드 없음)   |
| `lib/analytics/tracker/identity.ts`                | 방문자·세션 식별자, 수집 허용 판정, 거부/허용                   |
| `lib/analytics/tracker/engagement.ts`              | 보이는 동안만 세는 참여 시간 타이머                             |
| `lib/analytics/tracker/scroll.ts`                  | 스크롤 도달 비율 계산                                           |
| `lib/analytics/tracker/clicks.ts`                  | 클릭한 링크를 외부·다운로드·연락처·CTA로 분류                   |
| `lib/analytics/tracker/queue.ts`                   | 이벤트 큐와 배치 직렬화                                         |
| `lib/analytics/tracker/tracker.ts`                 | 위 모듈을 묶어 DOM 이벤트에 연결하는 트래커                     |
| `lib/analytics/tracker/browser.ts`                 | 브라우저 싱글턴, 저장소 대체, `sendBeacon` 전송                 |
| `app/components/site/analytics-tracker.tsx`        | `usePathname`·`useReportWebVitals`를 트래커에 연결하는 컴포넌트 |
| `app/components/site/analytics-opt-out.tsx`        | 처리방침의 수집 거부 토글                                       |
| `lib/server/analytics/collect/schema.ts`           | 수집 배치 zod 스키마                                            |
| `lib/server/analytics/collect/user-agent.ts`       | UA → 기기·브라우저·OS, 봇 판정                                  |
| `lib/server/analytics/collect/channel.ts`          | 채널 분류                                                       |
| `lib/server/analytics/collect/normalize.ts`        | 경로·언어·리퍼러 정규화                                         |
| `lib/server/analytics/collect/timezone-country.ts` | 시간대 → 국가 코드                                              |
| `lib/server/analytics/collect/rate-limit.ts`       | 메모리 고정 창 속도 제한                                        |
| `lib/server/analytics/collect/store.ts`            | 배치를 한 트랜잭션으로 저장                                     |
| `lib/server/analytics/collect/retention.ts`        | 26개월 지난 세션 삭제와 하루 한 번 판정                         |
| `lib/server/analytics/collect/handle-collect.ts`   | 수집 요청 처리 순서 전체                                        |
| `app/api/pulse/route.ts`                           | `POST` 어댑터                                                   |
| `db/schema/analytics.ts`                           | `analytics_sessions`·`analytics_page_views`·`analytics_events`  |
| `tests/helpers/analytics-test-db.ts`               | PGlite에 분석 마이그레이션을 적용한 테스트 DB                   |

수정: `db/index.ts`, `app/(home)/[lang]/layout.tsx`, `app/global-not-found.tsx`, `app/components/site/not-found-view.tsx`,
`app/(home)/[lang]/_components/home/join.tsx`, `app/(home)/[lang]/privacy-policy/page.tsx`, `package.json`, `pnpm-workspace.yaml`,
`docs/handoff.md`, `docs/architecture/overview.md`, 새 문서 `docs/architecture/analytics.md`.

---

### Task 1: 공용 상수·이벤트 타입과 수집 스키마

**Files:**

- Create: `lib/analytics/constants.ts`
- Create: `lib/analytics/events.ts`
- Create: `lib/server/analytics/collect/schema.ts`
- Test: `tests/lib/analytics/collect-schema.test.ts`

**Interfaces:**

- Produces:
  - `constants.ts`: `CHANNELS`(9개 채널 튜플), `type Channel`, `ANALYTICS_ENDPOINT = '/api/pulse'`, `VISITOR_STORAGE_KEY = 'gyms_vid'`, `SESSION_STORAGE_KEY = 'gyms_sid'`, `OPT_OUT_STORAGE_KEY = 'gyms_optout'`, `SESSION_TIMEOUT_MS = 1_800_000`, `MAX_BATCH_EVENTS = 20`, `MAX_BODY_BYTES = 16_384`, `MAX_EVENT_AGE_MS = 300_000`, `RETENTION_MONTHS = 26`, `NOT_FOUND_MARKER_ATTRIBUTE = 'data-analytics-not-found'`, `CTA_ATTRIBUTE = 'data-analytics'`
  - `events.ts`: `ClickKind`, `WebVitalName`, `WebVitalRating`, `UtmParams`, `PageViewEvent`, `EngagementEvent`, `ClickEvent`, `WebVitalEvent`, `AnalyticsEvent`, `QueuedAnalyticsEvent`, `WEB_VITAL_NAMES`
  - `schema.ts`: `analyticsBatchSchema`, `type ParsedAnalyticsEvent`, `type ParsedPageView`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/analytics/collect-schema.test.ts
import { describe, expect, it } from 'vitest'
import { analyticsBatchSchema } from '@/lib/server/analytics/collect/schema'

const SESSION_ID = '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11'
const VISITOR_ID = '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22'
const PAGE_VIEW_ID = '9f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e33'

const pageView = {
  type: 'page_view',
  ageMs: 12,
  pageViewId: PAGE_VIEW_ID,
  sessionId: SESSION_ID,
  visitorId: VISITOR_ID,
  isNewVisitor: true,
  isSessionStart: true,
  sequence: 1,
  path: '/ko/session/25-26',
  title: '세션 | GDGoC Yonsei',
  referrer: 'https://www.google.com/',
  utm: { source: 'instagram', medium: 'social' },
  screenWidth: 390,
  screenHeight: 844,
  language: 'ko-KR',
  timezone: 'Asia/Seoul',
  isNotFound: false,
}

describe('analyticsBatchSchema', () => {
  it('accepts every event type in one batch', () => {
    const result = analyticsBatchSchema.safeParse({
      events: [
        pageView,
        {
          type: 'engagement',
          ageMs: 0,
          pageViewId: PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          engagementMs: 15_000,
          maxScrollPercent: 80,
        },
        {
          type: 'click',
          ageMs: 3,
          pageViewId: PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          path: '/ko',
          kind: 'cta',
          label: 'join_instagram',
          targetUrl: 'https://www.instagram.com/gdg.yonseiuniv/',
        },
        {
          type: 'web_vital',
          ageMs: 1,
          pageViewId: PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          path: '/ko',
          metric: 'LCP',
          value: 1834.2,
          rating: 'good',
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects an empty batch and a batch over 20 events', () => {
    expect(analyticsBatchSchema.safeParse({ events: [] }).success).toBe(false)
    expect(
      analyticsBatchSchema.safeParse({
        events: Array.from({ length: 21 }, () => pageView),
      }).success
    ).toBe(false)
  })

  it('rejects malformed identifiers, paths and unknown event types', () => {
    const cases = [
      { ...pageView, sessionId: 'not-a-uuid' },
      { ...pageView, path: 'ko/session' },
      { ...pageView, path: `/${'a'.repeat(512)}` },
      { ...pageView, sequence: 0 },
      { ...pageView, type: 'purchase' },
    ]
    for (const event of cases) {
      expect(analyticsBatchSchema.safeParse({ events: [event] }).success).toBe(
        false
      )
    }
  })

  it('rejects out-of-range engagement and scroll values', () => {
    const engagement = {
      type: 'engagement',
      ageMs: 0,
      pageViewId: PAGE_VIEW_ID,
      sessionId: SESSION_ID,
      engagementMs: 15_000,
      maxScrollPercent: 80,
    }
    expect(
      analyticsBatchSchema.safeParse({
        events: [{ ...engagement, maxScrollPercent: 101 }],
      }).success
    ).toBe(false)
    expect(
      analyticsBatchSchema.safeParse({
        events: [{ ...engagement, engagementMs: -1 }],
      }).success
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/analytics/collect-schema.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/server/analytics/collect/schema"`

- [ ] **Step 3: Write the implementation**

```ts
// lib/analytics/constants.ts
/** 수집 스크립트·수집 API·대시보드가 함께 쓰는 값이다. 순수 모듈이라 클라이언트 번들에도 들어간다. */

/** 광고 차단 목록이 흔히 막는 단어(analytics, collect, track)를 피한 경로다. */
export const ANALYTICS_ENDPOINT = '/api/pulse'

export const VISITOR_STORAGE_KEY = 'gyms_vid'
export const SESSION_STORAGE_KEY = 'gyms_sid'
export const OPT_OUT_STORAGE_KEY = 'gyms_optout'

/** 마지막 활동 후 이 시간이 지나면 새 세션이다(GA4와 같은 기준). */
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000

export const MAX_BATCH_EVENTS = 20
export const MAX_BODY_BYTES = 16 * 1024

/** 비콘이 늦게 도착해도 발생 시각을 이보다 과거로 돌리지 않는다. 시계가 틀린 기기를 막는다. */
export const MAX_EVENT_AGE_MS = 5 * 60 * 1000

/** 전년 동기 비교가 가능하도록 2년에 두 달을 더 보관한다. */
export const RETENTION_MONTHS = 26

/** 채널 분류값. 수집 API가 정하고 대시보드 필터가 목록으로 쓴다(명세 5장 표의 순서). */
export const CHANNELS = [
  'Paid Search',
  'Paid Social',
  'Email',
  'AI Assistants',
  'Organic Search',
  'Organic Social',
  'Referral',
  'Campaign',
  'Direct',
] as const

export type Channel = (typeof CHANNELS)[number]

/** 404 화면이 렌더링하는 표지. 트래커가 조회를 보낼 때 이 속성이 있으면 404로 기록한다. */
export const NOT_FOUND_MARKER_ATTRIBUTE = 'data-analytics-not-found'

/** 이 속성의 값이 핵심 이벤트(CTA) 라벨이다. */
export const CTA_ATTRIBUTE = 'data-analytics'
```

```ts
// lib/analytics/events.ts
/** 트래커가 보내고 수집 API가 받는 이벤트 형식이다. 타입만 두어 클라이언트 번들에 런타임 코드를 더하지 않는다. */

export type ClickKind = 'outbound' | 'download' | 'contact' | 'cta'

export const WEB_VITAL_NAMES = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const
export type WebVitalName = (typeof WEB_VITAL_NAMES)[number]
export type WebVitalRating = 'good' | 'needs-improvement' | 'poor'

export type UtmParams = {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
}

/** `ageMs`는 이벤트 발생부터 전송까지 걸린 시간이다. 서버가 자기 시계로 발생 시각을 계산한다. */
type EventBase = { ageMs: number; pageViewId: string; sessionId: string }

/** 세션 속성(리퍼러, UTM, 화면, 언어, 시간대)은 세션 행을 처음 만들 때만 쓰인다. */
export type PageViewEvent = EventBase & {
  type: 'page_view'
  visitorId: string
  isNewVisitor: boolean
  isSessionStart: boolean
  sequence: number
  path: string
  title?: string
  referrer?: string
  utm?: UtmParams
  screenWidth?: number
  screenHeight?: number
  language?: string
  timezone?: string
  isNotFound: boolean
}

/** 값은 누적값이다. 서버가 기존 값과 큰 쪽을 취하므로 여러 번 보내도 안전하다. */
export type EngagementEvent = EventBase & {
  type: 'engagement'
  engagementMs: number
  maxScrollPercent: number
}

export type ClickEvent = EventBase & {
  type: 'click'
  path: string
  kind: ClickKind
  label?: string
  targetUrl?: string
}

export type WebVitalEvent = EventBase & {
  type: 'web_vital'
  path: string
  metric: WebVitalName
  value: number
  rating: WebVitalRating
}

export type AnalyticsEvent =
  PageViewEvent | EngagementEvent | ClickEvent | WebVitalEvent

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never

/** 큐에 넣을 때는 `ageMs`를 모른다. 전송 직전에 큐가 채운다. */
export type QueuedAnalyticsEvent = DistributiveOmit<AnalyticsEvent, 'ageMs'>
```

```ts
// lib/server/analytics/collect/schema.ts
/** 수집 API가 받는 배치의 검증 규칙. 공개 엔드포인트라 모든 문자열과 숫자에 상한을 둔다. */
import 'server-only'

import { z } from 'zod'
import { MAX_BATCH_EVENTS } from '@/lib/analytics/constants'
import { WEB_VITAL_NAMES } from '@/lib/analytics/events'

const uuid = z.uuid()
// 경과 시간 상한(5분)은 저장할 때 자른다. 여기서는 터무니없는 값만 거절한다.
const ageMs = z
  .number()
  .int()
  .min(0)
  .max(24 * 60 * 60 * 1000)
const path = z.string().startsWith('/').max(512)
const text = (max: number) => z.string().trim().min(1).max(max)
const screenSize = z.number().int().min(0).max(20_000)

const base = { ageMs, pageViewId: uuid, sessionId: uuid }

const pageViewSchema = z.object({
  ...base,
  type: z.literal('page_view'),
  visitorId: uuid,
  isNewVisitor: z.boolean(),
  isSessionStart: z.boolean(),
  sequence: z.number().int().min(1).max(10_000),
  path,
  title: text(300).optional(),
  referrer: text(1024).optional(),
  utm: z
    .object({
      source: text(200).optional(),
      medium: text(200).optional(),
      campaign: text(200).optional(),
      term: text(200).optional(),
      content: text(200).optional(),
    })
    .optional(),
  screenWidth: screenSize.optional(),
  screenHeight: screenSize.optional(),
  language: text(35).optional(),
  timezone: text(64).optional(),
  isNotFound: z.boolean(),
})

const engagementSchema = z.object({
  ...base,
  type: z.literal('engagement'),
  engagementMs: z
    .number()
    .int()
    .min(0)
    .max(24 * 60 * 60 * 1000),
  maxScrollPercent: z.number().int().min(0).max(100),
})

const clickSchema = z.object({
  ...base,
  type: z.literal('click'),
  path,
  kind: z.enum(['outbound', 'download', 'contact', 'cta']),
  label: text(100).optional(),
  targetUrl: text(1024).optional(),
})

const webVitalSchema = z.object({
  ...base,
  type: z.literal('web_vital'),
  path,
  metric: z.enum(WEB_VITAL_NAMES),
  value: z.number().min(0).max(600_000),
  rating: z.enum(['good', 'needs-improvement', 'poor']),
})

/** 한 번에 받는 이벤트 묶음. 트래커는 20개를 넘기면 여러 배치로 나눠 보낸다. */
export const analyticsBatchSchema = z.object({
  events: z
    .array(
      z.discriminatedUnion('type', [
        pageViewSchema,
        engagementSchema,
        clickSchema,
        webVitalSchema,
      ])
    )
    .min(1)
    .max(MAX_BATCH_EVENTS),
})

export type ParsedAnalyticsEvent = z.infer<
  typeof analyticsBatchSchema
>['events'][number]

export type ParsedPageView = z.infer<typeof pageViewSchema>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/lib/analytics/collect-schema.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/analytics lib/server/analytics tests/lib/analytics
git commit -m "feat(analytics): define the event format and the collect batch schema"
```

---

### Task 2: User-Agent 파서와 봇 판정

**Files:**

- Create: `lib/server/analytics/collect/user-agent.ts`
- Test: `tests/lib/analytics/user-agent.test.ts`

**Interfaces:**

- Produces: `type DeviceType = 'mobile' | 'tablet' | 'desktop'`, `type ParsedUserAgent = { deviceType: DeviceType; browser: string; os: string }`, `parseUserAgent(userAgent: string): ParsedUserAgent`, `isBotUserAgent(userAgent: string | null): boolean`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/analytics/user-agent.test.ts
import { describe, expect, it } from 'vitest'
import {
  isBotUserAgent,
  parseUserAgent,
} from '@/lib/server/analytics/collect/user-agent'

const UA = {
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
  kakaoIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 25.8.0',
  instagramAndroid:
    'Mozilla/5.0 (Linux; Android 15; SM-S928N Build/AP3A.240905.015.A2; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/141.0.0.0 Mobile Safari/537.36 Instagram 400.0.0.0.0 Android',
  samsungAndroid:
    'Mozilla/5.0 (Linux; Android 15; SM-S928N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/28.0 Chrome/130.0.0.0 Mobile Safari/537.36',
  whaleWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Whale/4.33.0.0 Safari/537.36',
  naverApp:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 NAVER(inapp; search; 2000; 12.10.0)',
  edgeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
  firefoxLinux:
    'Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0',
  chromeIpad:
    'Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1',
  androidTablet:
    'Mozilla/5.0 (Linux; Android 14; SM-X710N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
}

describe('parseUserAgent', () => {
  it.each([
    [
      UA.chromeWindows,
      { deviceType: 'desktop', browser: 'Chrome', os: 'Windows' },
    ],
    [UA.safariMac, { deviceType: 'desktop', browser: 'Safari', os: 'macOS' }],
    [UA.safariIphone, { deviceType: 'mobile', browser: 'Safari', os: 'iOS' }],
    [UA.kakaoIphone, { deviceType: 'mobile', browser: 'KakaoTalk', os: 'iOS' }],
    [
      UA.instagramAndroid,
      { deviceType: 'mobile', browser: 'Instagram', os: 'Android' },
    ],
    [
      UA.samsungAndroid,
      { deviceType: 'mobile', browser: 'Samsung Internet', os: 'Android' },
    ],
    [
      UA.whaleWindows,
      { deviceType: 'desktop', browser: 'Whale', os: 'Windows' },
    ],
    [UA.naverApp, { deviceType: 'mobile', browser: 'Naver', os: 'iOS' }],
    [UA.edgeWindows, { deviceType: 'desktop', browser: 'Edge', os: 'Windows' }],
    [
      UA.firefoxLinux,
      { deviceType: 'desktop', browser: 'Firefox', os: 'Linux' },
    ],
    [UA.chromeIpad, { deviceType: 'tablet', browser: 'Chrome', os: 'iPadOS' }],
    [
      UA.androidTablet,
      { deviceType: 'tablet', browser: 'Chrome', os: 'Android' },
    ],
  ])('parses %s', (userAgent, expected) => {
    expect(parseUserAgent(userAgent)).toEqual(expected)
  })

  it('falls back to Other for unknown agents', () => {
    expect(parseUserAgent('')).toEqual({
      deviceType: 'desktop',
      browser: 'Other',
      os: 'Other',
    })
  })
})

describe('isBotUserAgent', () => {
  it.each([
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd) bingbot',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/141.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
    'facebookexternalhit/1.1',
    'curl/8.9.1',
    'python-requests/2.32.3',
  ])('flags %s', (userAgent) => {
    expect(isBotUserAgent(userAgent)).toBe(true)
  })

  it('flags a missing user agent and keeps real browsers', () => {
    expect(isBotUserAgent(null)).toBe(true)
    expect(isBotUserAgent(UA.kakaoIphone)).toBe(false)
    expect(isBotUserAgent(UA.chromeWindows)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/analytics/user-agent.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/server/analytics/collect/user-agent.ts
/** UA 문자열을 기기·브라우저·OS로 나눈다. 카카오톡·인스타그램·네이버 인앱과 웨일을 구분해야 해서 라이브러리 대신 직접 판정한다. */
import 'server-only'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export type ParsedUserAgent = {
  deviceType: DeviceType
  browser: string
  os: string
}

// 링크 미리보기 봇, 성능 측정 도구, HTTP 라이브러리도 사람 방문이 아니다.
const BOT_PATTERN =
  /bot\b|bot\/|crawl|spider|slurp|yeti|headless|lighthouse|pagespeed|gtmetrix|preview|facebookexternalhit|embedly|vkshare|whatsapp|telegram|curl\/|wget\/|python-requests|axios\/|node-fetch|go-http-client|java\//i

// 인앱 브라우저 UA에는 Chrome·Safari 토큰도 들어 있어 더 구체적인 것부터 확인한다.
const BROWSERS: Array<[RegExp, string]> = [
  [/KAKAOTALK/i, 'KakaoTalk'],
  [/Instagram/, 'Instagram'],
  [/FBAN|FBAV/, 'Facebook'],
  [/NAVER\(inapp/, 'Naver'],
  [/Whale\//, 'Whale'],
  [/SamsungBrowser\//, 'Samsung Internet'],
  [/Edg(A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/Firefox\/|FxiOS\//, 'Firefox'],
  [/CriOS\/|Chrome\//, 'Chrome'],
  [/Version\/[\d.]+.*Safari\//, 'Safari'],
]

const OPERATING_SYSTEMS: Array<[RegExp, string]> = [
  [/iPad/, 'iPadOS'],
  [/iPhone|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/Windows/, 'Windows'],
  [/CrOS/, 'ChromeOS'],
  [/Macintosh|Mac OS X/, 'macOS'],
  [/Linux/, 'Linux'],
]

function firstMatch(userAgent: string, table: Array<[RegExp, string]>) {
  return table.find(([pattern]) => pattern.test(userAgent))?.[1] ?? 'Other'
}

// 안드로이드 태블릿은 UA에 Mobile 토큰이 없다. iPadOS 13 이후 데스크톱 모드 UA는 맥과 구분할 수 없어 데스크톱으로 센다.
function deviceTypeOf(userAgent: string): DeviceType {
  if (/iPad|Tablet/.test(userAgent)) return 'tablet'
  if (/Android/.test(userAgent) && !/Mobile/.test(userAgent)) return 'tablet'
  if (/Mobi|iPhone|iPod|Android/.test(userAgent)) return 'mobile'
  return 'desktop'
}

/** 알 수 없는 값은 `Other`로 둔다. 화면에서 그룹으로 묶여 보인다. */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  return {
    deviceType: deviceTypeOf(userAgent),
    browser: firstMatch(userAgent, BROWSERS),
    os: firstMatch(userAgent, OPERATING_SYSTEMS),
  }
}

/** UA가 없으면 브라우저가 아닌 클라이언트로 보고 버린다. */
export function isBotUserAgent(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/lib/analytics/user-agent.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/analytics/collect/user-agent.ts tests/lib/analytics/user-agent.test.ts
git commit -m "feat(analytics): parse user agents including Korean in-app browsers"
```

---

### Task 3: 채널 분류, 경로·리퍼러 정규화, 시간대 → 국가

**Files:**

- Create: `lib/server/analytics/collect/channel.ts`
- Create: `lib/server/analytics/collect/normalize.ts`
- Create: `lib/server/analytics/collect/timezone-country.ts`
- Test: `tests/lib/analytics/channel.test.ts`
- Test: `tests/lib/analytics/normalize.test.ts`

**Interfaces:**

- Produces:
  - `classifyChannel(input: { referrerHost: string | null; utmSource?: string | null; utmMedium?: string | null; hasUtm: boolean }): Channel`
  - `normalizePath(path: string): string`, `localeFromPath(path: string): string`, `parseReferrer(referrer: string | undefined, siteHost: string): { host: string; path: string } | null`
  - `countryFromTimezone(timezone: string | undefined | null): string`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/analytics/channel.test.ts
import { describe, expect, it } from 'vitest'
import { classifyChannel } from '@/lib/server/analytics/collect/channel'

const none = {
  referrerHost: null,
  utmSource: null,
  utmMedium: null,
  hasUtm: false,
}

describe('classifyChannel', () => {
  it.each([
    [{ ...none }, 'Direct'],
    [{ ...none, referrerHost: 'google.com' }, 'Organic Search'],
    [{ ...none, referrerHost: 'google.co.kr' }, 'Organic Search'],
    [{ ...none, referrerHost: 'm.search.naver.com' }, 'Organic Search'],
    [{ ...none, referrerHost: 'search.daum.net' }, 'Organic Search'],
    [{ ...none, referrerHost: 'bing.com' }, 'Organic Search'],
    [{ ...none, referrerHost: 'docs.google.com' }, 'Referral'],
    [{ ...none, referrerHost: 'blog.naver.com' }, 'Organic Social'],
    [{ ...none, referrerHost: 'l.instagram.com' }, 'Organic Social'],
    [{ ...none, referrerHost: 'everytime.kr' }, 'Organic Social'],
    [{ ...none, referrerHost: 't.co' }, 'Organic Social'],
    [{ ...none, referrerHost: 'chatgpt.com' }, 'AI Assistants'],
    [{ ...none, referrerHost: 'gemini.google.com' }, 'AI Assistants'],
    [{ ...none, referrerHost: 'perplexity.ai' }, 'AI Assistants'],
    [{ ...none, utmSource: 'chatgpt.com', hasUtm: true }, 'AI Assistants'],
    [{ ...none, referrerHost: 'velog.io' }, 'Referral'],
    [
      { ...none, utmSource: 'naver', utmMedium: 'cpc', hasUtm: true },
      'Paid Search',
    ],
    [
      {
        ...none,
        utmSource: 'instagram',
        utmMedium: 'paid_social',
        hasUtm: true,
      },
      'Paid Social',
    ],
    [
      { ...none, utmSource: 'newsletter', utmMedium: 'email', hasUtm: true },
      'Email',
    ],
    [
      { ...none, utmSource: 'kakao', utmMedium: 'social', hasUtm: true },
      'Organic Social',
    ],
    [
      { ...none, utmSource: 'poster', utmMedium: 'qr', hasUtm: true },
      'Campaign',
    ],
  ] as const)('%o → %s', (input, expected) => {
    expect(classifyChannel(input)).toBe(expected)
  })
})
```

```ts
// tests/lib/analytics/normalize.test.ts
import { describe, expect, it } from 'vitest'
import {
  localeFromPath,
  normalizePath,
  parseReferrer,
} from '@/lib/server/analytics/collect/normalize'
import { countryFromTimezone } from '@/lib/server/analytics/collect/timezone-country'

describe('normalizePath', () => {
  it('drops query, hash and trailing slashes but keeps the root', () => {
    expect(normalizePath('/ko/session/?tag=web#top')).toBe('/ko/session')
    expect(normalizePath('/')).toBe('/')
    expect(normalizePath('/ko///')).toBe('/ko')
  })
})

describe('localeFromPath', () => {
  it('reads the locale segment and marks everything else as other', () => {
    expect(localeFromPath('/ko/project')).toBe('ko')
    expect(localeFromPath('/en')).toBe('en')
    expect(localeFromPath('/unknown/page')).toBe('other')
  })
})

describe('parseReferrer', () => {
  it('keeps host and path, strips www and never keeps the query', () => {
    expect(
      parseReferrer(
        'https://www.google.com/search?q=gdgoc&email=me@example.com',
        'gdgoc.yonsei.ac.kr'
      )
    ).toEqual({ host: 'google.com', path: '/search' })
  })

  it('treats same-site referrers and non-web schemes as no referrer', () => {
    expect(
      parseReferrer('https://gdgoc.yonsei.ac.kr/ko', 'gdgoc.yonsei.ac.kr')
    ).toBeNull()
    expect(
      parseReferrer(
        'android-app://com.google.android.gm/',
        'gdgoc.yonsei.ac.kr'
      )
    ).toBeNull()
    expect(parseReferrer('not a url', 'gdgoc.yonsei.ac.kr')).toBeNull()
    expect(parseReferrer(undefined, 'gdgoc.yonsei.ac.kr')).toBeNull()
  })
})

describe('countryFromTimezone', () => {
  it('maps known zones and falls back to ZZ', () => {
    expect(countryFromTimezone('Asia/Seoul')).toBe('KR')
    expect(countryFromTimezone('America/Los_Angeles')).toBe('US')
    expect(countryFromTimezone('Mars/Olympus')).toBe('ZZ')
    expect(countryFromTimezone(undefined)).toBe('ZZ')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/lib/analytics/channel.test.ts tests/lib/analytics/normalize.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/server/analytics/collect/channel.ts
/** GA4 기본 채널 그룹을 동아리 사이트에 맞게 줄인 분류. 위에서부터 먼저 맞는 규칙이 이긴다(명세 5장 표). */
import 'server-only'

import type { Channel } from '@/lib/analytics/constants'

// google.* 의 다른 서브도메인(docs, mail)은 검색이 아니라 리퍼럴이다. gemini.google.com은 AI 규칙이 먼저 잡는다.
const SEARCH_HOSTS = [
  /^(www\.|m\.)?google\.[a-z.]+$/,
  /(^|\.)bing\.com$/,
  /(^|\.)search\.naver\.com$/,
  /(^|\.)search\.daum\.net$/,
  /(^|\.)search\.yahoo\.[a-z.]+$/,
  /(^|\.)duckduckgo\.com$/,
  /(^|\.)ecosia\.org$/,
  /(^|\.)baidu\.com$/,
  /(^|\.)yandex\.[a-z.]+$/,
  /(^|\.)search\.zum\.com$/,
  /(^|\.)search\.nate\.com$/,
]
const SEARCH_SOURCES =
  /^(google|naver|daum|bing|yahoo|duckduckgo|baidu|yandex)$/i

const SOCIAL_HOSTS = [
  /(^|\.)instagram\.com$/,
  /(^|\.)facebook\.com$/,
  /^t\.co$/,
  /(^|\.)x\.com$/,
  /(^|\.)twitter\.com$/,
  /(^|\.)threads\.(net|com)$/,
  /(^|\.)linkedin\.com$/,
  /^lnkd\.in$/,
  /(^|\.)youtube\.com$/,
  /(^|\.)kakao\.com$/,
  /(^|\.)everytime\.kr$/,
  /(^|\.)discord(app)?\.com$/,
  /(^|\.)reddit\.com$/,
  /^(blog|cafe|m\.blog|m\.cafe)\.naver\.com$/,
  /(^|\.)band\.us$/,
]
const SOCIAL_SOURCES =
  /^(instagram|ig|facebook|fb|twitter|x|threads|linkedin|youtube|kakao|kakaotalk|everytime|discord|reddit|band)$/i
const SOCIAL_MEDIUMS =
  /^(social|social-network|social-media|sm|social network|social media)$/i

// ChatGPT는 링크에 utm_source=chatgpt.com을 붙이므로 출처 값도 같은 목록으로 확인한다.
const AI_HOSTS = [
  /(^|\.)chatgpt\.com$/,
  /^chat\.openai\.com$/,
  /(^|\.)perplexity\.ai$/,
  /^claude\.ai$/,
  /^gemini\.google\.com$/,
  /^copilot\.microsoft\.com$/,
  /(^|\.)poe\.com$/,
  /^chat\.deepseek\.com$/,
  /(^|\.)grok\.com$/,
]

// GA4의 유료 매체 정규식과 같다.
const PAID_MEDIUM = /^(.*cp.*|ppc|retargeting|paid.*)$/i
const EMAIL = /e[-_ ]?mail|newsletter/i

function matchesAny(value: string | null | undefined, patterns: RegExp[]) {
  return value
    ? patterns.some((pattern) => pattern.test(value.toLowerCase()))
    : false
}

/** `referrerHost`는 www를 뗀 외부 호스트다. 같은 사이트 리퍼러는 호출 전에 `null`로 바꾼다. */
export function classifyChannel(input: {
  referrerHost: string | null
  utmSource?: string | null
  utmMedium?: string | null
  hasUtm: boolean
}): Channel {
  const { referrerHost, utmSource, utmMedium } = input
  const isSearch =
    matchesAny(referrerHost, SEARCH_HOSTS) ||
    SEARCH_SOURCES.test(utmSource ?? '')
  const isSocial =
    matchesAny(referrerHost, SOCIAL_HOSTS) ||
    SOCIAL_SOURCES.test(utmSource ?? '') ||
    SOCIAL_MEDIUMS.test(utmMedium ?? '')

  if (utmMedium && PAID_MEDIUM.test(utmMedium)) {
    if (isSearch) return 'Paid Search'
    if (isSocial) return 'Paid Social'
  }
  if (EMAIL.test(utmMedium ?? '') || EMAIL.test(utmSource ?? '')) return 'Email'
  if (matchesAny(referrerHost, AI_HOSTS) || matchesAny(utmSource, AI_HOSTS)) {
    return 'AI Assistants'
  }
  if (isSearch) return 'Organic Search'
  if (isSocial) return 'Organic Social'
  if (referrerHost) return 'Referral'
  if (input.hasUtm) return 'Campaign'
  return 'Direct'
}
```

```ts
// lib/server/analytics/collect/normalize.ts
/** 저장 전에 경로·언어·리퍼러를 같은 모양으로 맞춘다. 쿼리에는 개인정보가 섞일 수 있어 저장하지 않는다. */
import 'server-only'

import { isLocale } from '@/lib/i18n'

/** 쿼리·해시와 끝 슬래시를 뗀다. 같은 페이지가 여러 행으로 갈라지지 않게 한다. */
export function normalizePath(path: string): string {
  const withoutQuery = path.split(/[?#]/, 1)[0] ?? '/'
  const trimmed = withoutQuery.replace(/\/+$/, '')
  return (trimmed || '/').slice(0, 512)
}

/** 공개 페이지는 첫 경로 조각이 언어다. 전역 404처럼 언어가 없는 경로는 `other`. */
export function localeFromPath(path: string): string {
  const segment = path.split('/')[1]
  return isLocale(segment) ? segment : 'other'
}

/** 외부 웹 리퍼러만 남긴다. 같은 사이트, 앱 스킴, 해석할 수 없는 값은 리퍼러가 없는 것으로 본다. */
export function parseReferrer(
  referrer: string | undefined,
  siteHost: string
): { host: string; path: string } | null {
  if (!referrer) return null
  let url: URL
  try {
    url = new URL(referrer)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  if (host === siteHost.toLowerCase().replace(/^www\./, '')) return null
  return { host, path: url.pathname.slice(0, 512) }
}
```

```ts
// lib/server/analytics/collect/timezone-country.ts
/** 사이트가 국가 헤더를 주는 CDN 뒤에 있지 않아 브라우저 시간대로 국가를 추정한다. 화면에는 "추정"으로 표시한다. */
import 'server-only'

const TIMEZONE_COUNTRY: Record<string, string> = {
  'Asia/Seoul': 'KR',
  'Asia/Tokyo': 'JP',
  'Asia/Shanghai': 'CN',
  'Asia/Chongqing': 'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Macau': 'MO',
  'Asia/Taipei': 'TW',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Bangkok': 'TH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Saigon': 'VN',
  'Asia/Jakarta': 'ID',
  'Asia/Manila': 'PH',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Dhaka': 'BD',
  'Asia/Kathmandu': 'NP',
  'Asia/Karachi': 'PK',
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Tehran': 'IR',
  'Asia/Jerusalem': 'IL',
  'Asia/Tel_Aviv': 'IL',
  'Asia/Almaty': 'KZ',
  'Asia/Tashkent': 'UZ',
  'Asia/Ulaanbaatar': 'MN',
  'Asia/Yangon': 'MM',
  'Asia/Phnom_Penh': 'KH',
  'Asia/Vientiane': 'LA',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
  'Pacific/Auckland': 'NZ',
  'Pacific/Honolulu': 'US',
  'Europe/London': 'GB',
  'Europe/Dublin': 'IE',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Zurich': 'CH',
  'Europe/Vienna': 'AT',
  'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI',
  'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ',
  'Europe/Lisbon': 'PT',
  'Europe/Athens': 'GR',
  'Europe/Istanbul': 'TR',
  'Europe/Moscow': 'RU',
  'Europe/Kiev': 'UA',
  'Europe/Kyiv': 'UA',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Phoenix': 'US',
  'America/Los_Angeles': 'US',
  'America/Anchorage': 'US',
  'America/Detroit': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo': 'BR',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Bogota': 'CO',
  'America/Lima': 'PE',
  'America/Santiago': 'CL',
  'Africa/Cairo': 'EG',
  'Africa/Johannesburg': 'ZA',
  'Africa/Lagos': 'NG',
  'Africa/Nairobi': 'KE',
}

/** 표에 없는 시간대는 ISO 3166의 "알 수 없음" 값 `ZZ`. */
export function countryFromTimezone(
  timezone: string | undefined | null
): string {
  return (timezone && TIMEZONE_COUNTRY[timezone]) || 'ZZ'
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/lib/analytics/channel.test.ts tests/lib/analytics/normalize.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/analytics/collect tests/lib/analytics
git commit -m "feat(analytics): classify channels and normalize paths, referrers and timezones"
```

---

### Task 4: 분석 테이블 스키마, 마이그레이션, PGlite 테스트 DB

**Files:**

- Create: `db/schema/analytics.ts`
- Modify: `db/index.ts` (스키마 등록)
- Create: `drizzle/00XX_add_analytics.sql` + `drizzle/meta/*` (생성됨)
- Create: `tests/helpers/analytics-test-db.ts`
- Modify: `package.json` (devDependency `@electric-sql/pglite`)
- Test: `tests/lib/analytics/schema-migration.test.ts`

**Interfaces:**

- Produces: `analyticsSessions`, `analyticsPageViews`, `analyticsEvents` (Drizzle 테이블, 컬럼 이름은 명세 6장과 같음), `createAnalyticsTestDb(): Promise<{ db: PgliteDatabase<typeof analyticsSchema>; client: PGlite }>`

- [ ] **Step 1: Add the dev dependency**

Run: `pnpm add -D @electric-sql/pglite@^0.5.9`
Expected: `package.json` devDependencies에 `"@electric-sql/pglite": "^0.5.9"`. `pnpm-workspace.yaml`의 `minimumReleaseAge` 같은 정책 때문에 설치가 거부되면, 그 정책이 허용하는 가장 최신 0.x 버전을 지정한다.

- [ ] **Step 2: Write the schema**

```ts
// db/schema/analytics.ts
/** 공개 사이트 방문 분석. 행은 /api/pulse만 쓰고, 세션을 지우면 조회·이벤트가 함께 지워진다(보관 기간 정리). */
import {
  bigint,
  boolean,
  char,
  doublePrecision,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

// id는 브라우저가 만든 sessionId다. 세션 속성은 세션 첫 조회의 값으로 고정한다.
export const analyticsSessions = pgTable(
  'analytics_sessions',
  {
    id: uuid('id').primaryKey(),
    visitorId: uuid('visitorId').notNull(),
    startedAt: timestamp('startedAt').notNull(),
    lastSeenAt: timestamp('lastSeenAt').notNull(),
    isNewVisitor: boolean('isNewVisitor').notNull(),
    isInternal: boolean('isInternal').notNull(),
    landingPath: text('landingPath').notNull(),
    referrerHost: text('referrerHost'),
    referrerPath: text('referrerPath'),
    utmSource: text('utmSource'),
    utmMedium: text('utmMedium'),
    utmCampaign: text('utmCampaign'),
    utmTerm: text('utmTerm'),
    utmContent: text('utmContent'),
    channel: text('channel').notNull(),
    deviceType: text('deviceType').notNull(),
    browser: text('browser').notNull(),
    os: text('os').notNull(),
    screenWidth: smallint('screenWidth'),
    screenHeight: smallint('screenHeight'),
    language: text('language'),
    timezone: text('timezone'),
    country: char('country', { length: 2 }).notNull(),
  },
  (table) => [
    index('analytics_sessions_startedAt_idx').on(table.startedAt),
    index('analytics_sessions_visitorId_startedAt_idx').on(
      table.visitorId,
      table.startedAt
    ),
  ]
)

// visitorId는 사용자 수 집계 때 세션과 조인하지 않으려고 중복 저장한다.
export const analyticsPageViews = pgTable(
  'analytics_page_views',
  {
    id: uuid('id').primaryKey(),
    sessionId: uuid('sessionId')
      .notNull()
      .references(() => analyticsSessions.id, { onDelete: 'cascade' }),
    visitorId: uuid('visitorId').notNull(),
    occurredAt: timestamp('occurredAt').notNull(),
    sequence: smallint('sequence').notNull(),
    path: text('path').notNull(),
    locale: text('locale').notNull(),
    title: text('title'),
    isNotFound: boolean('isNotFound').notNull().default(false),
    engagementMs: integer('engagementMs').notNull().default(0),
    maxScrollPercent: smallint('maxScrollPercent').notNull().default(0),
  },
  (table) => [
    index('analytics_page_views_occurredAt_idx').on(table.occurredAt),
    index('analytics_page_views_path_occurredAt_idx').on(
      table.path,
      table.occurredAt
    ),
    index('analytics_page_views_sessionId_sequence_idx').on(
      table.sessionId,
      table.sequence
    ),
  ]
)

// name: outbound·download·contact·cta(클릭)와 web_vital. 클릭은 label·targetUrl, Web Vitals는 metric·rating·value를 쓴다.
export const analyticsEvents = pgTable(
  'analytics_events',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    sessionId: uuid('sessionId')
      .notNull()
      .references(() => analyticsSessions.id, { onDelete: 'cascade' }),
    pageViewId: uuid('pageViewId')
      .notNull()
      .references(() => analyticsPageViews.id, { onDelete: 'cascade' }),
    occurredAt: timestamp('occurredAt').notNull(),
    name: text('name').notNull(),
    path: text('path').notNull(),
    label: text('label'),
    targetUrl: text('targetUrl'),
    metric: text('metric'),
    rating: text('rating'),
    value: doublePrecision('value'),
  },
  (table) => [
    index('analytics_events_name_occurredAt_idx').on(
      table.name,
      table.occurredAt
    ),
    index('analytics_events_pageViewId_idx').on(table.pageViewId),
    // 세션별 핵심 이벤트 수를 셀 때(대시보드 참여 세션 판정) 쓴다.
    index('analytics_events_sessionId_idx').on(table.sessionId),
  ]
)
```

Modify `db/index.ts`: 다른 스키마 import 아래에 추가하고 `schema` 객체 끝에 펼친다.

```ts
import * as analyticsSchema from './schema/analytics'
```

```ts
    ...announcementsSchema,
    ...analyticsSchema,
  },
```

- [ ] **Step 3: Generate the migration**

Run: `pnpm exec drizzle-kit generate --name add_analytics`
Expected: `drizzle/00NN_add_analytics.sql`(NN은 다음 번호, 현재 마지막은 0037)과 `drizzle/meta/_journal.json`·스냅샷 변경. SQL을 열어 `CREATE TABLE "analytics_sessions"`·`"analytics_page_views"`·`"analytics_events"`, FK 3개(`ON DELETE cascade`), 인덱스 8개만 있는지 확인한다. `DROP`·`ALTER ... TYPE`이 있으면 멈추고 원인을 찾는다.
그 다음 `node scripts/ci/check-migrations.mjs`가 있으면 실행해 통과를 확인한다(인자 형식은 파일 맨 위 주석을 따른다).

- [ ] **Step 4: Write the failing test for the test DB helper**

```ts
// tests/lib/analytics/schema-migration.test.ts
import { describe, expect, it } from 'vitest'
import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'

describe('analytics migration', () => {
  it('creates the three analytics tables with cascading deletes', async () => {
    const { client } = await createAnalyticsTestDb()
    const tables = await client.query<{ table_name: string }>(
      `select table_name from information_schema.tables
       where table_name like 'analytics_%' order by table_name`
    )
    expect(tables.rows.map((row) => row.table_name)).toEqual([
      'analytics_events',
      'analytics_page_views',
      'analytics_sessions',
    ])

    await client.exec(`
      insert into analytics_sessions (id, "visitorId", "startedAt", "lastSeenAt", "isNewVisitor", "isInternal",
        "landingPath", channel, "deviceType", browser, os, country)
      values ('0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11', '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22', now(), now(),
        true, false, '/ko', 'Direct', 'desktop', 'Chrome', 'macOS', 'KR');
      insert into analytics_page_views (id, "sessionId", "visitorId", "occurredAt", sequence, path, locale)
      values ('9f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e33', '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11',
        '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22', now(), 1, '/ko', 'ko');
      delete from analytics_sessions;
    `)
    const remaining = await client.query<{ count: number }>(
      'select count(*)::int as count from analytics_page_views'
    )
    expect(remaining.rows[0]?.count).toBe(0)
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

Run: `pnpm test tests/lib/analytics/schema-migration.test.ts`
Expected: FAIL — `Failed to resolve import "@/tests/helpers/analytics-test-db"`

- [ ] **Step 6: Write the helper**

```ts
// tests/helpers/analytics-test-db.ts
/** 분석 SQL을 실제 Postgres 문법으로 검증하는 메모리 DB. 생성된 분석 마이그레이션 파일만 적용해 빠르게 뜬다. */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as analyticsSchema from '@/db/schema/analytics'

const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle')

async function analyticsMigrationSql(): Promise<string[]> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((file) =>
    file.endsWith('.sql')
  )
  const statements: string[] = []
  for (const file of files.sort()) {
    const content = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
    if (content.includes('CREATE TABLE "analytics_')) {
      statements.push(...content.split('--> statement-breakpoint'))
    }
  }
  return statements.map((statement) => statement.trim()).filter(Boolean)
}

/** 테스트마다 새 DB를 만든다. `vi.mock('@/db')`에서 `db`로 넘겨 서비스 코드를 그대로 실행한다. */
export async function createAnalyticsTestDb() {
  const client = new PGlite()
  for (const statement of await analyticsMigrationSql()) {
    await client.exec(statement)
  }
  return { client, db: drizzle(client, { schema: analyticsSchema }) }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm test tests/lib/analytics/schema-migration.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add db/schema/analytics.ts db/index.ts drizzle tests/helpers tests/lib/analytics/schema-migration.test.ts package.json pnpm-lock.yaml
git commit -m "feat(analytics): add the analytics tables and a PGlite test database"
```

---

### Task 5: 배치 저장 (`storeAnalyticsBatch`)

**Files:**

- Create: `lib/server/analytics/collect/store.ts`
- Test: `tests/lib/analytics/store.test.ts`

**Interfaces:**

- Consumes: `ParsedAnalyticsEvent`, `ParsedPageView` (Task 1), `ParsedUserAgent` (Task 2), `classifyChannel`, `normalizePath`, `localeFromPath`, `parseReferrer`, `countryFromTimezone` (Task 3), 테이블 (Task 4)
- Produces: `type CollectContext = { now: Date; siteHost: string; userAgent: ParsedUserAgent; resolveIsInternal: () => Promise<boolean> }`, `storeAnalyticsBatch(events: ParsedAnalyticsEvent[], context: CollectContext): Promise<void>`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/analytics/store.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ParsedAnalyticsEvent } from '@/lib/server/analytics/collect/schema'

const testDb = vi.hoisted(() => ({
  current: null as null | Awaited<
    ReturnType<
      typeof import('@/tests/helpers/analytics-test-db').createAnalyticsTestDb
    >
  >,
}))

vi.mock('@/db', () => ({
  get db() {
    return testDb.current!.db
  },
}))

import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'
import {
  storeAnalyticsBatch,
  type CollectContext,
} from '@/lib/server/analytics/collect/store'

const SESSION_ID = '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11'
const VISITOR_ID = '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22'
const PAGE_VIEW_ID = '9f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e33'
const SECOND_PAGE_VIEW_ID = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c44'
const NOW = new Date('2026-10-14T05:00:00.000Z')

const pageView = (
  overrides: Partial<Extract<ParsedAnalyticsEvent, { type: 'page_view' }>> = {}
) =>
  ({
    type: 'page_view',
    ageMs: 2_000,
    pageViewId: PAGE_VIEW_ID,
    sessionId: SESSION_ID,
    visitorId: VISITOR_ID,
    isNewVisitor: true,
    isSessionStart: true,
    sequence: 1,
    path: '/ko/session/?tag=web',
    title: '세션',
    referrer: 'https://www.google.com/search?q=gdgoc',
    utm: undefined,
    screenWidth: 390,
    screenHeight: 844,
    language: 'ko-KR',
    timezone: 'Asia/Seoul',
    isNotFound: false,
    ...overrides,
  }) satisfies ParsedAnalyticsEvent

function context(overrides: Partial<CollectContext> = {}): CollectContext {
  return {
    now: NOW,
    siteHost: 'gdgoc.yonsei.ac.kr',
    userAgent: { deviceType: 'mobile', browser: 'Safari', os: 'iOS' },
    resolveIsInternal: vi.fn(async () => false),
    ...overrides,
  }
}

async function rows(sql: string) {
  return (await testDb.current!.client.query<Record<string, unknown>>(sql)).rows
}

beforeEach(async () => {
  testDb.current = await createAnalyticsTestDb()
})

describe('storeAnalyticsBatch', () => {
  it('creates the session from the first page view with enriched attributes', async () => {
    await storeAnalyticsBatch([pageView()], context())

    const [session] = await rows(
      'select *, "startedAt"::text as "startedAtText" from analytics_sessions'
    )
    expect(session).toMatchObject({
      id: SESSION_ID,
      visitorId: VISITOR_ID,
      isNewVisitor: true,
      isInternal: false,
      landingPath: '/ko/session',
      referrerHost: 'google.com',
      referrerPath: '/search',
      channel: 'Organic Search',
      deviceType: 'mobile',
      browser: 'Safari',
      os: 'iOS',
      country: 'KR',
    })
    // timestamp 컬럼은 실제 UTC 시각을 시간대 없이 저장한다. 드라이버의 Date 해석 차이를 피하려고 문자열로 비교한다.
    expect(session!.startedAtText).toBe('2026-10-14 04:59:58')

    const [view] = await rows('select * from analytics_page_views')
    expect(view).toMatchObject({
      id: PAGE_VIEW_ID,
      path: '/ko/session',
      locale: 'ko',
      sequence: 1,
      engagementMs: 0,
    })
  })

  it('caps the event age at five minutes', async () => {
    await storeAnalyticsBatch([pageView({ ageMs: 60 * 60 * 1000 })], context())
    const [view] = await rows(
      'select "occurredAt"::text as "occurredAt" from analytics_page_views'
    )
    expect(view!.occurredAt).toBe('2026-10-14 04:55:00')
  })

  it('ignores a duplicate page view beacon', async () => {
    await storeAnalyticsBatch([pageView()], context())
    await storeAnalyticsBatch([pageView()], context())
    expect(await rows('select id from analytics_page_views')).toHaveLength(1)
    expect(await rows('select id from analytics_sessions')).toHaveLength(1)
  })

  it('asks for the internal flag only when it creates a session', async () => {
    const resolveIsInternal = vi.fn(async () => true)
    await storeAnalyticsBatch(
      [
        pageView(),
        pageView({
          pageViewId: SECOND_PAGE_VIEW_ID,
          isSessionStart: false,
          sequence: 2,
          path: '/ko/project',
        }),
      ],
      context({ resolveIsInternal })
    )
    expect(resolveIsInternal).toHaveBeenCalledTimes(1)
    const [session] = await rows('select "isInternal" from analytics_sessions')
    expect(session!.isInternal).toBe(true)
  })

  it('keeps the larger engagement and scroll values', async () => {
    const engagement = (engagementMs: number, maxScrollPercent: number) =>
      ({
        type: 'engagement',
        ageMs: 0,
        pageViewId: PAGE_VIEW_ID,
        sessionId: SESSION_ID,
        engagementMs,
        maxScrollPercent,
      }) satisfies ParsedAnalyticsEvent

    await storeAnalyticsBatch([pageView(), engagement(12_000, 60)], context())
    await storeAnalyticsBatch([engagement(8_000, 90)], context())

    const [view] = await rows(
      'select "engagementMs", "maxScrollPercent" from analytics_page_views'
    )
    expect(view).toEqual({ engagementMs: 12_000, maxScrollPercent: 90 })
  })

  it('stores clicks and web vitals against the page view session', async () => {
    await storeAnalyticsBatch(
      [
        pageView(),
        {
          type: 'click',
          ageMs: 0,
          pageViewId: PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          path: '/ko',
          kind: 'cta',
          label: 'join_instagram',
          targetUrl: 'https://www.instagram.com/gdg.yonseiuniv/',
        },
        {
          type: 'web_vital',
          ageMs: 0,
          pageViewId: PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          path: '/ko',
          metric: 'LCP',
          value: 2100.5,
          rating: 'good',
        },
      ],
      context()
    )
    const events = await rows(
      'select name, label, metric, rating, value from analytics_events order by id'
    )
    expect(events).toEqual([
      {
        name: 'cta',
        label: 'join_instagram',
        metric: null,
        rating: null,
        value: null,
      },
      {
        name: 'web_vital',
        label: null,
        metric: 'LCP',
        rating: 'good',
        value: 2100.5,
      },
    ])
  })

  it('skips events whose page view never arrived and still stores the rest', async () => {
    await storeAnalyticsBatch(
      [
        pageView(),
        {
          type: 'engagement',
          ageMs: 0,
          pageViewId: SECOND_PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          engagementMs: 5_000,
          maxScrollPercent: 40,
        },
        {
          type: 'click',
          ageMs: 0,
          pageViewId: SECOND_PAGE_VIEW_ID,
          sessionId: SESSION_ID,
          path: '/ko',
          kind: 'outbound',
          targetUrl: 'https://velog.io/',
        },
      ],
      context()
    )
    expect(await rows('select id from analytics_page_views')).toHaveLength(1)
    expect(await rows('select id from analytics_events')).toHaveLength(0)
  })

  it('classifies a later page view that creates the session as Direct', async () => {
    await storeAnalyticsBatch(
      [pageView({ isSessionStart: false, sequence: 3, referrer: undefined })],
      context()
    )
    const [session] = await rows(
      'select channel, "landingPath" from analytics_sessions'
    )
    expect(session).toEqual({ channel: 'Direct', landingPath: '/ko/session' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/analytics/store.test.ts`
Expected: FAIL — module `@/lib/server/analytics/collect/store` not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/server/analytics/collect/store.ts
/**
 * 검증된 배치를 한 트랜잭션으로 저장한다. 조회를 먼저 넣고, 나머지 이벤트는 DB에 있는 조회에만 붙인다.
 * 비콘은 유실·중복될 수 있으므로 없는 조회의 이벤트는 건너뛰고, 같은 조회는 한 번만 넣는다.
 */
import 'server-only'

import { eq, inArray, sql } from 'drizzle-orm'
import { db, type Transaction } from '@/db'
import {
  analyticsEvents,
  analyticsPageViews,
  analyticsSessions,
} from '@/db/schema/analytics'
import { MAX_EVENT_AGE_MS } from '@/lib/analytics/constants'
import { classifyChannel } from '@/lib/server/analytics/collect/channel'
import {
  localeFromPath,
  normalizePath,
  parseReferrer,
} from '@/lib/server/analytics/collect/normalize'
import type {
  ParsedAnalyticsEvent,
  ParsedPageView,
} from '@/lib/server/analytics/collect/schema'
import { countryFromTimezone } from '@/lib/server/analytics/collect/timezone-country'
import type { ParsedUserAgent } from '@/lib/server/analytics/collect/user-agent'

/** 요청 단위 값. `resolveIsInternal`은 새 세션을 만들 때만 불러 로그인 확인 쿼리를 아낀다. */
export type CollectContext = {
  now: Date
  siteHost: string
  userAgent: ParsedUserAgent
  resolveIsInternal: () => Promise<boolean>
}

function occurredAt(now: Date, ageMs: number) {
  return new Date(now.getTime() - Math.min(ageMs, MAX_EVENT_AGE_MS))
}

// 드라이버마다 Date 직렬화가 달라 raw SQL에는 ISO 문자열을 timestamp로 캐스팅해 넘긴다.
function timestampParam(date: Date) {
  return sql`${date.toISOString()}::timestamp`
}

async function storePageView(
  tx: Transaction,
  event: ParsedPageView,
  context: CollectContext
) {
  const at = occurredAt(context.now, event.ageMs)
  const path = normalizePath(event.path)

  const [existing] = await tx
    .select({ id: analyticsSessions.id })
    .from(analyticsSessions)
    .where(eq(analyticsSessions.id, event.sessionId))
    .limit(1)

  if (existing) {
    await tx
      .update(analyticsSessions)
      .set({
        lastSeenAt: sql`GREATEST(${analyticsSessions.lastSeenAt}, ${timestampParam(at)})`,
      })
      .where(eq(analyticsSessions.id, event.sessionId))
  } else {
    const referrer = parseReferrer(event.referrer, context.siteHost)
    const utm = event.utm ?? {}
    await tx
      .insert(analyticsSessions)
      .values({
        id: event.sessionId,
        visitorId: event.visitorId,
        startedAt: at,
        lastSeenAt: at,
        isNewVisitor: event.isNewVisitor,
        isInternal: await context.resolveIsInternal(),
        landingPath: path,
        referrerHost: referrer?.host ?? null,
        referrerPath: referrer?.path ?? null,
        utmSource: utm.source ?? null,
        utmMedium: utm.medium ?? null,
        utmCampaign: utm.campaign ?? null,
        utmTerm: utm.term ?? null,
        utmContent: utm.content ?? null,
        channel: classifyChannel({
          referrerHost: referrer?.host ?? null,
          utmSource: utm.source,
          utmMedium: utm.medium,
          hasUtm: Object.keys(utm).length > 0,
        }),
        deviceType: context.userAgent.deviceType,
        browser: context.userAgent.browser,
        os: context.userAgent.os,
        screenWidth: event.screenWidth ?? null,
        screenHeight: event.screenHeight ?? null,
        language: event.language ?? null,
        timezone: event.timezone ?? null,
        country: countryFromTimezone(event.timezone),
      })
      // 같은 세션의 첫 비콘 두 개가 동시에 오면 나중 것은 마지막 활동 시각만 갱신한다.
      .onConflictDoUpdate({
        target: analyticsSessions.id,
        set: {
          lastSeenAt: sql`GREATEST(${analyticsSessions.lastSeenAt}, excluded."lastSeenAt")`,
        },
      })
  }

  await tx
    .insert(analyticsPageViews)
    .values({
      id: event.pageViewId,
      sessionId: event.sessionId,
      visitorId: event.visitorId,
      occurredAt: at,
      sequence: event.sequence,
      path,
      locale: localeFromPath(path),
      title: event.title ?? null,
      isNotFound: event.isNotFound,
    })
    .onConflictDoNothing({ target: analyticsPageViews.id })
}

/** 저장 실패는 호출자(수집 핸들러)가 로그로 남긴다. 부분 저장 없이 배치 전체가 롤백된다. */
export async function storeAnalyticsBatch(
  events: ParsedAnalyticsEvent[],
  context: CollectContext
): Promise<void> {
  await db.transaction(async (tx) => {
    for (const event of events) {
      if (event.type === 'page_view') await storePageView(tx, event, context)
    }

    const others = events.filter((event) => event.type !== 'page_view')
    if (others.length === 0) return

    // 세션은 클라이언트 값 대신 DB의 조회 행에서 가져온다.
    const known = await tx
      .select({
        id: analyticsPageViews.id,
        sessionId: analyticsPageViews.sessionId,
      })
      .from(analyticsPageViews)
      .where(
        inArray(analyticsPageViews.id, [
          ...new Set(others.map((event) => event.pageViewId)),
        ])
      )
    const sessionByPageView = new Map(
      known.map((row) => [row.id, row.sessionId])
    )
    const lastSeenBySession = new Map<string, Date>()

    for (const event of others) {
      const sessionId = sessionByPageView.get(event.pageViewId)
      if (!sessionId) continue
      const at = occurredAt(context.now, event.ageMs)

      if (event.type === 'engagement') {
        await tx
          .update(analyticsPageViews)
          .set({
            engagementMs: sql`GREATEST(${analyticsPageViews.engagementMs}, ${event.engagementMs})`,
            maxScrollPercent: sql`GREATEST(${analyticsPageViews.maxScrollPercent}, ${event.maxScrollPercent})`,
          })
          .where(eq(analyticsPageViews.id, event.pageViewId))
      } else if (event.type === 'click') {
        await tx.insert(analyticsEvents).values({
          sessionId,
          pageViewId: event.pageViewId,
          occurredAt: at,
          name: event.kind,
          path: normalizePath(event.path),
          label: event.label ?? null,
          targetUrl: event.targetUrl ?? null,
        })
      } else {
        await tx.insert(analyticsEvents).values({
          sessionId,
          pageViewId: event.pageViewId,
          occurredAt: at,
          name: 'web_vital',
          path: normalizePath(event.path),
          metric: event.metric,
          rating: event.rating,
          value: event.value,
        })
      }

      const previous = lastSeenBySession.get(sessionId)
      if (!previous || previous < at) lastSeenBySession.set(sessionId, at)
    }

    for (const [sessionId, at] of lastSeenBySession) {
      await tx
        .update(analyticsSessions)
        .set({
          lastSeenAt: sql`GREATEST(${analyticsSessions.lastSeenAt}, ${timestampParam(at)})`,
        })
        .where(eq(analyticsSessions.id, sessionId))
    }
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/lib/analytics/store.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/server/analytics/collect/store.ts tests/lib/analytics/store.test.ts tests/helpers
git commit -m "feat(analytics): store collected batches in one transaction"
```

---

### Task 6: 속도 제한과 보관 기간 정리

**Files:**

- Create: `lib/server/analytics/collect/rate-limit.ts`
- Create: `lib/server/analytics/collect/retention.ts`
- Test: `tests/lib/analytics/rate-limit.test.ts`
- Test: `tests/lib/analytics/retention.test.ts`

**Interfaces:**

- Produces:
  - `type RateLimiter = { consume(key: string, cost: number): boolean }`, `createMemoryRateLimiter(options: { limit: number; windowMs: number; now?: () => number }): RateLimiter`, `getCollectRateLimiter(): RateLimiter`
  - `retentionCutoff(now: Date): Date`, `claimPruneSlot(now: Date): boolean`, `pruneExpiredAnalytics(now: Date): Promise<number>`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/analytics/rate-limit.test.ts
import { describe, expect, it } from 'vitest'
import { createMemoryRateLimiter } from '@/lib/server/analytics/collect/rate-limit'

describe('createMemoryRateLimiter', () => {
  it('allows up to the limit per window and resets after it', () => {
    let now = 0
    const limiter = createMemoryRateLimiter({
      limit: 120,
      windowMs: 60_000,
      now: () => now,
    })

    expect(limiter.consume('1.2.3.4', 100)).toBe(true)
    expect(limiter.consume('1.2.3.4', 20)).toBe(true)
    expect(limiter.consume('1.2.3.4', 1)).toBe(false)
    expect(limiter.consume('5.6.7.8', 1)).toBe(true)

    now = 60_000
    expect(limiter.consume('1.2.3.4', 1)).toBe(true)
  })
})
```

```ts
// tests/lib/analytics/retention.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const testDb = vi.hoisted(() => ({
  current: null as null | Awaited<
    ReturnType<
      typeof import('@/tests/helpers/analytics-test-db').createAnalyticsTestDb
    >
  >,
}))

vi.mock('@/db', () => ({
  get db() {
    return testDb.current!.db
  },
}))

import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'
import {
  claimPruneSlot,
  pruneExpiredAnalytics,
  retentionCutoff,
} from '@/lib/server/analytics/collect/retention'

const NOW = new Date('2026-10-14T05:00:00.000Z')

async function insertSession(id: string, lastSeenAt: string) {
  await testDb.current!.client.query(
    `insert into analytics_sessions (id, "visitorId", "startedAt", "lastSeenAt", "isNewVisitor", "isInternal",
      "landingPath", channel, "deviceType", browser, os, country)
     values ($1, $1, $2, $2, true, false, '/ko', 'Direct', 'desktop', 'Chrome', 'macOS', 'KR')`,
    [id, lastSeenAt]
  )
}

beforeEach(async () => {
  testDb.current = await createAnalyticsTestDb()
})

describe('retention', () => {
  it('cuts off 26 months before now', () => {
    expect(retentionCutoff(NOW).toISOString()).toBe('2024-08-14T05:00:00.000Z')
  })

  it('deletes only sessions last seen before the cutoff', async () => {
    await insertSession(
      '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11',
      '2024-08-14 04:59:59'
    )
    await insertSession(
      '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22',
      '2024-08-14 05:00:01'
    )

    await expect(pruneExpiredAnalytics(NOW)).resolves.toBe(1)
    const left = await testDb.current!.client.query<{ id: string }>(
      'select id from analytics_sessions'
    )
    expect(left.rows.map((row) => row.id)).toEqual([
      '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22',
    ])
  })

  it('grants one prune slot per day per instance', () => {
    expect(claimPruneSlot(NOW)).toBe(true)
    expect(claimPruneSlot(new Date(NOW.getTime() + 60_000))).toBe(false)
    expect(claimPruneSlot(new Date(NOW.getTime() + 24 * 60 * 60 * 1000))).toBe(
      true
    )
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/lib/analytics/rate-limit.test.ts tests/lib/analytics/retention.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/server/analytics/collect/rate-limit.ts
/** 공개 수집 엔드포인트의 IP별 고정 창 제한. 운영이 단일 인스턴스라 메모리로 충분하다. IP는 키로만 쓰고 저장하지 않는다. */
import 'server-only'

/** `consume`은 비용을 차감하고 한도 안이면 true를 돌려준다. */
export type RateLimiter = { consume(key: string, cost: number): boolean }

// 키가 많이 쌓이면 지난 창을 한 번에 비워 메모리가 계속 늘지 않게 한다.
const PRUNE_THRESHOLD = 10_000

export function createMemoryRateLimiter(options: {
  limit: number
  windowMs: number
  now?: () => number
}): RateLimiter {
  const { limit, windowMs, now = Date.now } = options
  const windows = new Map<string, { startedAt: number; count: number }>()

  return {
    consume(key, cost) {
      const current = now()
      if (windows.size > PRUNE_THRESHOLD) {
        for (const [storedKey, window] of windows) {
          if (current - window.startedAt >= windowMs) windows.delete(storedKey)
        }
      }

      const window = windows.get(key)
      if (!window || current - window.startedAt >= windowMs) {
        windows.set(key, { startedAt: current, count: cost })
        return cost <= limit
      }
      window.count += cost
      return window.count <= limit
    },
  }
}

let collectRateLimiter: RateLimiter | null = null

/** IP당 분당 120 이벤트. 일반 방문은 분당 수십 개를 넘지 않는다. */
export function getCollectRateLimiter(): RateLimiter {
  collectRateLimiter ??= createMemoryRateLimiter({
    limit: 120,
    windowMs: 60_000,
  })
  return collectRateLimiter
}
```

```ts
// lib/server/analytics/collect/retention.ts
/**
 * 보관 기간이 지난 세션을 지운다(조회·이벤트는 FK cascade). 스케줄러가 없어 수집 API가 응답 뒤에 하루 한 번 부른다.
 * 인스턴스마다 하루 한 번씩 돌아도 결과가 같다.
 */
import 'server-only'

import { inArray, lt } from 'drizzle-orm'
import { db } from '@/db'
import { analyticsSessions } from '@/db/schema/analytics'
import { RETENTION_MONTHS } from '@/lib/analytics/constants'

const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000
// 한 번에 지우는 행을 제한해 긴 잠금을 피한다.
const PRUNE_BATCH_SIZE = 10_000

let lastPrunedAt = Number.NEGATIVE_INFINITY

/** 지금부터 26개월 전 시각. 마지막 활동이 이보다 이전인 세션이 삭제 대상이다. */
export function retentionCutoff(now: Date): Date {
  const cutoff = new Date(now.getTime())
  cutoff.setUTCMonth(cutoff.getUTCMonth() - RETENTION_MONTHS)
  return cutoff
}

/** 마지막 정리 후 24시간이 지났으면 자리를 차지하고 true를 돌려준다. */
export function claimPruneSlot(now: Date): boolean {
  if (now.getTime() - lastPrunedAt < PRUNE_INTERVAL_MS) return false
  lastPrunedAt = now.getTime()
  return true
}

/** 지운 세션 수를 돌려준다. */
export async function pruneExpiredAnalytics(now: Date): Promise<number> {
  const cutoff = retentionCutoff(now)
  let total = 0
  for (;;) {
    const expired = db
      .select({ id: analyticsSessions.id })
      .from(analyticsSessions)
      .where(lt(analyticsSessions.lastSeenAt, cutoff))
      .limit(PRUNE_BATCH_SIZE)
    const deleted = await db
      .delete(analyticsSessions)
      .where(inArray(analyticsSessions.id, expired))
      .returning({ id: analyticsSessions.id })
    total += deleted.length
    if (deleted.length < PRUNE_BATCH_SIZE) return total
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/lib/analytics/rate-limit.test.ts tests/lib/analytics/retention.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/analytics/collect tests/lib/analytics
git commit -m "feat(analytics): rate limit collection and prune data older than 26 months"
```

---

### Task 7: 수집 요청 처리와 `POST /api/pulse`

**Files:**

- Create: `lib/server/analytics/collect/handle-collect.ts`
- Create: `app/api/pulse/route.ts`
- Test: `tests/lib/analytics/handle-collect.test.ts`

**Interfaces:**

- Consumes: `analyticsBatchSchema` (Task 1), `parseUserAgent`/`isBotUserAgent` (Task 2), `storeAnalyticsBatch`/`CollectContext` (Task 5), `RateLimiter`/`getCollectRateLimiter`/`claimPruneSlot`/`pruneExpiredAnalytics` (Task 6), `hasApprovedSession(request: NextRequest): Promise<boolean>` (`lib/server/admin-route-exists.ts`), `runAfterResponse` (`lib/server/after-response.ts`), `getSiteEnv()` (`lib/server/env.ts`)
- Produces: `type CollectDependencies`, `handleCollectRequest(request: NextRequest, dependencies?: CollectDependencies): Promise<Response>`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/analytics/handle-collect.test.ts
import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { pruneExpiredAnalytics } = vi.hoisted(() => ({
  pruneExpiredAnalytics: vi.fn(async () => 0),
}))

vi.mock('@/lib/server/admin-route-exists', () => ({
  hasApprovedSession: vi.fn(async () => false),
}))
vi.mock('@/lib/server/analytics/collect/retention', () => ({
  claimPruneSlot: vi.fn(() => true),
  pruneExpiredAnalytics,
}))

import {
  handleCollectRequest,
  type CollectDependencies,
} from '@/lib/server/analytics/collect/handle-collect'

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'

const batch = {
  events: [
    {
      type: 'page_view',
      ageMs: 0,
      pageViewId: '9f1e2d3c-4b5a-4c6d-8e7f-0a1b2c3d4e33',
      sessionId: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11',
      visitorId: '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22',
      isNewVisitor: true,
      isSessionStart: true,
      sequence: 1,
      path: '/ko',
      isNotFound: false,
    },
  ],
}

function request(
  body: string = JSON.stringify(batch),
  headers: Record<string, string> = {}
) {
  return new NextRequest('https://gdgoc.yonsei.ac.kr/api/pulse', {
    method: 'POST',
    body,
    headers: {
      origin: 'https://gdgoc.yonsei.ac.kr',
      'user-agent': CHROME,
      'x-forwarded-for': '203.0.113.7, 10.0.0.1',
      ...headers,
    },
  })
}

function dependencies(
  overrides: Partial<CollectDependencies> = {}
): CollectDependencies {
  return {
    store: vi.fn(async () => {}),
    rateLimiter: { consume: vi.fn(() => true) },
    isInternal: vi.fn(async () => false),
    now: () => new Date('2026-10-14T05:00:00.000Z'),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('handleCollectRequest', () => {
  it('stores a valid same-origin batch and answers 204', async () => {
    const deps = dependencies()
    const response = await handleCollectRequest(request(), deps)

    expect(response.status).toBe(204)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(deps.rateLimiter.consume).toHaveBeenCalledWith('203.0.113.7', 1)
    expect(deps.store).toHaveBeenCalledWith(
      batch.events,
      expect.objectContaining({
        siteHost: 'gdgoc.yonsei.ac.kr',
        userAgent: { deviceType: 'desktop', browser: 'Chrome', os: 'Windows' },
      })
    )
    expect(pruneExpiredAnalytics).toHaveBeenCalledTimes(1)
  })

  it.each([
    [
      'a foreign origin',
      request(undefined, { origin: 'https://evil.example' }),
    ],
    ['a bot user agent', request(undefined, { 'user-agent': 'curl/8.9.1' })],
    ['invalid JSON', request('{not json')],
    ['a schema violation', request(JSON.stringify({ events: [] }))],
    [
      'an oversized body',
      request(JSON.stringify({ ...batch, pad: 'x'.repeat(17_000) })),
    ],
  ])('drops %s with 204', async (_label, incoming) => {
    const deps = dependencies()
    const response = await handleCollectRequest(incoming, deps)
    expect(response.status).toBe(204)
    expect(deps.store).not.toHaveBeenCalled()
  })

  it('accepts a missing Origin only for same-origin fetch metadata', async () => {
    const deps = dependencies()
    await handleCollectRequest(
      request(undefined, { origin: '', 'sec-fetch-site': 'same-origin' }),
      deps
    )
    expect(deps.store).toHaveBeenCalledTimes(1)
  })

  it('drops the batch when the rate limit is exceeded', async () => {
    const deps = dependencies({ rateLimiter: { consume: vi.fn(() => false) } })
    await handleCollectRequest(request(), deps)
    expect(deps.store).not.toHaveBeenCalled()
  })

  it('resolves the internal flag lazily and once', async () => {
    const isInternal = vi.fn(async () => true)
    const store = vi.fn<CollectDependencies['store']>(
      async (_events, context) => {
        await expect(context.resolveIsInternal()).resolves.toBe(true)
        await expect(context.resolveIsInternal()).resolves.toBe(true)
      }
    )
    await handleCollectRequest(request(), dependencies({ isInternal, store }))
    expect(isInternal).toHaveBeenCalledTimes(1)
  })

  it('treats a failing internal check as external traffic', async () => {
    const store = vi.fn<CollectDependencies['store']>(
      async (_events, context) => {
        await expect(context.resolveIsInternal()).resolves.toBe(false)
      }
    )
    await handleCollectRequest(
      request(),
      dependencies({
        isInternal: vi.fn(async () => Promise.reject(new Error('db down'))),
        store,
      })
    )
    expect(store).toHaveBeenCalledTimes(1)
  })

  it('answers 204 even when storing fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const response = await handleCollectRequest(
      request(),
      dependencies({
        store: vi.fn(async () => Promise.reject(new Error('db down'))),
      })
    )
    expect(response.status).toBe(204)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/analytics/handle-collect.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/server/analytics/collect/handle-collect.ts
/**
 * 수집 요청 처리 순서: 출처 → 크기 → 스키마 → 봇 → 속도 제한 → 저장 → 응답 뒤 정리.
 * 거부 이유를 드러내지 않고 항상 204를 돌려줘 트래커가 재시도하지 않게 한다(중복보다 손실을 택함).
 */
import 'server-only'

import type { NextRequest } from 'next/server'
import { MAX_BODY_BYTES } from '@/lib/analytics/constants'
import { hasApprovedSession } from '@/lib/server/admin-route-exists'
import { runAfterResponse } from '@/lib/server/after-response'
import {
  getCollectRateLimiter,
  type RateLimiter,
} from '@/lib/server/analytics/collect/rate-limit'
import {
  claimPruneSlot,
  pruneExpiredAnalytics,
} from '@/lib/server/analytics/collect/retention'
import { analyticsBatchSchema } from '@/lib/server/analytics/collect/schema'
import { storeAnalyticsBatch } from '@/lib/server/analytics/collect/store'
import {
  isBotUserAgent,
  parseUserAgent,
} from '@/lib/server/analytics/collect/user-agent'
import { getSiteEnv } from '@/lib/server/env'
import { logger } from '@/lib/server/logger'

/** 테스트에서 저장·제한·로그인 확인을 바꿔 끼울 수 있게 모았다. */
export type CollectDependencies = {
  store: typeof storeAnalyticsBatch
  rateLimiter: RateLimiter
  isInternal: (request: NextRequest) => Promise<boolean>
  now: () => Date
}

function defaultDependencies(): CollectDependencies {
  return {
    store: storeAnalyticsBatch,
    rateLimiter: getCollectRateLimiter(),
    isInternal: hasApprovedSession,
    now: () => new Date(),
  }
}

function noContent() {
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  })
}

// 프록시 뒤에서 사이트 주소와 요청 호스트가 다를 수 있어 Host 헤더와 같은 출처도 허용한다.
function isSameOrigin(request: NextRequest, siteOrigin: string) {
  const origin = request.headers.get('origin')
  if (!origin) return request.headers.get('sec-fetch-site') === 'same-origin'
  if (origin === siteOrigin) return true
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    return host !== null && new URL(origin).host === host
  } catch {
    return false
  }
}

function clientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function parseJson(body: string): unknown {
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

/** `/api/pulse`의 본체. 항상 204 응답을 돌려준다. */
export async function handleCollectRequest(
  request: NextRequest,
  dependencies: CollectDependencies = defaultDependencies()
): Promise<Response> {
  const siteOrigin = new URL(getSiteEnv().NEXT_PUBLIC_SITE_URL).origin
  if (!isSameOrigin(request, siteOrigin)) return noContent()

  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return noContent()
  }
  const body = await request.text()
  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES)
    return noContent()

  const parsed = analyticsBatchSchema.safeParse(parseJson(body))
  if (!parsed.success) return noContent()

  const userAgent = request.headers.get('user-agent')
  if (isBotUserAgent(userAgent)) return noContent()

  const { events } = parsed.data
  if (!dependencies.rateLimiter.consume(clientIp(request), events.length)) {
    return noContent()
  }

  const now = dependencies.now()
  let internal: Promise<boolean> | null = null
  try {
    await dependencies.store(events, {
      now,
      siteHost: new URL(siteOrigin).hostname,
      userAgent: parseUserAgent(userAgent ?? ''),
      // 로그인 확인이 실패해도 방문 기록은 남긴다. 내부 표시만 빠진다.
      resolveIsInternal: () =>
        (internal ??= dependencies.isInternal(request).catch(() => false)),
    })
  } catch (error) {
    logger.error('analytics.collect', error, { events: events.length })
  }

  if (claimPruneSlot(now)) {
    runAfterResponse('analytics.prune', async () => {
      const deleted = await pruneExpiredAnalytics(now)
      if (deleted > 0)
        logger.info('analytics.prune', 'Deleted expired sessions', { deleted })
    })
  }
  return noContent()
}
```

```ts
// app/api/pulse/route.ts
/** 공개 사이트 트래커의 수집 엔드포인트. 처리 규칙은 lib/server/analytics/collect/handle-collect.ts에 있다. */
import type { NextRequest } from 'next/server'
import { handleCollectRequest } from '@/lib/server/analytics/collect/handle-collect'

export function POST(request: NextRequest) {
  return handleCollectRequest(request)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/lib/analytics/handle-collect.test.ts`
Expected: PASS

- [ ] **Step 5: Full checks and commit**

Run: `pnpm test:types && pnpm lint --max-warnings=0 && pnpm test`
Expected: 모두 통과

```bash
git add lib/server/analytics/collect/handle-collect.ts app/api/pulse tests/lib/analytics/handle-collect.test.ts
git commit -m "feat(analytics): accept beacons at /api/pulse"
```

---

### Task 8: 트래커 기본 모듈 (식별자, 참여 시간, 스크롤, 클릭 분류, 큐)

**Files:**

- Create: `lib/analytics/tracker/identity.ts`
- Create: `lib/analytics/tracker/engagement.ts`
- Create: `lib/analytics/tracker/scroll.ts`
- Create: `lib/analytics/tracker/clicks.ts`
- Create: `lib/analytics/tracker/queue.ts`
- Test: `tests/lib/analytics/tracker-identity.test.ts`
- Test: `tests/lib/analytics/tracker-parts.test.ts`

**Interfaces:**

- Consumes: 상수 (Task 1), `ClickKind`, `QueuedAnalyticsEvent` (Task 1)
- Produces:
  - `type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>`
  - `type PageViewIdentity = { visitorId: string; sessionId: string; isNewVisitor: boolean; isSessionStart: boolean; sequence: number }`
  - `isTrackingAllowed(navigator: Navigator, storage: KeyValueStorage): boolean`, `startPageView(storage: KeyValueStorage, now: number, createId: () => string, persistent: boolean): PageViewIdentity`, `touchSession(storage: KeyValueStorage, now: number): void`, `optOut(storage: KeyValueStorage): void`, `optIn(storage: KeyValueStorage): void`
  - `type EngagementTimer = { pause(): void; resume(): void; total(): number }`, `createEngagementTimer(now: () => number, startActive: boolean): EngagementTimer`
  - `scrollPercent(scrollY: number, viewportHeight: number, documentHeight: number): number`
  - `type ClassifiedClick = { kind: ClickKind; label?: string; targetUrl?: string }`, `classifyClick(link: { href: string | null; ctaLabel: string | null; download: boolean }, pageOrigin: string): ClassifiedClick | null`
  - `type EventQueue = { push(event: QueuedAnalyticsEvent, options?: { immediate?: boolean }): void; flush(): void }`, `createEventQueue(send: (body: string) => void, now: () => number): EventQueue`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/analytics/tracker-identity.test.ts
import { describe, expect, it } from 'vitest'
import {
  isTrackingAllowed,
  optIn,
  optOut,
  startPageView,
  touchSession,
  type KeyValueStorage,
} from '@/lib/analytics/tracker/identity'

function memoryStorage(
  initial: Record<string, string> = {}
): KeyValueStorage & {
  data: Record<string, string>
} {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
    removeItem: (key) => {
      delete data[key]
    },
  }
}

const ids = () => {
  let n = 0
  return () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`
}

const MINUTE = 60_000

describe('startPageView', () => {
  it('creates a visitor and a session on the first visit', () => {
    const storage = memoryStorage()
    const visit = startPageView(storage, 0, ids(), true)
    expect(visit).toEqual({
      visitorId: '00000000-0000-4000-8000-000000000001',
      sessionId: '00000000-0000-4000-8000-000000000002',
      isNewVisitor: true,
      isSessionStart: true,
      sequence: 1,
    })
  })

  it('continues the session within 30 minutes and keeps the new-visitor flag', () => {
    const storage = memoryStorage()
    const createId = ids()
    const first = startPageView(storage, 0, createId, true)
    const second = startPageView(storage, 29 * MINUTE, createId, true)
    expect(second).toEqual({ ...first, isSessionStart: false, sequence: 2 })
  })

  it('starts a returning-visitor session after 30 minutes of inactivity', () => {
    const storage = memoryStorage()
    const createId = ids()
    const first = startPageView(storage, 0, createId, true)
    const later = startPageView(storage, 31 * MINUTE, createId, true)
    expect(later.visitorId).toBe(first.visitorId)
    expect(later.sessionId).not.toBe(first.sessionId)
    expect(later).toMatchObject({
      isNewVisitor: false,
      isSessionStart: true,
      sequence: 1,
    })
  })

  it('extends the session when activity is touched', () => {
    const storage = memoryStorage()
    const createId = ids()
    const first = startPageView(storage, 0, createId, true)
    touchSession(storage, 25 * MINUTE)
    expect(startPageView(storage, 50 * MINUTE, createId, true).sessionId).toBe(
      first.sessionId
    )
  })

  it('replaces a corrupted visitor id and session', () => {
    const storage = memoryStorage({ gyms_vid: 'tampered', gyms_sid: '{broken' })
    const visit = startPageView(storage, 0, ids(), true)
    expect(visit.visitorId).toBe('00000000-0000-4000-8000-000000000001')
    expect(visit.isSessionStart).toBe(true)
  })

  it('never reports a new visitor without persistent storage', () => {
    expect(startPageView(memoryStorage(), 0, ids(), false).isNewVisitor).toBe(
      false
    )
  })
})

describe('isTrackingAllowed', () => {
  const nav = (extra: object = {}) =>
    ({ webdriver: false, ...extra }) as unknown as Navigator

  it('honours GPC, webdriver and the opt-out flag', () => {
    expect(isTrackingAllowed(nav(), memoryStorage())).toBe(true)
    expect(
      isTrackingAllowed(nav({ globalPrivacyControl: true }), memoryStorage())
    ).toBe(false)
    expect(isTrackingAllowed(nav({ webdriver: true }), memoryStorage())).toBe(
      false
    )
    expect(isTrackingAllowed(nav(), memoryStorage({ gyms_optout: '1' }))).toBe(
      false
    )
  })

  it('opting out removes identifiers and opting in clears the flag', () => {
    const storage = memoryStorage()
    startPageView(storage, 0, ids(), true)
    optOut(storage)
    expect(storage.data).toEqual({ gyms_optout: '1' })
    optIn(storage)
    expect(storage.data).toEqual({})
  })
})
```

```ts
// tests/lib/analytics/tracker-parts.test.ts
import { describe, expect, it, vi } from 'vitest'
import { classifyClick } from '@/lib/analytics/tracker/clicks'
import { createEngagementTimer } from '@/lib/analytics/tracker/engagement'
import { createEventQueue } from '@/lib/analytics/tracker/queue'
import { scrollPercent } from '@/lib/analytics/tracker/scroll'

const ORIGIN = 'https://gdgoc.yonsei.ac.kr'

describe('createEngagementTimer', () => {
  it('counts only active time', () => {
    let now = 0
    const timer = createEngagementTimer(() => now, true)
    now = 5_000
    timer.pause()
    now = 65_000
    timer.resume()
    now = 70_000
    expect(timer.total()).toBe(10_000)
  })

  it('starts paused for a hidden page and ignores repeated calls', () => {
    let now = 0
    const timer = createEngagementTimer(() => now, false)
    now = 1_000
    timer.resume()
    timer.resume()
    now = 3_000
    timer.pause()
    timer.pause()
    expect(timer.total()).toBe(2_000)
  })
})

describe('scrollPercent', () => {
  it('reports how far the viewport bottom reached', () => {
    expect(scrollPercent(0, 800, 4_000)).toBe(20)
    expect(scrollPercent(3_200, 800, 4_000)).toBe(100)
    expect(scrollPercent(0, 800, 600)).toBe(100)
  })
})

describe('classifyClick', () => {
  const link = (
    href: string | null,
    extra: Partial<{ ctaLabel: string; download: boolean }> = {}
  ) => ({
    href,
    ctaLabel: extra.ctaLabel ?? null,
    download: extra.download ?? false,
  })

  it.each([
    [
      link('https://www.instagram.com/gdg.yonseiuniv/?igsh=x'),
      {
        kind: 'outbound',
        targetUrl: 'https://www.instagram.com/gdg.yonseiuniv/',
      },
    ],
    [
      link('mailto:gdsc.yonsei.univ@gmail.com?subject=hi'),
      { kind: 'contact', targetUrl: 'mailto:gdsc.yonsei.univ@gmail.com' },
    ],
    [
      link(`${ORIGIN}/files/intro.pdf`),
      { kind: 'download', targetUrl: '/files/intro.pdf' },
    ],
    [
      link('webcal://calendar.google.com/calendar/ical/x/public/basic.ics'),
      {
        kind: 'download',
        targetUrl:
          'webcal://calendar.google.com/calendar/ical/x/public/basic.ics',
      },
    ],
    [
      link(`${ORIGIN}/ko/calendar`, { ctaLabel: 'join_calendar' }),
      { kind: 'cta', label: 'join_calendar', targetUrl: '/ko/calendar' },
    ],
    [
      link(null, { ctaLabel: 'join_button' }),
      { kind: 'cta', label: 'join_button', targetUrl: undefined },
    ],
  ])('classifies %o', (input, expected) => {
    expect(classifyClick(input, ORIGIN)).toEqual(expected)
  })

  it('ignores ordinary internal links', () => {
    expect(classifyClick(link(`${ORIGIN}/ko/project`), ORIGIN)).toBeNull()
  })
})

describe('createEventQueue', () => {
  const event = (n: number) => ({
    type: 'engagement' as const,
    pageViewId: `p${n}`,
    sessionId: 's',
    engagementMs: n,
    maxScrollPercent: 0,
  })

  it('flushes immediately on request, at 10 events, and adds ageMs', () => {
    let now = 0
    const send = vi.fn()
    const queue = createEventQueue(send, () => now)

    queue.push(event(1))
    now = 250
    queue.push(event(2), { immediate: true })
    expect(send).toHaveBeenCalledTimes(1)
    expect(JSON.parse(send.mock.calls[0]![0] as string)).toEqual({
      events: [
        { ...event(1), ageMs: 250 },
        { ...event(2), ageMs: 0 },
      ],
    })

    for (let n = 0; n < 10; n += 1) queue.push(event(n))
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('splits a large flush into batches of 20', () => {
    const send = vi.fn()
    const queue = createEventQueue(send, () => 0)
    for (let n = 0; n < 9; n += 1) queue.push(event(n))
    queue.flush()
    queue.flush()
    expect(send).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/lib/analytics/tracker-identity.test.ts tests/lib/analytics/tracker-parts.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/analytics/tracker/identity.ts
/** 브라우저 저장소의 익명 방문자 ID와 30분 세션. IP·쿠키는 쓰지 않는다. 클라이언트 번들용이라 의존성이 없다. */
import {
  OPT_OUT_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  SESSION_TIMEOUT_MS,
  VISITOR_STORAGE_KEY,
} from '@/lib/analytics/constants'

/** localStorage 또는 그 대체물. 저장소를 쓸 수 없는 브라우저는 메모리 대체물을 넘긴다. */
export type KeyValueStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>

export type PageViewIdentity = {
  visitorId: string
  sessionId: string
  isNewVisitor: boolean
  isSessionStart: boolean
  sequence: number
}

type StoredSession = {
  id: string
  lastActivityAt: number
  isNewVisitor: boolean
  sequence: number
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function readSession(storage: KeyValueStorage): StoredSession | null {
  try {
    const value = JSON.parse(
      storage.getItem(SESSION_STORAGE_KEY) ?? 'null'
    ) as Partial<StoredSession> | null
    if (
      !value ||
      typeof value.id !== 'string' ||
      !UUID_PATTERN.test(value.id) ||
      typeof value.lastActivityAt !== 'number' ||
      typeof value.sequence !== 'number'
    ) {
      return null
    }
    return {
      id: value.id,
      lastActivityAt: value.lastActivityAt,
      isNewVisitor: value.isNewVisitor === true,
      sequence: value.sequence,
    }
  } catch {
    return null
  }
}

/** GPC, 자동화 브라우저, 처리방침의 거부 설정 중 하나라도 있으면 아무것도 보내지 않는다. */
export function isTrackingAllowed(
  navigator: Navigator,
  storage: KeyValueStorage
): boolean {
  const privacy = navigator as Navigator & { globalPrivacyControl?: boolean }
  return (
    privacy.globalPrivacyControl !== true &&
    navigator.webdriver !== true &&
    storage.getItem(OPT_OUT_STORAGE_KEY) !== '1'
  )
}

/**
 * 페이지 조회 하나를 세션에 기록하고 식별자를 돌려준다.
 * `persistent`가 false면(저장소 없음) 매번 처음 보는 사람처럼 보이므로 신규 방문자로 세지 않는다.
 */
export function startPageView(
  storage: KeyValueStorage,
  now: number,
  createId: () => string,
  persistent: boolean
): PageViewIdentity {
  let visitorId = storage.getItem(VISITOR_STORAGE_KEY)
  const isFirstVisit = visitorId === null || !UUID_PATTERN.test(visitorId)
  if (visitorId === null || isFirstVisit) {
    visitorId = createId()
    storage.setItem(VISITOR_STORAGE_KEY, visitorId)
  }

  const previous = readSession(storage)
  const isSessionStart =
    !previous || now - previous.lastActivityAt > SESSION_TIMEOUT_MS
  const session: StoredSession =
    !previous || isSessionStart
      ? {
          id: createId(),
          lastActivityAt: now,
          isNewVisitor: persistent && isFirstVisit,
          sequence: 1,
        }
      : { ...previous, lastActivityAt: now, sequence: previous.sequence + 1 }
  storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))

  return {
    visitorId,
    sessionId: session.id,
    isNewVisitor: session.isNewVisitor,
    isSessionStart,
    sequence: session.sequence,
  }
}

/** 클릭 같은 활동이 있으면 세션 만료를 늦춘다. 이미 만료된 세션은 살리지 않는다. */
export function touchSession(storage: KeyValueStorage, now: number): void {
  const session = readSession(storage)
  if (session && now - session.lastActivityAt <= SESSION_TIMEOUT_MS) {
    storage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ ...session, lastActivityAt: now })
    )
  }
}

/** 거부하면 식별자도 지워, 다시 허용했을 때 이전 방문과 이어지지 않게 한다. */
export function optOut(storage: KeyValueStorage): void {
  storage.setItem(OPT_OUT_STORAGE_KEY, '1')
  storage.removeItem(VISITOR_STORAGE_KEY)
  storage.removeItem(SESSION_STORAGE_KEY)
}

export function optIn(storage: KeyValueStorage): void {
  storage.removeItem(OPT_OUT_STORAGE_KEY)
}
```

```ts
// lib/analytics/tracker/engagement.ts
/** 탭이 보이고 포커스가 있는 동안만 참여 시간을 센다(GA4 user_engagement와 같은 의미). */

export type EngagementTimer = {
  pause(): void
  resume(): void
  total(): number
}

export function createEngagementTimer(
  now: () => number,
  startActive: boolean
): EngagementTimer {
  let accumulated = 0
  let activeSince: number | null = startActive ? now() : null

  return {
    pause() {
      if (activeSince === null) return
      accumulated += now() - activeSince
      activeSince = null
    },
    resume() {
      activeSince ??= now()
    },
    total() {
      return accumulated + (activeSince === null ? 0 : now() - activeSince)
    },
  }
}
```

```ts
// lib/analytics/tracker/scroll.ts
/** 화면 아래쪽 끝이 문서의 몇 %까지 내려왔는지. 스크롤할 필요가 없는 짧은 문서는 끝까지 본 것으로 센다. */
export function scrollPercent(
  scrollY: number,
  viewportHeight: number,
  documentHeight: number
): number {
  if (documentHeight <= viewportHeight) return 100
  const percent = Math.round(
    ((scrollY + viewportHeight) / documentHeight) * 100
  )
  return Math.min(100, Math.max(0, percent))
}
```

```ts
// lib/analytics/tracker/clicks.ts
/** 클릭한 링크를 핵심 이벤트(CTA), 연락처, 다운로드, 외부 링크로 나눈다. 쿼리는 개인정보가 섞일 수 있어 보내지 않는다. */
import type { ClickKind } from '@/lib/analytics/events'

export type ClassifiedClick = {
  kind: ClickKind
  label?: string
  targetUrl?: string
}

const DOWNLOAD_PATTERN =
  /\.(pdf|zip|pptx?|docx?|xlsx?|csv|hwpx?|key|dmg|apk|ics)$/i

function parse(href: string, base: string) {
  try {
    return new URL(href, base)
  } catch {
    return null
  }
}

function describeTarget(url: URL, pageOrigin: string) {
  if (url.protocol === 'mailto:' || url.protocol === 'tel:')
    return url.href.split('?')[0]
  if (url.origin === pageOrigin) return url.pathname
  return `${url.protocol === 'webcal:' ? 'webcal://' + url.host : url.origin}${url.pathname}`
}

/** 집계할 필요가 없는 내부 링크는 null. */
export function classifyClick(
  link: { href: string | null; ctaLabel: string | null; download: boolean },
  pageOrigin: string
): ClassifiedClick | null {
  const url = link.href ? parse(link.href, pageOrigin) : null
  const targetUrl = url ? describeTarget(url, pageOrigin) : undefined
  const label = link.ctaLabel?.trim().slice(0, 100)

  if (label) return { kind: 'cta', label, targetUrl }
  if (!url) return null
  if (url.protocol === 'mailto:' || url.protocol === 'tel:')
    return { kind: 'contact', targetUrl }
  if (link.download || DOWNLOAD_PATTERN.test(url.pathname))
    return { kind: 'download', targetUrl }
  if (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    url.origin !== pageOrigin
  ) {
    return { kind: 'outbound', targetUrl }
  }
  return null
}
```

```ts
// lib/analytics/tracker/queue.ts
/** 이벤트를 모았다가 배치로 보낸다. 전송 직전에 경과 시간(ageMs)을 붙여 서버가 자기 시계로 발생 시각을 계산하게 한다. */
import { MAX_BATCH_EVENTS } from '@/lib/analytics/constants'
import type { QueuedAnalyticsEvent } from '@/lib/analytics/events'

export type EventQueue = {
  push(event: QueuedAnalyticsEvent, options?: { immediate?: boolean }): void
  flush(): void
}

// 이만큼 쌓이면 탭이 숨겨지기 전에도 보낸다. 오래 머무는 탭에서 이벤트를 잃지 않게 한다.
const FLUSH_SIZE = 10

export function createEventQueue(
  send: (body: string) => void,
  now: () => number
): EventQueue {
  const pending: Array<{ event: QueuedAnalyticsEvent; createdAt: number }> = []

  function flush() {
    while (pending.length > 0) {
      const batch = pending.splice(0, MAX_BATCH_EVENTS)
      const sentAt = now()
      send(
        JSON.stringify({
          events: batch.map(({ event, createdAt }) => ({
            ...event,
            ageMs: Math.max(0, Math.round(sentAt - createdAt)),
          })),
        })
      )
    }
  }

  return {
    push(event, options) {
      pending.push({ event, createdAt: now() })
      if (options?.immediate || pending.length >= FLUSH_SIZE) flush()
    },
    flush,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/lib/analytics/tracker-identity.test.ts tests/lib/analytics/tracker-parts.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/analytics/tracker tests/lib/analytics
git commit -m "feat(analytics): add tracker identity, engagement, scroll, click and queue modules"
```

---

### Task 9: 트래커 조립 (`createTracker`)

**Files:**

- Create: `lib/analytics/tracker/tracker.ts`
- Test: `tests/lib/analytics/tracker.test.ts`

**Interfaces:**

- Consumes: Task 8의 모든 export, `CTA_ATTRIBUTE`, `NOT_FOUND_MARKER_ATTRIBUTE`, `WEB_VITAL_NAMES`, `UtmParams`
- Produces:
  - `type TrackerEnvironment = { window: Window; storage: KeyValueStorage; persistent: boolean; now: () => number; createId: () => string; send: (body: string) => void }`
  - `type WebVitalReport = { name: string; value: number; rating?: string }`
  - `type Tracker = { trackPageView(): void; reportWebVital(metric: WebVitalReport): void; destroy(): void }`
  - `createTracker(environment: TrackerEnvironment): Tracker`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/analytics/tracker.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTracker, type Tracker } from '@/lib/analytics/tracker/tracker'
import type { KeyValueStorage } from '@/lib/analytics/tracker/identity'

let now = 0
let sent: Array<{ events: Array<Record<string, unknown>> }> = []
let tracker: Tracker | null = null

function memoryStorage(): KeyValueStorage {
  const data: Record<string, string> = {}
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
    removeItem: (key) => {
      delete data[key]
    },
  }
}

function start(storage: KeyValueStorage = memoryStorage()) {
  let id = 0
  tracker = createTracker({
    window,
    storage,
    persistent: true,
    now: () => now,
    createId: () => `00000000-0000-4000-8000-${String(++id).padStart(12, '0')}`,
    send: (body) => sent.push(JSON.parse(body) as (typeof sent)[number]),
  })
  return tracker
}

const events = () => sent.flatMap((batch) => batch.events)

beforeEach(() => {
  now = 0
  sent = []
  window.history.replaceState(
    null,
    '',
    '/ko?utm_source=instagram&utm_medium=social'
  )
  document.title = '홈 | GDGoC Yonsei'
  document.body.innerHTML = ''
  vi.spyOn(document, 'hasFocus').mockReturnValue(true)
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: 'visible',
  })
})

afterEach(() => {
  tracker?.destroy()
  tracker = null
  vi.restoreAllMocks()
})

describe('createTracker', () => {
  it('sends the first page view immediately with session attributes', () => {
    start().trackPageView()
    expect(events()).toEqual([
      expect.objectContaining({
        type: 'page_view',
        path: '/ko',
        title: '홈 | GDGoC Yonsei',
        isSessionStart: true,
        isNewVisitor: true,
        sequence: 1,
        utm: { source: 'instagram', medium: 'social' },
        isNotFound: false,
        ageMs: 0,
      }),
    ])
  })

  it('ignores a repeated call for the same path', () => {
    const t = start()
    t.trackPageView()
    t.trackPageView()
    expect(events().filter((event) => event.type === 'page_view')).toHaveLength(
      1
    )
  })

  it('sends the previous page engagement before the next page view', () => {
    const t = start()
    t.trackPageView()
    now = 12_000
    window.history.pushState(null, '', '/ko/session')
    t.trackPageView()

    const [, engagement, next] = events()
    expect(engagement).toMatchObject({
      type: 'engagement',
      engagementMs: 12_000,
    })
    expect(next).toMatchObject({
      type: 'page_view',
      path: '/ko/session',
      sequence: 2,
      isSessionStart: false,
    })
    expect(next).not.toHaveProperty('referrer')
  })

  it('pauses while hidden and flushes engagement on hide', () => {
    const t = start()
    t.trackPageView()
    now = 4_000
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(events().at(-1)).toMatchObject({
      type: 'engagement',
      engagementMs: 4_000,
    })

    now = 100_000
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    now = 101_000
    window.dispatchEvent(new Event('pagehide'))
    expect(events().at(-1)).toMatchObject({
      type: 'engagement',
      engagementMs: 5_000,
    })
  })

  it('marks a 404 page view from the not-found marker', () => {
    document.body.innerHTML = '<span hidden data-analytics-not-found></span>'
    start().trackPageView()
    expect(events()[0]).toMatchObject({ isNotFound: true })
  })

  it('records CTA and outbound clicks with the current page view', () => {
    document.body.innerHTML = `
      <a id="cta" href="/ko/calendar" data-analytics="join_calendar"><span id="inner">Calendar</span></a>
      <a id="out" href="https://www.linkedin.com/company/gdsc-yonsei/">LinkedIn</a>
      <a id="internal" href="/ko/project">Projects</a>`
    const t = start()
    t.trackPageView()
    for (const id of ['inner', 'out', 'internal']) {
      document
        .getElementById(id)!
        .addEventListener('click', (event) => event.preventDefault())
      document.getElementById(id)!.click()
    }
    window.dispatchEvent(new Event('pagehide'))

    const clicks = events().filter((event) => event.type === 'click')
    expect(clicks).toEqual([
      expect.objectContaining({
        kind: 'cta',
        label: 'join_calendar',
        targetUrl: '/ko/calendar',
        path: '/ko',
      }),
      expect.objectContaining({
        kind: 'outbound',
        targetUrl: 'https://www.linkedin.com/company/gdsc-yonsei/',
      }),
    ])
  })

  it('forwards known web vitals and drops unknown metrics', () => {
    const t = start()
    t.trackPageView()
    t.reportWebVital({ name: 'LCP', value: 1800, rating: 'good' })
    t.reportWebVital({ name: 'FID', value: 10, rating: 'good' })
    t.reportWebVital({ name: 'CLS', value: 0.3 })
    window.dispatchEvent(new Event('pagehide'))
    expect(events().filter((event) => event.type === 'web_vital')).toEqual([
      expect.objectContaining({
        metric: 'LCP',
        value: 1800,
        rating: 'good',
        path: '/ko',
      }),
    ])
  })

  it('sends nothing after the visitor opts out', () => {
    const storage = memoryStorage()
    storage.setItem('gyms_optout', '1')
    const t = start(storage)
    t.trackPageView()
    window.dispatchEvent(new Event('pagehide'))
    expect(sent).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/analytics/tracker.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/analytics/tracker/tracker.ts
/**
 * 식별자·참여 시간·스크롤·클릭·큐를 DOM 이벤트에 연결한다. React와 무관해 jsdom에서 그대로 테스트한다.
 * 수집 허용 여부는 보낼 때마다 다시 확인해, 처리방침에서 거부하면 그 즉시 멈춘다.
 */
import {
  CTA_ATTRIBUTE,
  NOT_FOUND_MARKER_ATTRIBUTE,
} from '@/lib/analytics/constants'
import {
  WEB_VITAL_NAMES,
  type UtmParams,
  type WebVitalName,
  type WebVitalRating,
} from '@/lib/analytics/events'
import { classifyClick } from '@/lib/analytics/tracker/clicks'
import {
  createEngagementTimer,
  type EngagementTimer,
} from '@/lib/analytics/tracker/engagement'
import {
  isTrackingAllowed,
  startPageView,
  touchSession,
  type KeyValueStorage,
} from '@/lib/analytics/tracker/identity'
import { createEventQueue } from '@/lib/analytics/tracker/queue'
import { scrollPercent } from '@/lib/analytics/tracker/scroll'

export type TrackerEnvironment = {
  window: Window
  storage: KeyValueStorage
  /** 실제 localStorage면 true. 메모리 대체물이면 신규 방문자로 세지 않는다. */
  persistent: boolean
  now: () => number
  createId: () => string
  send: (body: string) => void
}

/** `next/web-vitals`가 넘기는 값 중 쓰는 것만. */
export type WebVitalReport = { name: string; value: number; rating?: string }

export type Tracker = {
  trackPageView(): void
  reportWebVital(metric: WebVitalReport): void
  destroy(): void
}

type CurrentPage = {
  pageViewId: string
  sessionId: string
  path: string
  maxScroll: number
  timer: EngagementTimer
}

const UTM_KEYS = ['source', 'medium', 'campaign', 'term', 'content'] as const
const RATINGS: readonly string[] = ['good', 'needs-improvement', 'poor']

function readUtm(search: string): UtmParams | undefined {
  const params = new URLSearchParams(search)
  const utm: UtmParams = {}
  for (const key of UTM_KEYS) {
    const value = params.get(`utm_${key}`)?.trim()
    if (value) utm[key] = value.slice(0, 200)
  }
  return Object.keys(utm).length > 0 ? utm : undefined
}

export function createTracker(environment: TrackerEnvironment): Tracker {
  const { window: win, storage, now } = environment
  const doc = win.document
  const queue = createEventQueue(environment.send, now)
  let current: CurrentPage | null = null
  let scrollFrame = 0

  const allowed = () => isTrackingAllowed(win.navigator, storage)
  const isActive = () => doc.visibilityState === 'visible' && doc.hasFocus()

  function updateScroll() {
    scrollFrame = 0
    if (!current) return
    const percent = scrollPercent(
      win.scrollY,
      win.innerHeight,
      doc.documentElement.scrollHeight
    )
    if (percent > current.maxScroll) current.maxScroll = percent
  }

  function queueEngagement() {
    if (!current) return
    queue.push({
      type: 'engagement',
      pageViewId: current.pageViewId,
      sessionId: current.sessionId,
      engagementMs: Math.round(current.timer.total()),
      maxScrollPercent: current.maxScroll,
    })
  }

  function flushPage() {
    if (!current || !allowed()) return
    queueEngagement()
    queue.flush()
  }

  function trackPageView() {
    if (!allowed()) return
    const path = win.location.pathname
    // 개발 모드 StrictMode는 effect를 두 번 실행한다. 같은 경로의 재호출은 새 조회가 아니다.
    if (current?.path === path) return

    queueEngagement()
    const visit = startPageView(
      storage,
      now(),
      environment.createId,
      environment.persistent
    )
    current = {
      pageViewId: environment.createId(),
      sessionId: visit.sessionId,
      path,
      maxScroll: 0,
      timer: createEngagementTimer(now, isActive()),
    }
    updateScroll()

    queue.push(
      {
        type: 'page_view',
        pageViewId: current.pageViewId,
        sessionId: visit.sessionId,
        visitorId: visit.visitorId,
        isNewVisitor: visit.isNewVisitor,
        isSessionStart: visit.isSessionStart,
        sequence: visit.sequence,
        path,
        title: doc.title ? doc.title.slice(0, 300) : undefined,
        // soft navigation에서도 document.referrer는 첫 진입 값 그대로라 세션 첫 조회에만 보낸다.
        referrer:
          visit.isSessionStart && doc.referrer
            ? doc.referrer.slice(0, 1024)
            : undefined,
        utm: readUtm(win.location.search),
        screenWidth: win.screen.width || undefined,
        screenHeight: win.screen.height || undefined,
        language: win.navigator.language || undefined,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
        isNotFound:
          doc.querySelector(`[${NOT_FOUND_MARKER_ATTRIBUTE}]`) !== null,
      },
      { immediate: true }
    )
  }

  function reportWebVital(metric: WebVitalReport) {
    if (!current || !allowed()) return
    if (!(WEB_VITAL_NAMES as readonly string[]).includes(metric.name)) return
    if (!metric.rating || !RATINGS.includes(metric.rating)) return
    queue.push({
      type: 'web_vital',
      pageViewId: current.pageViewId,
      sessionId: current.sessionId,
      path: current.path,
      metric: metric.name as WebVitalName,
      value: metric.value,
      rating: metric.rating as WebVitalRating,
    })
  }

  function onClick(event: MouseEvent) {
    if (!current || !allowed() || !(event.target instanceof win.Element)) return
    const element = event.target.closest(`a[href], [${CTA_ATTRIBUTE}]`)
    if (!element) return
    const click = classifyClick(
      {
        href: element.getAttribute('href'),
        ctaLabel: element.getAttribute(CTA_ATTRIBUTE),
        download: element.hasAttribute('download'),
      },
      win.location.origin
    )
    if (!click) return
    touchSession(storage, now())
    queue.push({
      type: 'click',
      pageViewId: current.pageViewId,
      sessionId: current.sessionId,
      path: current.path,
      ...click,
    })
  }

  function onVisibilityChange() {
    if (doc.visibilityState === 'hidden') {
      current?.timer.pause()
      flushPage()
    } else if (isActive()) {
      current?.timer.resume()
    }
  }

  const onFocus = () => {
    if (doc.visibilityState === 'visible') current?.timer.resume()
  }
  const onBlur = () => current?.timer.pause()
  const onScroll = () => {
    scrollFrame ||= win.requestAnimationFrame(updateScroll)
  }

  doc.addEventListener('visibilitychange', onVisibilityChange)
  doc.addEventListener('click', onClick, { capture: true })
  win.addEventListener('pagehide', flushPage)
  win.addEventListener('focus', onFocus)
  win.addEventListener('blur', onBlur)
  win.addEventListener('scroll', onScroll, { passive: true })

  return {
    trackPageView,
    reportWebVital,
    destroy() {
      doc.removeEventListener('visibilitychange', onVisibilityChange)
      doc.removeEventListener('click', onClick, { capture: true })
      win.removeEventListener('pagehide', flushPage)
      win.removeEventListener('focus', onFocus)
      win.removeEventListener('blur', onBlur)
      win.removeEventListener('scroll', onScroll)
      if (scrollFrame) win.cancelAnimationFrame(scrollFrame)
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/lib/analytics/tracker.test.ts`
Expected: PASS (8 tests). jsdom에서 `screen.width`가 0이면 `screenWidth`는 빠진다. 테스트는 그 필드를 확인하지 않는다.

- [ ] **Step 5: Commit**

```bash
git add lib/analytics/tracker/tracker.ts tests/lib/analytics/tracker.test.ts
git commit -m "feat(analytics): wire the tracker to page views, visibility, scroll and clicks"
```

---

### Task 10: 트래커 컴포넌트 연결, 404 표지, CTA 태깅, GA4 제거

**Files:**

- Create: `lib/analytics/tracker/browser.ts`
- Create: `app/components/site/analytics-tracker.tsx`
- Modify: `app/(home)/[lang]/layout.tsx` (GA4 → AnalyticsTracker)
- Modify: `app/global-not-found.tsx` (AnalyticsTracker 추가)
- Modify: `app/components/site/not-found-view.tsx` (404 표지)
- Modify: `app/(home)/[lang]/_components/home/join.tsx` (CTA 라벨 3개)
- Modify: `package.json`, `pnpm-workspace.yaml` (`@next/third-parties` 제거)
- Test: `tests/components/analytics-tracker.test.tsx`
- Test: `tests/lib/analytics/browser-tracker.test.ts`

**Interfaces:**

- Consumes: `createTracker`, `Tracker`, `WebVitalReport` (Task 9), `KeyValueStorage` (Task 8), `ANALYTICS_ENDPOINT`, `NOT_FOUND_MARKER_ATTRIBUTE`, `CTA_ATTRIBUTE` (Task 1)
- Produces: `getBrowserTracker(): Tracker | null`, `readBrowserStorage(): { storage: KeyValueStorage; persistent: boolean }`, `sendBeaconOrFetch(body: string): void`, 기본 export `AnalyticsTracker`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/analytics/browser-tracker.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  readBrowserStorage,
  sendBeaconOrFetch,
} from '@/lib/analytics/tracker/browser'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('readBrowserStorage', () => {
  it('uses localStorage when it works', () => {
    expect(readBrowserStorage().persistent).toBe(true)
  })

  it('falls back to memory storage when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    const { storage, persistent } = readBrowserStorage()
    expect(persistent).toBe(false)
    storage.setItem('k', 'v')
    expect(storage.getItem('k')).toBe('v')
  })
})

describe('sendBeaconOrFetch', () => {
  it('prefers sendBeacon and falls back to keepalive fetch', () => {
    const sendBeacon = vi.fn(() => false)
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeacon,
    })

    sendBeaconOrFetch('{"events":[]}')
    expect(sendBeacon).toHaveBeenCalledWith('/api/pulse', expect.any(Blob))
    expect(fetchMock).toHaveBeenCalledWith('/api/pulse', {
      method: 'POST',
      body: '{"events":[]}',
      keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    })
  })
})
```

```tsx
// tests/components/analytics-tracker.test.tsx
import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const pathname = vi.hoisted(() => ({ value: '/ko' }))

vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }))
vi.mock('next/web-vitals', () => ({ useReportWebVitals: vi.fn() }))

import AnalyticsTracker from '@/app/components/site/analytics-tracker'

// jsdom의 Blob 본문 읽기에 기대지 않으려고 전송 본문 문자열을 그대로 보관하는 대역을 쓴다.
class TextBlob {
  constructor(readonly parts: string[]) {}
}
const sendBeacon = vi.fn((_url: string, _body: TextBlob) => true)

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/ko')
  vi.stubGlobal('Blob', TextBlob)
  Object.defineProperty(navigator, 'sendBeacon', {
    configurable: true,
    value: sendBeacon,
  })
})

afterEach(() => {
  sendBeacon.mockClear()
  vi.unstubAllGlobals()
})

describe('AnalyticsTracker', () => {
  it('reports a page view on mount and on every pathname change', () => {
    const { rerender } = render(<AnalyticsTracker />)
    expect(sendBeacon).toHaveBeenCalledTimes(1)

    window.history.pushState(null, '', '/ko/session')
    pathname.value = '/ko/session'
    rerender(<AnalyticsTracker />)

    const pageViews = sendBeacon.mock.calls
      .map(([, blob]) => blob.parts.join(''))
      .flatMap(
        (body) =>
          (
            JSON.parse(body) as {
              events: Array<{ type: string; path?: string }>
            }
          ).events
      )
      .filter((event) => event.type === 'page_view')
    expect(pageViews.map((event) => event.path)).toEqual(['/ko', '/ko/session'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/lib/analytics/browser-tracker.test.ts tests/components/analytics-tracker.test.tsx`
Expected: FAIL — modules not found

- [ ] **Step 3: Write `browser.ts` and the component**

```ts
// lib/analytics/tracker/browser.ts
/** 브라우저에서 트래커를 하나만 만든다. localStorage가 막힌 브라우저도 페이지 안에서는 같은 세션으로 이어지게 메모리 저장소로 대체한다. */
import { ANALYTICS_ENDPOINT } from '@/lib/analytics/constants'
import type { KeyValueStorage } from '@/lib/analytics/tracker/identity'
import { createTracker, type Tracker } from '@/lib/analytics/tracker/tracker'

let tracker: Tracker | null = null

function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value)
    },
    removeItem: (key) => {
      data.delete(key)
    },
  }
}

/** 사파리 사생활 보호 모드처럼 저장 시 예외가 나는 경우까지 확인한다. */
export function readBrowserStorage(): {
  storage: KeyValueStorage
  persistent: boolean
} {
  try {
    const probe = '__gyms_probe'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return { storage: window.localStorage, persistent: true }
  } catch {
    return { storage: memoryStorage(), persistent: false }
  }
}

// text/plain은 CORS 단순 요청 형식이라 브라우저가 sendBeacon을 거절하지 않는다. 서버는 본문을 직접 JSON으로 읽는다.
const BODY_TYPE = 'text/plain;charset=UTF-8'

/** 페이지를 떠나는 중에도 전송되도록 sendBeacon을 먼저 쓴다. 실패는 무시한다(분석 손실이 화면 오류보다 낫다). */
export function sendBeaconOrFetch(body: string): void {
  if (
    navigator.sendBeacon?.(
      ANALYTICS_ENDPOINT,
      new Blob([body], { type: BODY_TYPE })
    )
  ) {
    return
  }
  fetch(ANALYTICS_ENDPOINT, {
    method: 'POST',
    body,
    keepalive: true,
    headers: { 'Content-Type': BODY_TYPE },
  }).catch(() => {})
}

/** 서버 렌더링 중에는 null. */
export function getBrowserTracker(): Tracker | null {
  if (typeof window === 'undefined') return null
  if (!tracker) {
    const { storage, persistent } = readBrowserStorage()
    tracker = createTracker({
      window,
      storage,
      persistent,
      now: () => Date.now(),
      createId: () => crypto.randomUUID(),
      send: sendBeaconOrFetch,
    })
  }
  return tracker
}
```

```tsx
// app/components/site/analytics-tracker.tsx
'use client'

/**
 * 공개 사이트 방문 분석 수집기. 화면에는 아무것도 그리지 않는다.
 * usePathname은 경로 변경 신호로만 쓰고 실제 경로는 location에서 읽는다(proxy rewrite 뒤 경로가 다를 수 있음).
 * cacheComponents에서 usePathname이 일시 중단될 수 있어 레이아웃이 <Suspense>로 감싼다.
 */
import { usePathname } from 'next/navigation'
import { useReportWebVitals } from 'next/web-vitals'
import { useEffect } from 'react'
import { getBrowserTracker } from '@/lib/analytics/tracker/browser'
import type { WebVitalReport } from '@/lib/analytics/tracker/tracker'

// 콜백 참조가 바뀌면 지난 지표가 다시 보고되므로 모듈 수준 함수로 둔다.
function reportWebVital(metric: WebVitalReport) {
  getBrowserTracker()?.reportWebVital(metric)
}

export default function AnalyticsTracker() {
  const pathname = usePathname()
  useReportWebVitals(reportWebVital)

  useEffect(() => {
    getBrowserTracker()?.trackPageView()
  }, [pathname])

  return null
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/lib/analytics/browser-tracker.test.ts tests/components/analytics-tracker.test.tsx`
Expected: PASS

- [ ] **Step 5: Wire the layouts, the 404 marker and CTA labels; remove GA4**

`app/(home)/[lang]/layout.tsx`:

- 삭제: `import { GoogleAnalytics } from '@next/third-parties/google'`, `const GA_MEASUREMENT_ID = 'G-D77HTXJVT8'`, `<GoogleAnalytics gaId={GA_MEASUREMENT_ID} />`
- 추가 import: `import { Suspense } from 'react'`, `import AnalyticsTracker from '@/app/components/site/analytics-tracker'`
- `<Footer lang={lang} />` 다음 줄:

```tsx
<Suspense fallback={null}>
  <AnalyticsTracker />
</Suspense>
```

`app/global-not-found.tsx`: 같은 두 import를 추가하고 `</main>` 다음 줄에 같은 `<Suspense>` 블록을 넣는다. 헤더 주석 끝에 한 문장을 붙인다: `공개 레이아웃 밖이라 방문 분석 수집기를 직접 렌더링한다.`

`app/components/site/not-found-view.tsx`: 최상위 `<div ...>` 바로 안 첫 자식으로 넣는다(속성 이름은 `lib/analytics/constants.ts`의 `NOT_FOUND_MARKER_ATTRIBUTE`와 같아야 한다):

```tsx
{
  /* 방문 분석 수집기가 이 조회를 404로 기록하는 표지(NOT_FOUND_MARKER_ATTRIBUTE) */
}
;<span hidden data-analytics-not-found="" />
```

`app/(home)/[lang]/_components/home/join.tsx`: 세 링크에 라벨을 붙인다.

```tsx
              <ExternalLink
                href={CHANNELS.instagram}
                className={buttonClasses('stageSolid')}
                data-analytics="join_instagram"
              >
```

```tsx
              <ExternalLink
                href={CHANNELS.linkedin}
                className={buttonClasses('stageOutline')}
                data-analytics="join_linkedin"
              >
```

```tsx
              <ButtonLink
                href={localeHref(lang, '/calendar')}
                tone="stageOutline"
                data-analytics="join_calendar"
              >
```

`ExternalLink`이 `data-*`를 넘기지 않는 props 타입이면(`app/components/site/external-link.tsx` 확인) 타입을 `ComponentProps<'a'>` 기반으로 넓힌다. `ButtonLink`은 `ComponentProps<typeof Link>`라 그대로 통과한다.

GA4 의존성 제거:

Run: `grep -rn "third-parties" app lib package.json pnpm-workspace.yaml`
Expected: `package.json` dependencies 한 줄과 `pnpm-workspace.yaml`의 `- '@next/third-parties@16.3.6'` 한 줄만 남음

Run: `pnpm remove @next/third-parties` 후 `pnpm-workspace.yaml`에서 `- '@next/third-parties@16.3.6'` 줄을 지우고 `pnpm install`
Expected: lockfile 갱신, 오류 없음

- [ ] **Step 6: Verify the removal and the 404 marker**

Run: `grep -rn "GoogleAnalytics\|G-D77HTXJVT8\|third-parties" app lib package.json pnpm-workspace.yaml`
Expected: 결과 없음

Run: `pnpm test:types && pnpm lint --max-warnings=0 && pnpm test`
Expected: 모두 통과. 기존 404·레이아웃 스냅샷 테스트가 숨은 `<span>` 때문에 깨지면 기대값에 표지를 반영한다.

- [ ] **Step 7: Commit**

```bash
git add lib/analytics/tracker/browser.ts app/components/site/analytics-tracker.tsx "app/(home)/[lang]/layout.tsx" app/global-not-found.tsx app/components/site/not-found-view.tsx "app/(home)/[lang]/_components/home/join.tsx" app/components/site/external-link.tsx package.json pnpm-lock.yaml pnpm-workspace.yaml tests
git commit -m "feat(analytics): mount the first-party tracker and remove Google Analytics"
```

---

### Task 11: 개인정보처리방침 갱신과 수집 거부 토글

**Files:**

- Create: `app/components/site/analytics-opt-out.tsx`
- Modify: `app/(home)/[lang]/privacy-policy/page.tsx`
- Test: `tests/components/analytics-opt-out.test.tsx`

**Interfaces:**

- Consumes: `optIn`, `optOut` (Task 8), `OPT_OUT_STORAGE_KEY` (Task 1), `buttonClasses` (`app/components/site/button-link.tsx`)
- Produces: 기본 export `AnalyticsOptOut({ copy }: { copy: AnalyticsOptOutCopy })`, `type AnalyticsOptOutCopy = { enabled: string; disabled: string; gpc: string; disable: string; enable: string }`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/analytics-opt-out.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import AnalyticsOptOut from '@/app/components/site/analytics-opt-out'

const copy = {
  enabled: '방문 분석 수집이 켜져 있습니다.',
  disabled: '방문 분석 수집을 거부했습니다.',
  gpc: '브라우저의 GPC 설정에 따라 방문 분석을 수집하지 않습니다.',
  disable: '수집 거부',
  enable: '수집 허용',
}

beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(navigator, 'globalPrivacyControl', {
    configurable: true,
    value: undefined,
  })
})

describe('AnalyticsOptOut', () => {
  it('opts out, removes identifiers and can opt back in', async () => {
    localStorage.setItem('gyms_vid', '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d22')
    render(<AnalyticsOptOut copy={copy} />)

    expect(screen.getByRole('status')).toHaveTextContent(copy.enabled)
    await userEvent.click(screen.getByRole('button', { name: copy.disable }))

    expect(screen.getByRole('status')).toHaveTextContent(copy.disabled)
    expect(localStorage.getItem('gyms_optout')).toBe('1')
    expect(localStorage.getItem('gyms_vid')).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: copy.enable }))
    expect(localStorage.getItem('gyms_optout')).toBeNull()
  })

  it('explains GPC and offers no toggle when the browser sends it', () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      configurable: true,
      value: true,
    })
    render(<AnalyticsOptOut copy={copy} />)
    expect(screen.getByRole('status')).toHaveTextContent(copy.gpc)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/components/analytics-opt-out.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the component**

```tsx
// app/components/site/analytics-opt-out.tsx
'use client'

/**
 * 처리방침에서 방문 분석 수집을 끄고 켠다. 서버는 설정을 모르므로 하이드레이션 전에는 아무것도 그리지 않는다.
 * 같은 탭에서는 storage 이벤트가 오지 않아 직접 변경 이벤트를 보낸다.
 */
import { useSyncExternalStore } from 'react'
import { buttonClasses } from '@/app/components/site/button-link'
import { OPT_OUT_STORAGE_KEY } from '@/lib/analytics/constants'
import { optIn, optOut } from '@/lib/analytics/tracker/identity'

export type AnalyticsOptOutCopy = {
  enabled: string
  disabled: string
  gpc: string
  disable: string
  enable: string
}

type Status = 'unknown' | 'gpc' | 'enabled' | 'disabled'

const CHANGE_EVENT = 'gyms-analytics-consent'

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

function readStatus(): Status {
  if (
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl === true
  ) {
    return 'gpc'
  }
  try {
    return localStorage.getItem(OPT_OUT_STORAGE_KEY) === '1'
      ? 'disabled'
      : 'enabled'
  } catch {
    // 저장소를 쓸 수 없으면 거부 설정을 남길 수 없다. 수집기도 페이지를 넘어 이어지는 기록을 만들지 못한다.
    return 'unknown'
  }
}

const readServerStatus = (): Status => 'unknown'

export default function AnalyticsOptOut({
  copy,
}: {
  copy: AnalyticsOptOutCopy
}) {
  const status = useSyncExternalStore(subscribe, readStatus, readServerStatus)

  if (status === 'unknown') return null
  if (status === 'gpc') return <p role="status">{copy.gpc}</p>

  function toggle() {
    if (status === 'enabled') optOut(localStorage)
    else optIn(localStorage)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  return (
    <div className="policy-note no-print">
      <p role="status">{status === 'enabled' ? copy.enabled : copy.disabled}</p>
      <button type="button" onClick={toggle} className={buttonClasses('solid')}>
        {status === 'enabled' ? copy.disable : copy.enable}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/components/analytics-opt-out.test.tsx`
Expected: PASS

- [ ] **Step 5: Update the privacy policy page**

`app/(home)/[lang]/privacy-policy/page.tsx`에 import 추가: `import AnalyticsOptOut from '@/app/components/site/analytics-opt-out'`

한국어 목차(`<nav aria-label="섹션 목록">`)에서 `#change` 항목 바로 앞에 추가:

```tsx
<li>
  <a href="#analytics">자동 수집 장치의 설치·운영 및 거부</a>
</li>
```

한국어 `<section id="change">` 바로 앞에 추가하고, 그 섹션의 제목을 `<h2>9. 개인정보처리방침의 변경</h2>`로, 공고일자·시행일자를 `2026년 10월 14일`로 바꾼다(배포가 이 날짜 뒤면 실제 배포일로 맞춘다):

```tsx
{
}
;<section id="analytics">
  <h2>8. 자동 수집 장치의 설치·운영 및 거부</h2>
  <p>
    ‘GDGoC Yonsei’는 웹사이트를 개선하기 위해 방문 기록을 자동으로 수집합니다.
    이 정보만으로는 이용자가 누구인지 알 수 없습니다.
  </p>
  <div>
    <h3>수집 항목</h3>
    <ul>
      <li>브라우저 저장소(localStorage)에 저장하는 무작위 방문자 식별값</li>
      <li>방문한 페이지와 시각, 머문 시간, 스크롤 깊이</li>
      <li>유입 경로(이전 페이지 주소, 캠페인 정보)</li>
      <li>기기 종류, 브라우저, 운영체제, 화면 크기, 언어, 시간대</li>
      <li>페이지 로딩 성능 지표, 외부 링크와 주요 버튼 클릭</li>
    </ul>
    <p>
      IP 주소는 비정상적인 대량 요청을 막는 데에만 잠시 사용하고 저장하지
      않습니다.
    </p>
  </div>
  <div>
    <h3>이용 목적 및 보유 기간</h3>
    <p>
      서비스 개선, 검색 노출 개선, 콘텐츠 기획에 사용하며 수집일로부터 26개월이
      지나면 지체 없이 파기합니다.
    </p>
  </div>
  <div>
    <h3>거부 방법</h3>
    <p>
      아래 버튼으로 수집을 거부할 수 있습니다. 브라우저의 GPC(Global Privacy
      Control) 설정을 켜거나 브라우저 저장소를 삭제해도 됩니다. 수집을 거부해도
      웹사이트 이용에는 제한이 없습니다.
    </p>
    <AnalyticsOptOut
      copy={{
        enabled: '현재 방문 분석 수집이 켜져 있습니다.',
        disabled: '방문 분석 수집을 거부했습니다.',
        gpc: '브라우저의 GPC 설정에 따라 방문 분석을 수집하지 않습니다.',
        disable: '수집 거부',
        enable: '수집 허용',
      }}
    />
  </div>
</section>
```

영어 목차의 `#change` 항목 앞:

```tsx
<li>
  <a href="#analytics">Automatic Data Collection and How to Opt Out</a>
</li>
```

영어 `<section id="change">` 앞에 추가하고, 그 제목을 `<h2>9. Changes to the Privacy Policy</h2>`로, 두 날짜를 `October 14, 2026`으로 바꾼다:

```tsx
{
}
;<section id="analytics">
  <h2>8. Automatic Data Collection and How to Opt Out</h2>
  <p>
    &#39;GDGoC Yonsei&#39; automatically records visits to improve this website.
    This information alone cannot identify who you are.
  </p>
  <div>
    <h3>Collected Items</h3>
    <ul>
      <li>A random visitor ID stored in your browser (localStorage)</li>
      <li>Pages visited, visit times, time on page, scroll depth</li>
      <li>How you arrived (previous page address, campaign tags)</li>
      <li>
        Device type, browser, operating system, screen size, language, time zone
      </li>
      <li>
        Page loading performance, clicks on outbound links and key buttons
      </li>
    </ul>
    <p>
      Your IP address is used only briefly to block abusive request floods and
      is never stored.
    </p>
  </div>
  <div>
    <h3>Purpose and Retention</h3>
    <p>
      We use this data to improve the service, search visibility and content,
      and delete it 26 months after collection.
    </p>
  </div>
  <div>
    <h3>How to Opt Out</h3>
    <p>
      Use the button below to opt out. Turning on Global Privacy Control (GPC)
      in your browser or clearing browser storage also works. Opting out does
      not limit your use of the website.
    </p>
    <AnalyticsOptOut
      copy={{
        enabled: 'Visit analytics is currently on.',
        disabled: 'You have opted out of visit analytics.',
        gpc: 'Your browser sends GPC, so we do not collect visit analytics.',
        disable: 'Opt out',
        enable: 'Allow analytics',
      }}
    />
  </div>
</section>
```

- [ ] **Step 6: Verify and commit**

Run: `pnpm test:types && pnpm lint --max-warnings=0 && pnpm test`
Expected: 모두 통과(처리방침 렌더링 테스트가 있으면 새 절과 번호 9를 반영)

```bash
git add app/components/site/analytics-opt-out.tsx "app/(home)/[lang]/privacy-policy/page.tsx" tests/components/analytics-opt-out.test.tsx
git commit -m "feat(privacy): disclose visit analytics and add an opt-out toggle"
```

---

### Task 12: 로컬 Postgres, e2e, 성능 예산, 문서

**Files:**

- Create: `tests/e2e/analytics-collection.spec.ts`
- Create: `docs/architecture/analytics.md`
- Modify: `docs/architecture/overview.md` (관련 문서 목록, 디렉터리 지도)
- Modify: `docs/handoff.md` (외부 서비스 표의 Google Analytics 행)

- [ ] **Step 1: Prepare a local disposable Postgres**

```bash
sudo apt-get update && sudo apt-get install -y postgresql
sudo service postgresql start
sudo -u postgres psql -c "CREATE USER gdgoc WITH PASSWORD 'gdgoc' SUPERUSER;"
sudo -u postgres psql -c "CREATE DATABASE gdgoc_dev OWNER gdgoc;"
export LOCAL_DB=postgres://gdgoc:gdgoc@127.0.0.1:5432/gdgoc_dev
AUTH_DRIZZLE_URL=$LOCAL_DB pnpm db:migrate
```

Expected: 모든 마이그레이션 적용, 마지막에 분석 마이그레이션. **접두를 빠뜨리면 원격 DB에 적용되므로 명령을 붙여 넣기 전에 확인한다.**

- [ ] **Step 2: Write the e2e spec**

```ts
// tests/e2e/analytics-collection.spec.ts
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
```

- [ ] **Step 3: Run the e2e spec against the local DB**

Run: `AUTH_DRIZZLE_URL=$LOCAL_DB pnpm test:e2e:prod tests/e2e/analytics-collection.spec.ts`
Expected: PASS. 빌드에 몇 분 걸린다. 전체 e2e도 한 번 돌린다:

Run: `AUTH_DRIZZLE_URL=$LOCAL_DB pnpm test:e2e:prod`
Expected: 기존과 같은 결과(알려진 간헐 실패 `home-motion.spec.ts`의 "UI/UX curve" 호버 테스트 외에는 통과)

- [ ] **Step 4: Measure the performance budget**

```bash
AUTH_DRIZZLE_URL=$LOCAL_DB pnpm db:seed
AUTH_DRIZZLE_URL=$LOCAL_DB pnpm build
AUTH_DRIZZLE_URL=$LOCAL_DB pnpm exec next start --port 3100 &
pnpm perf:measure
```

`perf:measure`가 출력한 보고서 경로로:

Run: `pnpm perf:budget <report.json>`
Expected: 실패 없음. 홈(`/en`, `/ko`)의 `jsEncodedBodyBytes`가 **200,000B 이하**. 넘으면:

1. `app/components/site/analytics-tracker.tsx`에서 `useReportWebVitals`를 빼고 다시 측정해 원인이 Web Vitals인지 확인한다.
2. 원인이면 `lib/analytics/tracker/web-vitals.ts`에 `PerformanceObserver`로 LCP(`largest-contentful-paint`, 마지막 항목의 `startTime`)·CLS(`layout-shift`에서 `hadRecentInput`이 아닌 `value` 합)·INP(`event` 항목 중 최대 `duration`, `durationThreshold: 40`)를 직접 재고 `pagehide` 때 `reportWebVital`로 넘기는 모듈을 만들어 대체한다. 등급 기준은 명세 7장(LCP 2.5/4s, INP 200/500ms, CLS 0.1/0.25).
   측정이 끝나면 서버를 종료한다(`kill %1`).

- [ ] **Step 5: Write the documentation**

`docs/architecture/analytics.md`:

```markdown
# 방문 분석

공개 사이트 방문 행동을 자체 수집해 `analytics_*` 테이블에 저장한다. 설계: `docs/superpowers/specs/2026-10-14-gyms-analytics-design.md`.

## 수집 흐름

1. `app/(home)/[lang]/layout.tsx`와 `app/global-not-found.tsx`가 `AnalyticsTracker`를 렌더링한다.
2. 트래커(`lib/analytics/tracker/*`)는 조회·참여 시간·스크롤·클릭·Web Vitals를 큐에 모아 `sendBeacon`으로 `POST /api/pulse`에 보낸다.
3. `lib/server/analytics/collect/handle-collect.ts`가 출처 → 크기(16KB) → 스키마(배치 20개) → 봇 → 속도 제한(IP당 분당 120) 순으로 거른다. 거부해도 204다.
4. `store.ts`가 한 트랜잭션으로 세션 upsert → 조회 insert → 참여 시간 `GREATEST` → 이벤트 insert를 한다.
5. 응답 뒤 하루 한 번(인스턴스별) 26개월 지난 세션을 지운다(`retention.ts`).

## 수집하지 않는 경우

GPC 신호, 처리방침의 거부 버튼(`localStorage.gyms_optout = '1'`), `navigator.webdriver`(Playwright·자동화 브라우저).
e2e에서 수집을 확인하려면 `tests/e2e/analytics-collection.spec.ts`처럼 `webdriver`를 덮어쓴다.

## 식별자

| 키         | 저장         | 의미                                         |
| ---------- | ------------ | -------------------------------------------- |
| `gyms_vid` | localStorage | 익명 방문자 ID(무작위 UUID)                  |
| `gyms_sid` | localStorage | 세션 ID, 마지막 활동 시각, 세션 안 조회 순번 |

마지막 활동 후 30분이 지나면 새 세션이다. 로그인한 GYMS 멤버의 세션은 `isInternal = true`로 저장된다.

## 테스트

분석 SQL은 `tests/helpers/analytics-test-db.ts`(PGlite)로 실제 Postgres 문법을 검증한다. 이 헬퍼는 `drizzle/`에서 분석 테이블을 만드는 마이그레이션만 적용한다.

## 핵심 이벤트 추가

링크나 버튼에 `data-analytics="라벨"`을 붙이면 `cta` 이벤트로 집계된다. 라벨은 영문 snake_case로 짓는다(예: `join_instagram`).
```

`docs/architecture/overview.md`: "관련 문서" 목록의 `MCP 서버` 줄 아래에 `- 방문 분석: [`analytics.md`](./analytics.md)`를 추가하고, 디렉터리 지도의 `lib/` 아래 `mcp/` 줄 앞에 다음 두 줄을 넣는다:

```text
  analytics/             방문 분석 트래커(클라이언트)와 공용 이벤트 타입
  server/analytics/      수집 API 처리(검증·보강·저장·정리)
```

`docs/handoff.md` 외부 서비스 표에서 Google Analytics 행을 다음으로 바꾼다:

```markdown
| 방문 분석 | 공개 사이트 통계 | 자체 수집(`analytics_*` 테이블). GA4는 2026-10에 제거했고 과거 데이터는 gdgoc yonsei 구글 계정의 Google Analytics 화면에서 본다 |
```

- [ ] **Step 6: Final checks and commit**

Run: `pnpm test:types && pnpm lint --max-warnings=0 && pnpm test && pnpm exec prettier --check docs tests/e2e/analytics-collection.spec.ts`
Expected: 모두 통과

```bash
git add tests/e2e/analytics-collection.spec.ts docs
git commit -m "test(analytics): cover collection end to end and document the pipeline"
```
