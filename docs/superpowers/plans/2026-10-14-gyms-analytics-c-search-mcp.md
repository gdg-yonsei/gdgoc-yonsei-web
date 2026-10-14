# GYMS 웹 분석 — 계획 C: Search Console·SEO 개선 기회·MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google Search Console의 검색어·노출·클릭률·순위를 GYMS 검색 탭에 보여 주고, 우리 수집 데이터와 합쳐 SEO 개선 기회 세 목록을 만들고, 분석 데이터를 MCP 읽기 도구 5개로 연다.

**Architecture:** 서비스 계정 JWT를 `node:crypto`로 직접 서명해 액세스 토큰을 받고(`lib/server/analytics/search-console/*`), Search Analytics API 응답을 `'use cache: remote'`로 6시간 캐시한다. 개선 기회 판정은 순수 함수(`lib/analytics/seo.ts`)이고, 서비스(`lib/server/services/admin/search-console.ts`)가 권한·미설정·API 오류를 처리한다. MCP 도구(`lib/mcp/tools/analytics.ts`)는 계획 B의 분석 서비스와 이 계획의 검색 서비스를 그대로 감싼다.

**Tech Stack:** Next.js 16(`use cache: remote`, `cacheLife`, `cacheTag`), Node `crypto`(RS256), zod 4, `@modelcontextprotocol/server`, Vitest, Recharts(계획 B 컴포넌트 재사용).

**Spec:** `docs/superpowers/specs/2026-10-14-gyms-analytics-design.md` (10·11장, 13장의 문서 갱신, 16장의 Search Console·MCP 부분)

**선행 조건:** 계획 A·B가 머지되어 있어야 한다(`getAnalyticsOverview`, `getAnalyticsTable`, `getAnalyticsPageDetail`, `aggregateSessions`, `ChartFrame`·`MetricTile`·`MetricTable`·`BarList`·`TimeSeriesChart`, `readAnalyticsFilter`, 관리자 문구 `analyticsSearchConsoleSoon`, 검색 탭 자리 `app/(admin)/admin/analytics/search/page.tsx`).

## Global Constraints

- **새 npm 의존성 없음.** Google API 클라이언트 라이브러리를 쓰지 않고 `fetch` + `node:crypto`로 구현한다.
- 환경 변수 3개(`GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY`, `GSC_SITE_URL`)는 **모두 선택**이다. 하나라도 없으면 검색 탭은 설정 안내를 보이고 다른 탭·빌드는 정상이다. `GSC_PRIVATE_KEY`의 `\n` 문자열은 줄바꿈으로 바꾼다.
- OAuth 범위는 **`https://www.googleapis.com/auth/webmasters.readonly`**(읽기 전용)만 쓴다.
- Search Console 응답 캐시: `'use cache: remote'` + `cacheLife('searchConsole')`(stale 1시간, revalidate 6시간, expire 1일) + `cacheTag('search-console')`. 액세스 토큰은 만료 60초 전까지 메모리에 둔다.
- Search Console 데이터는 2~3일 늦다. 요청 종료일은 **서울 기준 어제**를 넘지 않게 자르고 `dataState: 'all'`로 최신 값까지 받는다. 화면에 기준일을 표시한다.
- 우리 필터 중 Search Console에 적용되는 것은 **기기와 페이지 경로**뿐이다. 나머지는 적용되지 않는다는 안내를 화면에 둔다.
- SEO 개선 기회 기준(명세 10장): ① 노출 **≥ 50**이고 클릭률이 순위별 일반 클릭률의 **절반 미만** ② 평균 순위 **8~20위**, 노출 **≥ 20** ③ 자연 검색 유입 세션 **≥ 5**이고 참여율 **< 50%**. 각 목록 최대 **20행**. 순위별 일반 클릭률은 업계 평균 참고치이며 화면에 "참고치"로 표기한다.
- MCP 도구 5개 모두 스코프 **`gyms:read`**, 게이트 **`get analyticsPage`**, `readOnlyHint: true`. 읽기 도구라 감사 로그 대상이 아니다.
- 주석·export 규칙, React Compiler, 커밋 트레일러, 로컬 DB 접두는 계획 A의 Global Constraints와 같다. 각 Task 끝에 `pnpm test:types && pnpm lint --max-warnings=0 && pnpm test` 통과.

## Review Focus

1. **서비스 계정이 Search Console 속성에 추가되지 않음(403)** → 검색 탭에 "속성 사용자에 서비스 계정 이메일을 추가하라"는 오류 카드, 다른 탭은 정상. Task 4에 테스트.
2. **`GSC_PRIVATE_KEY`가 한 줄(`\n` 문자열)로 들어옴** → 서명 전에 실제 줄바꿈으로 바뀌어야 한다. Task 1에 테스트.
3. **Search Console 페이지 URL이 다른 호스트·끝 슬래시·쿼리를 가짐** → 우리 경로와 같은 모양(`/ko/session`)으로 맞춰 결합된다. Task 2에 테스트.
4. **할당량 초과(429)** → "잠시 뒤 다시 시도" 안내, 실패한 응답은 캐시되지 않는다(캐시 함수 안에서 예외를 던진다). Task 4에 테스트.
5. **MCP 클라이언트가 잘못된 기간·보고서 이름을 보냄** → 도구 입력 검증 오류로 거절하고 서비스는 호출되지 않는다. Task 6에 테스트.

---

## File Structure

| 파일                                                      | 책임                                            |
| --------------------------------------------------------- | ----------------------------------------------- |
| `lib/server/env-core.ts` (수정)                           | `getSearchConsoleEnv()`                         |
| `lib/server/cache/policy.ts` (수정)                       | `searchConsole` 캐시 수명                       |
| `lib/analytics/seo.ts`                                    | 순위별 일반 클릭률, 개선 기회 판정, URL → 경로  |
| `lib/server/analytics/search-console/token.ts`            | 서비스 계정 JWT 서명과 액세스 토큰 캐시         |
| `lib/server/analytics/search-console/client.ts`           | Search Analytics API 호출과 오류 타입           |
| `lib/server/analytics/search-console/reports.ts`          | 캐시된 조회 `fetchSearchAnalytics`              |
| `lib/server/services/admin/search-console.ts`             | 권한·미설정·오류 처리, 검색 개요, 개선 기회, 표 |
| `app/(admin)/admin/analytics/search/page.tsx` (교체)      | 검색 탭                                         |
| `app/(admin)/admin/analytics/_components/search-view.tsx` | 검색 탭 본문과 설정 안내                        |
| `lib/mcp/tools/analytics.ts`                              | MCP 도구 5개                                    |

수정: `lib/mcp/tools/index.ts`, `lib/admin-i18n/messages/{en,ko}.ts`, `.env.example`, `docs/development.md`, `docs/architecture/{analytics,mcp,caching}.md`, `docs/handoff.md`.

---

### Task 1: 환경 변수와 캐시 수명

**Files:**

- Modify: `lib/server/env-core.ts`
- Modify: `lib/server/cache/policy.ts`
- Modify: `.env.example`, `docs/development.md`
- Test: `tests/lib/server/search-console-env.test.ts`

**Interfaces:**

- Produces: `type SearchConsoleEnv = { clientEmail: string; privateKey: string; siteUrl: string }`, `getSearchConsoleEnv(): SearchConsoleEnv | null`, `cacheLifeConfig.searchConsole`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/server/search-console-env.test.ts
import { afterEach, describe, expect, it } from 'vitest'
import { getSearchConsoleEnv } from '@/lib/server/env-core'

const KEYS = ['GSC_CLIENT_EMAIL', 'GSC_PRIVATE_KEY', 'GSC_SITE_URL'] as const

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
})

describe('getSearchConsoleEnv', () => {
  it('is null unless all three values are set', () => {
    expect(getSearchConsoleEnv()).toBeNull()
    process.env.GSC_CLIENT_EMAIL = 'gyms@project.iam.gserviceaccount.com'
    process.env.GSC_SITE_URL = 'https://gdgoc.yonsei.ac.kr/'
    expect(getSearchConsoleEnv()).toBeNull()
  })

  it('turns escaped newlines in the private key into real ones', () => {
    process.env.GSC_CLIENT_EMAIL = 'gyms@project.iam.gserviceaccount.com'
    process.env.GSC_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n'
    process.env.GSC_SITE_URL = 'sc-domain:gdgoc.yonsei.ac.kr'
    expect(getSearchConsoleEnv()).toEqual({
      clientEmail: 'gyms@project.iam.gserviceaccount.com',
      privateKey:
        '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n',
      siteUrl: 'sc-domain:gdgoc.yonsei.ac.kr',
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/server/search-console-env.test.ts`
Expected: FAIL — `getSearchConsoleEnv` is not exported

- [ ] **Step 3: Implement**

`lib/server/env-core.ts`: `baseServerEnvSchema`의 `REDIS_URL` 줄 다음에 추가한다.

```ts
  GSC_CLIENT_EMAIL: z.string().email().optional(),
  GSC_PRIVATE_KEY: z.string().min(1).optional(),
  GSC_SITE_URL: z.string().min(1).optional(),
```

파일 끝에 추가한다.

```ts
export type SearchConsoleEnv = {
  clientEmail: string
  privateKey: string
  siteUrl: string
}

/** Search Console 연동은 선택 기능이라 값이 하나라도 없으면 오류 대신 null이다. 배포 패널은 키를 한 줄로 받으므로 `\n`을 줄바꿈으로 되돌린다. */
export function getSearchConsoleEnv(): SearchConsoleEnv | null {
  const env = getBaseServerEnv()
  if (!env.GSC_CLIENT_EMAIL || !env.GSC_PRIVATE_KEY || !env.GSC_SITE_URL) {
    return null
  }
  return {
    clientEmail: env.GSC_CLIENT_EMAIL,
    privateKey: env.GSC_PRIVATE_KEY.replaceAll('\\n', '\n'),
    siteUrl: env.GSC_SITE_URL,
  }
}
```

`lib/server/cache/policy.ts`: `cacheLifeConfig`의 `sitemap` 다음에 추가한다.

```ts
  // Search Console 데이터는 2~3일 늦게 쌓이고 API 할당량이 있어 길게 캐시한다.
  searchConsole: {
    stale: 60 * 60,
    revalidate: 60 * 60 * 6,
    expire: 60 * 60 * 24,
  },
```

`.env.example` 끝에 추가한다.

```text
# Search Console(선택). 서비스 계정 JSON 키의 client_email·private_key, 속성 주소(https://gdgoc.yonsei.ac.kr/ 또는 sc-domain:gdgoc.yonsei.ac.kr)
GSC_CLIENT_EMAIL=
GSC_PRIVATE_KEY=
GSC_SITE_URL=
```

`docs/development.md` 환경 변수 표의 `REDIS_URL` 행 다음에 추가한다.

```markdown
| `GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY`, `GSC_SITE_URL` | 아니오 | Search Console 연동(GYMS 분석 검색 탭·MCP). 설정 방법: `docs/architecture/analytics.md` |
```

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/lib/server/search-console-env.test.ts && pnpm test:types`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/env-core.ts lib/server/cache/policy.ts .env.example docs/development.md tests/lib/server/search-console-env.test.ts
git commit -m "feat(analytics): read optional Search Console credentials"
```

---

### Task 2: SEO 개선 기회 판정 (순수 함수)

**Files:**

- Create: `lib/analytics/seo.ts`
- Test: `tests/lib/analytics/seo.test.ts`

**Interfaces:**

- Produces:
  - `type SearchMetrics = { clicks: number; impressions: number; ctr: number; position: number }`
  - `type QueryPageRow = SearchMetrics & { query: string; page: string }`
  - `type LandingEngagement = { path: string; sessions: number; engagementRate: number; avgEngagementSeconds: number }`
  - 상수 `LOW_CTR_MIN_IMPRESSIONS = 50`, `STRIKING_MIN_IMPRESSIONS = 20`, `STRIKING_MIN_POSITION = 8`, `STRIKING_MAX_POSITION = 20`, `LOW_ENGAGEMENT_MIN_SESSIONS = 5`, `LOW_ENGAGEMENT_MAX_RATE = 0.5`, `OPPORTUNITY_LIMIT = 20`
  - `expectedCtr(position: number): number`, `pathFromSearchConsolePage(page: string): string`
  - `findLowCtr(rows: QueryPageRow[]): Array<QueryPageRow & { expectedCtr: number }>`
  - `findStrikingDistance(rows: QueryPageRow[]): QueryPageRow[]`
  - `findLowEngagementLandings(landings: LandingEngagement[], pages: Array<SearchMetrics & { page: string }>): Array<LandingEngagement & { impressions: number; clicks: number }>`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/analytics/seo.test.ts
import { describe, expect, it } from 'vitest'
import {
  expectedCtr,
  findLowCtr,
  findLowEngagementLandings,
  findStrikingDistance,
  pathFromSearchConsolePage,
  type QueryPageRow,
} from '@/lib/analytics/seo'

const row = (overrides: Partial<QueryPageRow>): QueryPageRow => ({
  query: 'gdgoc',
  page: 'https://gdgoc.yonsei.ac.kr/ko',
  clicks: 0,
  impressions: 100,
  ctr: 0,
  position: 1,
  ...overrides,
})

describe('expectedCtr', () => {
  it('uses the reference curve and floors past page one', () => {
    expect(expectedCtr(1)).toBe(0.28)
    expect(expectedCtr(1.4)).toBe(0.28)
    expect(expectedCtr(3)).toBe(0.11)
    expect(expectedCtr(15)).toBe(0.01)
    expect(expectedCtr(0.4)).toBe(0.28)
  })
})

describe('pathFromSearchConsolePage', () => {
  it('normalizes Search Console page URLs to site paths', () => {
    expect(
      pathFromSearchConsolePage('https://gdgoc.yonsei.ac.kr/ko/session/')
    ).toBe('/ko/session')
    expect(
      pathFromSearchConsolePage('https://www.gdgoc.yonsei.ac.kr/en?utm=x#top')
    ).toBe('/en')
    expect(pathFromSearchConsolePage('https://gdgoc.yonsei.ac.kr/')).toBe('/')
    expect(pathFromSearchConsolePage('not a url')).toBe('not a url')
  })
})

describe('findLowCtr', () => {
  it('keeps rows with enough impressions and under half the typical CTR, by impressions', () => {
    const rows = [
      row({ query: 'a', impressions: 400, ctr: 0.05, position: 2 }),
      row({ query: 'b', impressions: 900, ctr: 0.1, position: 2 }),
      row({ query: 'c', impressions: 40, ctr: 0, position: 1 }),
      row({ query: 'd', impressions: 600, ctr: 0.02, position: 1 }),
    ]
    expect(
      findLowCtr(rows).map((item) => [item.query, item.expectedCtr])
    ).toEqual([
      ['d', 0.28],
      ['a', 0.15],
    ])
  })
})

describe('findStrikingDistance', () => {
  it('keeps positions 8 to 20 with at least 20 impressions', () => {
    const rows = [
      row({ query: 'a', position: 7.9, impressions: 500 }),
      row({ query: 'b', position: 8, impressions: 30 }),
      row({ query: 'c', position: 20, impressions: 300 }),
      row({ query: 'd', position: 12, impressions: 10 }),
      row({ query: 'e', position: 21, impressions: 900 }),
    ]
    expect(findStrikingDistance(rows).map((item) => item.query)).toEqual([
      'c',
      'b',
    ])
  })
})

describe('findLowEngagementLandings', () => {
  it('joins search impressions onto low-engagement organic landing pages', () => {
    const landings = [
      {
        path: '/ko/session',
        sessions: 12,
        engagementRate: 0.3,
        avgEngagementSeconds: 8,
      },
      {
        path: '/ko',
        sessions: 40,
        engagementRate: 0.7,
        avgEngagementSeconds: 50,
      },
      {
        path: '/en/project',
        sessions: 4,
        engagementRate: 0.1,
        avgEngagementSeconds: 3,
      },
      {
        path: '/ko/calendar',
        sessions: 6,
        engagementRate: 0.2,
        avgEngagementSeconds: 5,
      },
    ]
    const pages = [
      {
        page: 'https://gdgoc.yonsei.ac.kr/ko/session/',
        clicks: 10,
        impressions: 300,
        ctr: 0.03,
        position: 6,
      },
    ]
    expect(findLowEngagementLandings(landings, pages)).toEqual([
      {
        path: '/ko/session',
        sessions: 12,
        engagementRate: 0.3,
        avgEngagementSeconds: 8,
        impressions: 300,
        clicks: 10,
      },
      {
        path: '/ko/calendar',
        sessions: 6,
        engagementRate: 0.2,
        avgEngagementSeconds: 5,
        impressions: 0,
        clicks: 0,
      },
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/analytics/seo.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/analytics/seo.ts
/**
 * SEO 개선 기회 판정(명세 10장). 기준값은 이 파일에만 둔다.
 * 순위별 일반 클릭률은 공개된 업계 평균을 반올림한 참고치다. 정확한 기대값이 아니라 "눈에 띄게 낮은지" 거르는 데 쓴다.
 */

export type SearchMetrics = {
  clicks: number
  impressions: number
  ctr: number
  position: number
}
export type QueryPageRow = SearchMetrics & { query: string; page: string }
export type LandingEngagement = {
  path: string
  sessions: number
  engagementRate: number
  avgEngagementSeconds: number
}

export const LOW_CTR_MIN_IMPRESSIONS = 50
export const STRIKING_MIN_IMPRESSIONS = 20
export const STRIKING_MIN_POSITION = 8
export const STRIKING_MAX_POSITION = 20
export const LOW_ENGAGEMENT_MIN_SESSIONS = 5
export const LOW_ENGAGEMENT_MAX_RATE = 0.5
export const OPPORTUNITY_LIMIT = 20

// 1~10위. 11위부터는 두 번째 페이지라 1%로 본다.
const EXPECTED_CTR_BY_POSITION = [
  0.28, 0.15, 0.11, 0.08, 0.07, 0.05, 0.04, 0.03, 0.03, 0.025,
]

export function expectedCtr(position: number): number {
  const rank = Math.max(1, Math.round(position))
  return EXPECTED_CTR_BY_POSITION[rank - 1] ?? 0.01
}

/** Search Console 페이지 주소를 우리 수집 경로 모양으로 맞춘다(호스트·쿼리·해시·끝 슬래시 제거). */
export function pathFromSearchConsolePage(page: string): string {
  try {
    const path = new URL(page).pathname.replace(/\/+$/, '')
    return path || '/'
  } catch {
    return page
  }
}

const byImpressions = <T extends { impressions: number }>(a: T, b: T) =>
  b.impressions - a.impressions

export function findLowCtr(
  rows: QueryPageRow[]
): Array<QueryPageRow & { expectedCtr: number }> {
  return rows
    .map((row) => ({ ...row, expectedCtr: expectedCtr(row.position) }))
    .filter(
      (row) =>
        row.impressions >= LOW_CTR_MIN_IMPRESSIONS &&
        row.ctr < row.expectedCtr / 2
    )
    .sort(byImpressions)
    .slice(0, OPPORTUNITY_LIMIT)
}

export function findStrikingDistance(rows: QueryPageRow[]): QueryPageRow[] {
  return rows
    .filter(
      (row) =>
        row.position >= STRIKING_MIN_POSITION &&
        row.position <= STRIKING_MAX_POSITION &&
        row.impressions >= STRIKING_MIN_IMPRESSIONS
    )
    .sort(byImpressions)
    .slice(0, OPPORTUNITY_LIMIT)
}

/** 검색에 노출되지 않은 페이지도 남긴다(노출 0). 참여가 낮다는 사실 자체가 개선 대상이다. */
export function findLowEngagementLandings(
  landings: LandingEngagement[],
  pages: Array<SearchMetrics & { page: string }>
): Array<LandingEngagement & { impressions: number; clicks: number }> {
  const searchByPath = new Map(
    pages.map((page) => [pathFromSearchConsolePage(page.page), page])
  )
  return landings
    .filter(
      (row) =>
        row.sessions >= LOW_ENGAGEMENT_MIN_SESSIONS &&
        row.engagementRate < LOW_ENGAGEMENT_MAX_RATE
    )
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, OPPORTUNITY_LIMIT)
    .map((row) => {
      const search = searchByPath.get(row.path)
      return {
        ...row,
        impressions: search?.impressions ?? 0,
        clicks: search?.clicks ?? 0,
      }
    })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/lib/analytics/seo.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/analytics/seo.ts tests/lib/analytics/seo.test.ts
git commit -m "feat(analytics): find SEO opportunities from search and engagement data"
```

---

### Task 3: Search Console 토큰과 API 클라이언트

**Files:**

- Create: `lib/server/analytics/search-console/errors.ts`
- Create: `lib/server/analytics/search-console/token.ts`
- Create: `lib/server/analytics/search-console/client.ts`
- Test: `tests/lib/analytics/search-console-client.test.ts`

**Interfaces:**

- Consumes: `SearchConsoleEnv` (Task 1)
- Produces:
  - `errors.ts`: `class SearchConsoleError extends Error { status: number }` (`client.ts`가 다시 export한다)
  - `token.ts`: `SEARCH_CONSOLE_SCOPE`, `createAssertion(env: SearchConsoleEnv, nowSeconds: number): string`, `getAccessToken(env: SearchConsoleEnv, fetchImpl?: typeof fetch, now?: () => number): Promise<string>`, `clearAccessTokenCache(): void`
  - `client.ts`: `type SearchDimension = 'query' | 'page' | 'device' | 'country' | 'date'`, `type SearchAnalyticsRequest = { startDate: string; endDate: string; dimensions: SearchDimension[]; rowLimit: number; device?: 'MOBILE' | 'DESKTOP' | 'TABLET'; pageContains?: string }`, `type SearchAnalyticsRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }`, `class SearchConsoleError extends Error { status: number }`, `querySearchAnalytics(env: SearchConsoleEnv, request: SearchAnalyticsRequest, fetchImpl?: typeof fetch): Promise<SearchAnalyticsRow[]>`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/analytics/search-console-client.test.ts
import { createVerify, generateKeyPairSync } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SearchConsoleError,
  querySearchAnalytics,
} from '@/lib/server/analytics/search-console/client'
import {
  clearAccessTokenCache,
  createAssertion,
  getAccessToken,
} from '@/lib/server/analytics/search-console/token'

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
})

const env = {
  clientEmail: 'gyms@project.iam.gserviceaccount.com',
  privateKey,
  siteUrl: 'https://gdgoc.yonsei.ac.kr/',
}

function decode(part: string) {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<
    string,
    unknown
  >
}

beforeEach(() => {
  clearAccessTokenCache()
})

describe('createAssertion', () => {
  it('signs a read-only JWT bearer assertion with RS256', () => {
    const jwt = createAssertion(env, 1_800_000_000)
    const [header, claims, signature] = jwt.split('.')
    expect(decode(header!)).toEqual({ alg: 'RS256', typ: 'JWT' })
    expect(decode(claims!)).toEqual({
      iss: env.clientEmail,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: 1_800_000_000,
      exp: 1_800_003_600,
    })
    const verifier = createVerify('RSA-SHA256')
    verifier.update(`${header}.${claims}`)
    expect(
      verifier.verify(publicKey, Buffer.from(signature!, 'base64url'))
    ).toBe(true)
  })
})

describe('getAccessToken', () => {
  it('exchanges the assertion once and reuses the token until it nearly expires', async () => {
    let now = 1_800_000_000_000
    const fetchImpl = vi.fn(async () =>
      Response.json({ access_token: 'token-1', expires_in: 3600 })
    )

    await expect(getAccessToken(env, fetchImpl, () => now)).resolves.toBe(
      'token-1'
    )
    await expect(getAccessToken(env, fetchImpl, () => now)).resolves.toBe(
      'token-1'
    )
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ]
    expect(url).toBe('https://oauth2.googleapis.com/token')
    expect(String(init.body)).toContain(
      'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer'
    )

    now += 3_550_000
    await getAccessToken(env, fetchImpl, () => now)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('reports a rejected key as a SearchConsoleError', async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ error: 'invalid_grant' }, { status: 400 })
    )
    await expect(getAccessToken(env, fetchImpl)).rejects.toMatchObject({
      status: 400,
    })
  })
})

describe('querySearchAnalytics', () => {
  it('posts the query with filters and maps rows', async () => {
    const fetchImpl = vi.fn(async (url: string) =>
      url.includes('oauth2')
        ? Response.json({ access_token: 'token-1', expires_in: 3600 })
        : Response.json({
            rows: [
              {
                keys: ['gdgoc yonsei'],
                clicks: 3,
                impressions: 40,
                ctr: 0.075,
                position: 2.4,
              },
            ],
          })
    )
    const rows = await querySearchAnalytics(
      env,
      {
        startDate: '2026-09-16',
        endDate: '2026-10-13',
        dimensions: ['query'],
        rowLimit: 100,
        device: 'MOBILE',
        pageContains: '/ko/session',
      },
      fetchImpl
    )
    expect(rows).toEqual([
      {
        keys: ['gdgoc yonsei'],
        clicks: 3,
        impressions: 40,
        ctr: 0.075,
        position: 2.4,
      },
    ])

    const [url, init] = fetchImpl.mock.calls[1] as unknown as [
      string,
      RequestInit,
    ]
    expect(url).toBe(
      'https://searchconsole.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fgdgoc.yonsei.ac.kr%2F/searchAnalytics/query'
    )
    expect(init.headers).toMatchObject({ Authorization: 'Bearer token-1' })
    expect(JSON.parse(String(init.body))).toEqual({
      startDate: '2026-09-16',
      endDate: '2026-10-13',
      dimensions: ['query'],
      rowLimit: 100,
      type: 'web',
      dataState: 'all',
      dimensionFilterGroups: [
        {
          groupType: 'and',
          filters: [
            { dimension: 'device', operator: 'equals', expression: 'MOBILE' },
            {
              dimension: 'page',
              operator: 'contains',
              expression: '/ko/session',
            },
          ],
        },
      ],
    })
  })

  it('returns an empty list when the API has no rows and throws on errors', async () => {
    const empty = vi.fn(async (url: string) =>
      url.includes('oauth2')
        ? Response.json({ access_token: 't', expires_in: 3600 })
        : Response.json({})
    )
    await expect(
      querySearchAnalytics(
        env,
        {
          startDate: '2026-10-01',
          endDate: '2026-10-02',
          dimensions: [],
          rowLimit: 1,
        },
        empty
      )
    ).resolves.toEqual([])

    clearAccessTokenCache()
    const denied = vi.fn(async (url: string) =>
      url.includes('oauth2')
        ? Response.json({ access_token: 't', expires_in: 3600 })
        : Response.json(
            { error: { message: 'User does not have sufficient permission' } },
            { status: 403 }
          )
    )
    const error = await querySearchAnalytics(
      env,
      {
        startDate: '2026-10-01',
        endDate: '2026-10-02',
        dimensions: [],
        rowLimit: 1,
      },
      denied
    ).catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(SearchConsoleError)
    expect(error).toMatchObject({ status: 403 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/analytics/search-console-client.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/server/analytics/search-console/errors.ts
/** Search Console 호출 실패. 서비스가 HTTP 상태로 안내 문구를 고른다(403 권한, 429 할당량). 토큰·조회 모듈이 함께 쓴다. */
import 'server-only'

export class SearchConsoleError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'SearchConsoleError'
  }
}
```

```ts
// lib/server/analytics/search-console/token.ts
/**
 * Google 서비스 계정 JWT bearer 흐름(RFC 7523). 의존성을 늘리지 않으려고 RS256 서명을 node:crypto로 직접 한다.
 * 토큰은 프로세스 메모리에 만료 60초 전까지 보관한다.
 */
import 'server-only'

import { createSign } from 'node:crypto'
import { SearchConsoleError } from '@/lib/server/analytics/search-console/errors'
import type { SearchConsoleEnv } from '@/lib/server/env'

export const SEARCH_CONSOLE_SCOPE =
  'https://www.googleapis.com/auth/webmasters.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const ASSERTION_LIFETIME_SECONDS = 3600
const EXPIRY_MARGIN_MS = 60_000

let cached: { token: string; expiresAt: number; clientEmail: string } | null =
  null

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url')
}

export function createAssertion(
  env: SearchConsoleEnv,
  nowSeconds: number
): string {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = base64url(
    JSON.stringify({
      iss: env.clientEmail,
      scope: SEARCH_CONSOLE_SCOPE,
      aud: TOKEN_URL,
      iat: nowSeconds,
      exp: nowSeconds + ASSERTION_LIFETIME_SECONDS,
    })
  )
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  return `${header}.${claims}.${base64url(signer.sign(env.privateKey))}`
}

/** 테스트와 자격 증명 교체 뒤에 쓴다. */
export function clearAccessTokenCache(): void {
  cached = null
}

export async function getAccessToken(
  env: SearchConsoleEnv,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now
): Promise<string> {
  if (
    cached &&
    cached.clientEmail === env.clientEmail &&
    cached.expiresAt - EXPIRY_MARGIN_MS > now()
  ) {
    return cached.token
  }
  const response = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: createAssertion(env, Math.floor(now() / 1000)),
    }),
  })
  const body = (await response.json().catch(() => ({}))) as {
    access_token?: string
    expires_in?: number
    error?: string
  }
  if (!response.ok || !body.access_token) {
    throw new SearchConsoleError(
      response.status,
      body.error ?? 'Failed to get a Search Console access token'
    )
  }
  cached = {
    token: body.access_token,
    expiresAt: now() + (body.expires_in ?? ASSERTION_LIFETIME_SECONDS) * 1000,
    clientEmail: env.clientEmail,
  }
  return cached.token
}
```

```ts
// lib/server/analytics/search-console/client.ts
/** Search Console Search Analytics API 호출. 응답 행을 그대로 돌려주고, 실패는 HTTP 상태를 담은 SearchConsoleError로 던진다. */
import 'server-only'

import { SearchConsoleError } from '@/lib/server/analytics/search-console/errors'
import { getAccessToken } from '@/lib/server/analytics/search-console/token'
import type { SearchConsoleEnv } from '@/lib/server/env'

export { SearchConsoleError }

export type SearchDimension = 'query' | 'page' | 'device' | 'country' | 'date'

export type SearchAnalyticsRequest = {
  startDate: string
  endDate: string
  dimensions: SearchDimension[]
  rowLimit: number
  device?: 'MOBILE' | 'DESKTOP' | 'TABLET'
  pageContains?: string
}

export type SearchAnalyticsRow = {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export async function querySearchAnalytics(
  env: SearchConsoleEnv,
  request: SearchAnalyticsRequest,
  fetchImpl: typeof fetch = fetch
): Promise<SearchAnalyticsRow[]> {
  const filters = [
    ...(request.device
      ? [
          {
            dimension: 'device',
            operator: 'equals',
            expression: request.device,
          },
        ]
      : []),
    ...(request.pageContains
      ? [
          {
            dimension: 'page',
            operator: 'contains',
            expression: request.pageContains,
          },
        ]
      : []),
  ]
  const token = await getAccessToken(env, fetchImpl)
  const response = await fetchImpl(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(env.siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: request.startDate,
        endDate: request.endDate,
        dimensions: request.dimensions,
        rowLimit: request.rowLimit,
        type: 'web',
        // 최근 2~3일의 잠정 데이터까지 받는다. 화면에는 기준일을 따로 표시한다.
        dataState: 'all',
        ...(filters.length > 0
          ? { dimensionFilterGroups: [{ groupType: 'and', filters }] }
          : {}),
      }),
    }
  )
  const body = (await response.json().catch(() => ({}))) as {
    rows?: SearchAnalyticsRow[]
    error?: { message?: string }
  }
  if (!response.ok) {
    throw new SearchConsoleError(
      response.status,
      body.error?.message ?? 'Search Console request failed'
    )
  }
  return (body.rows ?? []).map((row) => ({
    keys: row.keys ?? [],
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/lib/analytics/search-console-client.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/analytics/search-console tests/lib/analytics/search-console-client.test.ts
git commit -m "feat(analytics): query Search Console with a service account"
```

---

### Task 4: 캐시 조회와 검색 서비스

**Files:**

- Create: `lib/server/analytics/search-console/reports.ts`
- Create: `lib/server/services/admin/search-console.ts`
- Test: `tests/lib/server/services/search-console.test.ts`

**Interfaces:**

- Consumes: `getSearchConsoleEnv` (Task 1), `findLowCtr`/`findStrikingDistance`/`findLowEngagementLandings`/`pathFromSearchConsolePage`/`SearchMetrics` (Task 2), `querySearchAnalytics`/`SearchAnalyticsRequest`/`SearchConsoleError` (Task 3), `resolveDateRange`/`seoulDateString` (계획 B), `aggregateSessions`/`withAnalyticsTimeout` (계획 B), `deriveSessionMetrics`, `authorize`
- Produces:
  - `reports.ts`: `fetchSearchAnalytics(request: SearchAnalyticsRequest): Promise<SearchAnalyticsRow[]>`
  - `search-console.ts`:
    - `type SearchRow<K extends string> = Record<K, string> & SearchMetrics`
    - `type SearchConsoleOverview = { configured: false } | { configured: true; dataThrough: string; totals: SearchMetrics; previousTotals: SearchMetrics | null; series: SearchRow<'date'>[]; queries: SearchRow<'query'>[]; pages: SearchRow<'page'>[]; devices: SearchRow<'device'>[]; countries: SearchRow<'country'>[] }`
    - `type SeoOpportunities = { configured: false } | { configured: true; dataThrough: string; lowCtr: Array<QueryPageRow & { expectedCtr: number }>; strikingDistance: QueryPageRow[]; lowEngagementLandings: Array<LandingEngagement & { impressions: number; clicks: number }> }`
    - `getSearchConsoleOverview(actor, filter, now?)`, `getSeoOpportunities(actor, filter, now?)`, `getSearchConsoleTable(actor, dimension: SearchDimension, filter, limit: number, now?)` → `ServiceResult<{ configured: false } | { configured: true; dataThrough: string; rows: Array<Record<string, string | number>> }>`
    - `searchDateWindow(filter, now): { startDate: string; endDate: string; previousStartDate: string; previousEndDate: string }`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/server/services/search-console.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetchSearchAnalytics: vi.fn(),
  getSearchConsoleEnv: vi.fn(),
  aggregateSessions: vi.fn(),
}))

vi.mock('@/db', () => ({
  db: {
    transaction: (work: (tx: unknown) => unknown) => work({ execute: vi.fn() }),
  },
}))
vi.mock('@/lib/server/analytics/search-console/reports', () => ({
  fetchSearchAnalytics: mocks.fetchSearchAnalytics,
}))
vi.mock('@/lib/server/env', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/server/env')>()),
  getSearchConsoleEnv: mocks.getSearchConsoleEnv,
}))
vi.mock('@/lib/server/analytics/queries/sessions', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/analytics/queries/sessions')
  >()),
  aggregateSessions: mocks.aggregateSessions,
}))

import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import { SearchConsoleError } from '@/lib/server/analytics/search-console/client'
import {
  getSearchConsoleOverview,
  getSeoOpportunities,
  searchDateWindow,
} from '@/lib/server/services/admin/search-console'
import type { Actor } from '@/lib/server/services/admin/types'

const NOW = new Date('2026-10-14T05:00:00.000Z')
const member: Actor = {
  userId: 'm',
  role: 'MEMBER',
  scopes: 'session',
  via: 'web',
}
const metrics = { clicks: 5, impressions: 100, ctr: 0.05, position: 4 }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getSearchConsoleEnv.mockReturnValue({
    clientEmail: 'a@b.iam.gserviceaccount.com',
    privateKey: 'k',
    siteUrl: 'https://gdgoc.yonsei.ac.kr/',
  })
})

describe('searchDateWindow', () => {
  it('ends no later than yesterday in Seoul', () => {
    expect(searchDateWindow(DEFAULT_ANALYTICS_FILTER, NOW)).toEqual({
      startDate: '2026-09-17',
      endDate: '2026-10-13',
      previousStartDate: '2026-08-20',
      previousEndDate: '2026-09-16',
    })
  })
})

describe('getSearchConsoleOverview', () => {
  it('reports not configured without credentials and never calls the API', async () => {
    mocks.getSearchConsoleEnv.mockReturnValue(null)
    await expect(
      getSearchConsoleOverview(member, DEFAULT_ANALYTICS_FILTER, NOW)
    ).resolves.toEqual({
      ok: true,
      data: { configured: false },
    })
    expect(mocks.fetchSearchAnalytics).not.toHaveBeenCalled()
  })

  it('maps totals, series and dimension tables, applying device and path filters', async () => {
    mocks.fetchSearchAnalytics.mockImplementation(
      async (request: { dimensions: string[] }) => {
        const [dimension] = request.dimensions
        if (!dimension) return [{ keys: [], ...metrics }]
        if (dimension === 'page')
          return [
            { keys: ['https://gdgoc.yonsei.ac.kr/ko/session/'], ...metrics },
          ]
        if (dimension === 'device') return [{ keys: ['MOBILE'], ...metrics }]
        return [
          { keys: [dimension === 'date' ? '2026-10-13' : 'gdgoc'], ...metrics },
        ]
      }
    )
    const result = await getSearchConsoleOverview(
      member,
      { ...DEFAULT_ANALYTICS_FILTER, device: 'mobile', path: '/ko' },
      NOW
    )
    if (!result.ok || !result.data.configured) throw new Error('expected data')
    expect(result.data).toMatchObject({
      dataThrough: '2026-10-13',
      totals: metrics,
      previousTotals: metrics,
      series: [{ date: '2026-10-13', ...metrics }],
      queries: [{ query: 'gdgoc', ...metrics }],
      pages: [{ page: '/ko/session', ...metrics }],
      devices: [{ device: 'mobile', ...metrics }],
    })
    expect(mocks.fetchSearchAnalytics).toHaveBeenCalledWith(
      expect.objectContaining({
        device: 'MOBILE',
        pageContains: '/ko',
        endDate: '2026-10-13',
      })
    )
  })

  it('explains a permission error', async () => {
    mocks.fetchSearchAnalytics.mockRejectedValue(
      new SearchConsoleError(403, 'forbidden')
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(
      getSearchConsoleOverview(member, DEFAULT_ANALYTICS_FILTER, NOW)
    ).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining('service account email'),
    })
    consoleError.mockRestore()
  })

  it('explains a quota error', async () => {
    mocks.fetchSearchAnalytics.mockRejectedValue(
      new SearchConsoleError(429, 'quota')
    )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(
      getSearchConsoleOverview(member, DEFAULT_ANALYTICS_FILTER, NOW)
    ).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining('quota'),
    })
    consoleError.mockRestore()
  })

  it('rejects unverified accounts', async () => {
    await expect(
      getSearchConsoleOverview(
        { ...member, role: 'UNVERIFIED' },
        DEFAULT_ANALYTICS_FILTER,
        NOW
      )
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })
})

describe('getSeoOpportunities', () => {
  it('combines Search Console rows with organic landing engagement', async () => {
    mocks.fetchSearchAnalytics.mockImplementation(
      async (request: { dimensions: string[] }) =>
        request.dimensions.join() === 'query,page'
          ? [
              {
                keys: ['gdgoc', 'https://gdgoc.yonsei.ac.kr/ko'],
                clicks: 1,
                impressions: 500,
                ctr: 0.002,
                position: 1.2,
              },
              {
                keys: ['study group', 'https://gdgoc.yonsei.ac.kr/ko/session'],
                clicks: 2,
                impressions: 80,
                ctr: 0.025,
                position: 11,
              },
            ]
          : [
              {
                keys: ['https://gdgoc.yonsei.ac.kr/ko/session'],
                clicks: 2,
                impressions: 80,
                ctr: 0.025,
                position: 11,
              },
            ]
    )
    mocks.aggregateSessions.mockResolvedValue([
      {
        dimensions: { landingPath: '/ko/session' },
        metrics: {
          users: 9,
          newUsers: 9,
          sessions: 10,
          engagedSessions: 2,
          views: 10,
          engagementMs: 50_000,
          keyEvents: 0,
        },
      },
    ])
    const result = await getSeoOpportunities(
      member,
      DEFAULT_ANALYTICS_FILTER,
      NOW
    )
    if (!result.ok || !result.data.configured) throw new Error('expected data')
    expect(result.data.lowCtr.map((row) => row.query)).toEqual(['gdgoc'])
    expect(result.data.strikingDistance.map((row) => row.query)).toEqual([
      'study group',
    ])
    expect(result.data.lowEngagementLandings).toEqual([
      {
        path: '/ko/session',
        sessions: 10,
        engagementRate: 0.2,
        avgEngagementSeconds: 5,
        impressions: 80,
        clicks: 2,
      },
    ])
    expect(mocks.aggregateSessions).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        dimensions: ['landingPath'],
        filter: expect.objectContaining({ channel: 'Organic Search' }),
      })
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/server/services/search-console.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/server/analytics/search-console/reports.ts
/**
 * Search Console 응답을 인스턴스 간 공유 캐시에 6시간 둔다(API 할당량과 데이터 지연 때문).
 * 예외는 캐시되지 않으므로 권한·할당량 오류가 풀리면 다음 요청에 바로 반영된다.
 */
import 'server-only'

import { cacheLife, cacheTag } from 'next/cache'
import {
  querySearchAnalytics,
  type SearchAnalyticsRequest,
  type SearchAnalyticsRow,
} from '@/lib/server/analytics/search-console/client'
import { getSearchConsoleEnv } from '@/lib/server/env'

export async function fetchSearchAnalytics(
  request: SearchAnalyticsRequest
): Promise<SearchAnalyticsRow[]> {
  'use cache: remote'

  cacheLife('searchConsole')
  cacheTag('search-console')

  const env = getSearchConsoleEnv()
  if (!env) return []
  return querySearchAnalytics(env, request)
}
```

```ts
// lib/server/services/admin/search-console.ts
/**
 * 검색 탭·MCP가 쓰는 Search Console 읽기 서비스. 자격 증명이 없으면 실패 대신 `configured: false`를 돌려
 * 화면이 설정 안내를 그리게 한다. 우리 필터 중 기기·경로만 Search Console 요청에 반영된다.
 */
import 'server-only'

import { resolveDateRange, seoulDateString } from '@/lib/analytics/date-range'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import { deriveSessionMetrics } from '@/lib/analytics/metrics'
import {
  findLowCtr,
  findLowEngagementLandings,
  findStrikingDistance,
  pathFromSearchConsolePage,
  type LandingEngagement,
  type QueryPageRow,
  type SearchMetrics,
} from '@/lib/analytics/seo'
import { aggregateSessions } from '@/lib/server/analytics/queries/sessions'
import { withAnalyticsTimeout } from '@/lib/server/analytics/queries/sql'
import {
  SearchConsoleError,
  type SearchAnalyticsRequest,
  type SearchAnalyticsRow,
  type SearchDimension,
} from '@/lib/server/analytics/search-console/client'
import { fetchSearchAnalytics } from '@/lib/server/analytics/search-console/reports'
import { getSearchConsoleEnv } from '@/lib/server/env'
import { logger } from '@/lib/server/logger'
import { authorize } from '@/lib/server/services/admin/authorize'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'

export type SearchRow<K extends string> = Record<K, string> & SearchMetrics

type NotConfigured = { configured: false }

export type SearchConsoleOverview =
  | NotConfigured
  | {
      configured: true
      dataThrough: string
      totals: SearchMetrics
      previousTotals: SearchMetrics | null
      series: SearchRow<'date'>[]
      queries: SearchRow<'query'>[]
      pages: SearchRow<'page'>[]
      devices: SearchRow<'device'>[]
      countries: SearchRow<'country'>[]
    }

export type SeoOpportunities =
  | NotConfigured
  | {
      configured: true
      dataThrough: string
      lowCtr: Array<QueryPageRow & { expectedCtr: number }>
      strikingDistance: QueryPageRow[]
      lowEngagementLandings: Array<
        LandingEngagement & { impressions: number; clicks: number }
      >
    }

const DAY_MS = 24 * 60 * 60 * 1000
const EMPTY_METRICS: SearchMetrics = {
  clicks: 0,
  impressions: 0,
  ctr: 0,
  position: 0,
}

/** Search Console 날짜(YYYY-MM-DD, 양 끝 포함). 오늘 데이터는 거의 비어 있어 종료일을 어제로 자른다. */
export function searchDateWindow(filter: AnalyticsFilter, now: Date) {
  const range = resolveDateRange(filter, now)
  const yesterday = seoulDateString(new Date(now.getTime() - DAY_MS))
  const clamp = (date: string) => (date > yesterday ? yesterday : date)
  return {
    startDate: clamp(seoulDateString(range.start)),
    endDate: clamp(seoulDateString(new Date(range.end.getTime() - 1))),
    previousStartDate: seoulDateString(range.previousStart),
    previousEndDate: seoulDateString(new Date(range.previousEnd.getTime() - 1)),
  }
}

function requestFilters(
  filter: AnalyticsFilter
): Pick<SearchAnalyticsRequest, 'device' | 'pageContains'> {
  return {
    device: filter.device
      ? (filter.device.toUpperCase() as SearchAnalyticsRequest['device'])
      : undefined,
    pageContains: filter.path ?? undefined,
  }
}

function metricsOf(row: SearchAnalyticsRow | undefined): SearchMetrics {
  return row
    ? {
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      }
    : EMPTY_METRICS
}

function keyed<K extends string>(
  rows: SearchAnalyticsRow[],
  key: K,
  map: (value: string) => string = (value) => value
) {
  return rows.map(
    (row) =>
      ({ [key]: map(row.keys[0] ?? ''), ...metricsOf(row) }) as SearchRow<K>
  )
}

function friendlyError(error: unknown): string {
  if (error instanceof SearchConsoleError) {
    if (error.status === 401 || error.status === 403) {
      return 'Search Console denied access. Add the service account email as a user on the Search Console property.'
    }
    if (error.status === 429)
      return 'The Search Console API quota is used up. Try again in a few minutes.'
    if (error.status === 400)
      return 'Search Console rejected the request. Check GSC_SITE_URL and the service account key.'
  }
  return 'Failed to load Search Console data'
}

async function runSearchRead<T>(
  actor: Actor,
  scope: string,
  work: () => Promise<T>
): Promise<ServiceResult<T | NotConfigured>> {
  const authorization = authorize(actor, 'get', 'analyticsPage')
  if (!authorization.ok) return authorization
  if (!getSearchConsoleEnv()) return ok({ configured: false })
  try {
    return ok(await work())
  } catch (error) {
    logger.error(scope, error)
    return fail('INTERNAL', friendlyError(error))
  }
}

export function getSearchConsoleOverview(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<SearchConsoleOverview>> {
  const window = searchDateWindow(filter, now)
  const base = {
    startDate: window.startDate,
    endDate: window.endDate,
    ...requestFilters(filter),
  }
  const by = (dimension: SearchDimension, rowLimit: number) =>
    fetchSearchAnalytics({ ...base, dimensions: [dimension], rowLimit })

  return runSearchRead(actor, 'analytics.search-console.overview', async () => {
    const [totals, previous, series, queries, pages, devices, countries] =
      await Promise.all([
        fetchSearchAnalytics({ ...base, dimensions: [], rowLimit: 1 }),
        filter.compare
          ? fetchSearchAnalytics({
              ...base,
              startDate: window.previousStartDate,
              endDate: window.previousEndDate,
              dimensions: [],
              rowLimit: 1,
            })
          : Promise.resolve(null),
        by('date', 500),
        by('query', 100),
        by('page', 100),
        by('device', 10),
        by('country', 20),
      ])
    return {
      configured: true as const,
      dataThrough: window.endDate,
      totals: metricsOf(totals[0]),
      previousTotals: previous ? metricsOf(previous[0]) : null,
      series: keyed(series, 'date'),
      queries: keyed(queries, 'query'),
      pages: keyed(pages, 'page', pathFromSearchConsolePage),
      devices: keyed(devices, 'device', (value) => value.toLowerCase()),
      countries: keyed(countries, 'country', (value) => value.toUpperCase()),
    }
  })
}

export function getSeoOpportunities(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<SeoOpportunities>> {
  const window = searchDateWindow(filter, now)
  const range = resolveDateRange(filter, now)
  const base = {
    startDate: window.startDate,
    endDate: window.endDate,
    ...requestFilters(filter),
  }

  return runSearchRead(
    actor,
    'analytics.search-console.opportunities',
    async () => {
      const [queryPages, pages, landings] = await Promise.all([
        fetchSearchAnalytics({
          ...base,
          dimensions: ['query', 'page'],
          rowLimit: 1000,
        }),
        fetchSearchAnalytics({ ...base, dimensions: ['page'], rowLimit: 500 }),
        withAnalyticsTimeout((tx) =>
          aggregateSessions(tx, {
            filter: { ...filter, channel: 'Organic Search' },
            start: range.start,
            end: range.end,
            bucket: range.bucket,
            dimensions: ['landingPath'],
            limit: 200,
          })
        ),
      ])
      const rows: QueryPageRow[] = queryPages.map((row) => ({
        query: row.keys[0] ?? '',
        page: pathFromSearchConsolePage(row.keys[1] ?? ''),
        ...metricsOf(row),
      }))
      return {
        configured: true as const,
        dataThrough: window.endDate,
        lowCtr: findLowCtr(rows),
        strikingDistance: findStrikingDistance(rows),
        lowEngagementLandings: findLowEngagementLandings(
          landings.map((row) => {
            const derived = deriveSessionMetrics(row.metrics)
            return {
              path: row.dimensions.landingPath ?? '',
              sessions: derived.sessions,
              engagementRate: derived.engagementRate,
              avgEngagementSeconds: derived.avgEngagementSeconds,
            }
          }),
          pages.map((row) => ({ page: row.keys[0] ?? '', ...metricsOf(row) }))
        ),
      }
    }
  )
}

/** MCP `search_console_report`용 평평한 표. */
export function getSearchConsoleTable(
  actor: Actor,
  dimension: SearchDimension,
  filter: AnalyticsFilter,
  limit: number,
  now: Date = new Date()
): Promise<
  ServiceResult<
    | NotConfigured
    | {
        configured: true
        dataThrough: string
        rows: Array<Record<string, string | number>>
      }
  >
> {
  const window = searchDateWindow(filter, now)
  return runSearchRead(actor, 'analytics.search-console.table', async () => {
    const rows = await fetchSearchAnalytics({
      startDate: window.startDate,
      endDate: window.endDate,
      dimensions: [dimension],
      rowLimit: limit,
      ...requestFilters(filter),
    })
    return {
      configured: true as const,
      dataThrough: window.endDate,
      rows: keyed(
        rows,
        dimension,
        dimension === 'page' ? pathFromSearchConsolePage : undefined
      ),
    }
  })
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/lib/server/services/search-console.test.ts && pnpm test:types`
Expected: PASS. `cacheLife('searchConsole')`가 타입 오류면 `next typegen`을 다시 돌린다(`pnpm test:types`가 먼저 실행한다). 서비스 테스트는 `reports.ts`를 모의하므로 `next/cache`를 부르지 않는다.

- [ ] **Step 5: Commit**

```bash
git add lib/server/analytics/search-console/reports.ts lib/server/services/admin/search-console.ts tests/lib/server/services/search-console.test.ts
git commit -m "feat(analytics): serve Search Console reports and SEO opportunities"
```

---

### Task 5: 검색 탭 화면

**Files:**

- Modify: `lib/admin-i18n/messages/en.ts`, `lib/admin-i18n/messages/ko.ts`
- Replace: `app/(admin)/admin/analytics/search/page.tsx`
- Create: `app/(admin)/admin/analytics/_components/search-view.tsx`
- Test: `tests/components/analytics-search.test.tsx`

**Interfaces:**

- Consumes: `getSearchConsoleOverview`, `getSeoOpportunities`, `SearchConsoleOverview`, `SeoOpportunities`, 계획 B 컴포넌트(`ChartFrame`, `MetricTile`, `MetricTable`, `BarList`, `TimeSeriesChart`, `ReportError`), `formatNumber`/`formatPercent`/`formatBucketLabel`/`formatDuration`, `percentChange`
- Produces: 기본 export `SearchView({ overview, opportunities })`

- [ ] **Step 1: Add the copy**

`en.ts`와 `ko.ts`의 분석 문구 끝에 같은 키를 추가한다.

| 키                              | en                                                                                                                                                 | ko                                                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `analyticsSearchClicks`         | `Clicks`                                                                                                                                           | `클릭수`                                                                                                             |
| `analyticsSearchImpressions`    | `Impressions`                                                                                                                                      | `노출수`                                                                                                             |
| `analyticsSearchCtr`            | `CTR`                                                                                                                                              | `클릭률`                                                                                                             |
| `analyticsSearchPosition`       | `Avg. position`                                                                                                                                    | `평균 순위`                                                                                                          |
| `analyticsSearchQueries`        | `Search queries`                                                                                                                                   | `검색어`                                                                                                             |
| `analyticsSearchQuery`          | `Query`                                                                                                                                            | `검색어`                                                                                                             |
| `analyticsSearchPages`          | `Pages in search results`                                                                                                                          | `검색 결과에 나온 페이지`                                                                                            |
| `analyticsSearchDataThrough`    | `Search Console data through {date}`                                                                                                               | `Search Console 데이터 기준일 {date}`                                                                                |
| `analyticsSearchFilterNote`     | `Only the device and page path filters apply to Search Console data.`                                                                              | `Search Console 데이터에는 기기와 페이지 경로 필터만 적용됩니다.`                                                    |
| `analyticsSearchSetupTitle`     | `Connect Google Search Console`                                                                                                                    | `Google Search Console 연결`                                                                                         |
| `analyticsSearchSetupIntro`     | `Search queries, impressions and rankings come from Search Console. A LEAD with access to the GDGoC Google account connects it once.`              | `검색어·노출·순위는 Search Console에서 가져옵니다. GDGoC 구글 계정에 접근할 수 있는 LEAD가 한 번 연결하면 됩니다.`   |
| `analyticsSearchSetupStep1`     | `In Google Cloud (the project that holds the Google sign-in client), enable the Search Console API.`                                               | `Google Cloud(구글 로그인 클라이언트가 있는 프로젝트)에서 Search Console API를 사용 설정합니다.`                     |
| `analyticsSearchSetupStep2`     | `Create a service account and download its JSON key.`                                                                                              | `서비스 계정을 만들고 JSON 키를 내려받습니다.`                                                                       |
| `analyticsSearchSetupStep3`     | `In Search Console, open the site property, go to Settings → Users and permissions, and add the service account email with Restricted permission.` | `Search Console에서 사이트 속성을 열고 설정 → 사용자 및 권한에서 서비스 계정 이메일을 "제한됨" 권한으로 추가합니다.` |
| `analyticsSearchSetupStep4`     | `Set GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY and GSC_SITE_URL in Dokploy, then redeploy.`                                                                | `Dokploy에 GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY, GSC_SITE_URL을 등록하고 다시 배포합니다.`                              |
| `analyticsSeoOpportunities`     | `Improvement opportunities`                                                                                                                        | `개선 기회`                                                                                                          |
| `analyticsSeoLowCtr`            | `Shown often, clicked rarely`                                                                                                                      | `노출은 많은데 클릭이 적은 검색어`                                                                                   |
| `analyticsSeoLowCtrHint`        | `CTR is under half the typical rate for this position. Rewrite the page title and description so they match the query.`                            | `이 순위의 일반적인 클릭률의 절반에 못 미칩니다. 검색어에 맞게 페이지 제목과 설명을 고쳐 보세요.`                    |
| `analyticsSeoStriking`          | `Almost on page one`                                                                                                                               | `조금만 올리면 첫 페이지`                                                                                            |
| `analyticsSeoStrikingHint`      | `Average position 8 to 20. Cover the query in the page and link to it from related pages.`                                                         | `평균 순위 8~20위입니다. 페이지에 이 검색어 내용을 보강하고 관련 페이지에서 링크를 걸어 보세요.`                     |
| `analyticsSeoLowEngagement`     | `Search visitors leave quickly`                                                                                                                    | `검색으로 와서 금방 떠나는 페이지`                                                                                   |
| `analyticsSeoLowEngagementHint` | `Engagement under 50% for visits from organic search. Check that the page answers what the search result promised.`                                | `자연 검색 방문의 참여율이 50% 미만입니다. 검색 결과가 약속한 내용을 페이지가 바로 보여 주는지 확인하세요.`          |
| `analyticsSeoExpectedCtr`       | `Typical CTR (reference)`                                                                                                                          | `일반 클릭률(참고치)`                                                                                                |
| `analyticsSeoNone`              | `Nothing stands out for this period.`                                                                                                              | `이 기간에는 눈에 띄는 항목이 없습니다.`                                                                             |

`analyticsSearchConsoleSoon` 키는 이 Task가 끝나면 쓰이지 않는다. 두 사전에서 지운다.

- [ ] **Step 2: Write the failing test**

```tsx
// tests/components/analytics-search.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
    <div style={{ width: 600, height: 280 }}>{children}</div>
  ),
}))

import SearchView from '@/app/(admin)/admin/analytics/_components/search-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'

const metrics = { clicks: 12, impressions: 480, ctr: 0.025, position: 6.4 }

function renderView(props: React.ComponentProps<typeof SearchView>) {
  return render(
    <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
      <SearchView {...props} />
    </AdminI18nProvider>
  )
}

describe('SearchView', () => {
  it('shows the setup steps when Search Console is not connected', () => {
    renderView({
      overview: { configured: false },
      opportunities: { configured: false },
    })
    expect(
      screen.getByRole('heading', { name: 'Connect Google Search Console' })
    ).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
  })

  it('shows totals, queries and the three opportunity lists', () => {
    renderView({
      overview: {
        configured: true,
        dataThrough: '2026-10-13',
        totals: metrics,
        previousTotals: { ...metrics, clicks: 6 },
        series: [{ date: '2026-10-13', ...metrics }],
        queries: [{ query: 'gdgoc yonsei', ...metrics }],
        pages: [{ page: '/ko', ...metrics }],
        devices: [{ device: 'mobile', ...metrics }],
        countries: [{ country: 'KOR', ...metrics }],
      },
      opportunities: {
        configured: true,
        dataThrough: '2026-10-13',
        lowCtr: [
          {
            query: 'gdgoc',
            page: '/ko',
            clicks: 1,
            impressions: 500,
            ctr: 0.002,
            position: 1.2,
            expectedCtr: 0.28,
          },
        ],
        strikingDistance: [],
        lowEngagementLandings: [
          {
            path: '/ko/session',
            sessions: 10,
            engagementRate: 0.2,
            avgEngagementSeconds: 5,
            impressions: 80,
            clicks: 2,
          },
        ],
      },
    })
    expect(
      screen.getByText('Search Console data through 2026-10-13')
    ).toBeInTheDocument()
    expect(screen.getByText('+100.0%')).toBeInTheDocument()
    expect(screen.getByText('gdgoc yonsei')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: 'Shown often, clicked rarely' })
    ).toHaveTextContent('28.0%')
    expect(
      screen.getByRole('region', { name: 'Almost on page one' })
    ).toHaveTextContent('Nothing stands out for this period.')
    expect(
      screen.getByRole('region', { name: 'Search visitors leave quickly' })
    ).toHaveTextContent('/ko/session')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test tests/components/analytics-search.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 4: Write the implementation**

```tsx
// app/(admin)/admin/analytics/_components/search-view.tsx
'use client'

/**
 * 검색 탭: Search Console 지표·추이·검색어·페이지·기기·국가와 개선 기회 세 목록.
 * 클릭과 노출은 규모가 달라 한 차트에 두 축으로 그리지 않고 지표를 골라 본다.
 */
import { useState } from 'react'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import MetricTable from '@/app/(admin)/admin/analytics/_components/metric-table'
import MetricTile from '@/app/(admin)/admin/analytics/_components/metric-tile'
import TimeSeriesChart from '@/app/(admin)/admin/analytics/_components/time-series-chart'
import {
  formatBucketLabel,
  formatDuration,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AdminMessageKey } from '@/lib/admin-i18n'
import { percentChange } from '@/lib/analytics/metrics'
import type { SearchMetrics } from '@/lib/analytics/seo'
import { fillTemplate } from '@/lib/format/text'
import type {
  SearchConsoleOverview,
  SeoOpportunities,
} from '@/lib/server/services/admin/search-console'

type MetricKey = keyof SearchMetrics

const TILES: Array<{
  key: MetricKey
  label: AdminMessageKey
  goodWhenUp: boolean
}> = [
  { key: 'clicks', label: 'analyticsSearchClicks', goodWhenUp: true },
  { key: 'impressions', label: 'analyticsSearchImpressions', goodWhenUp: true },
  { key: 'ctr', label: 'analyticsSearchCtr', goodWhenUp: true },
  // 순위는 숫자가 작을수록 좋다.
  { key: 'position', label: 'analyticsSearchPosition', goodWhenUp: false },
]

function SetupGuide() {
  const { t } = useAdminI18n()
  const steps: AdminMessageKey[] = [
    'analyticsSearchSetupStep1',
    'analyticsSearchSetupStep2',
    'analyticsSearchSetupStep3',
    'analyticsSearchSetupStep4',
  ]
  return (
    <section className={'admin-card flex max-w-3xl flex-col gap-3'}>
      <h2 className={'type-title text-ink'}>
        {t('analyticsSearchSetupTitle')}
      </h2>
      <p className={'type-body-sm text-ink-muted'}>
        {t('analyticsSearchSetupIntro')}
      </p>
      <ol
        className={
          'type-body-sm text-ink flex list-decimal flex-col gap-2 pl-5'
        }
      >
        {steps.map((step) => (
          <li key={step}>{t(step)}</li>
        ))}
      </ol>
    </section>
  )
}

function Opportunity({
  title,
  hint,
  children,
  empty,
}: {
  title: string
  hint: string
  children: React.ReactNode
  empty: boolean
}) {
  const { t } = useAdminI18n()
  return (
    <section
      aria-label={title}
      className={'admin-card flex min-w-0 flex-col gap-2'}
    >
      <h3 className={'type-title text-ink'}>{title}</h3>
      <p className={'type-caption text-ink-muted'}>{hint}</p>
      {empty ? (
        <p className={'type-body-sm text-ink-muted'}>{t('analyticsSeoNone')}</p>
      ) : (
        children
      )}
    </section>
  )
}

export default function SearchView({
  overview,
  opportunities,
}: {
  overview: SearchConsoleOverview
  opportunities: SeoOpportunities
}) {
  const { t, locale } = useAdminI18n()
  const [metric, setMetric] = useState<MetricKey>('clicks')

  if (!overview.configured) return <SetupGuide />

  const format = (key: MetricKey, value: number) =>
    key === 'ctr'
      ? formatPercent(value, locale)
      : key === 'position'
        ? value.toFixed(1)
        : formatNumber(value, locale)
  const metricLabel = t(TILES.find((tile) => tile.key === metric)!.label)
  const searchColumns = <T extends SearchMetrics>() => [
    {
      key: 'clicks',
      label: t('analyticsSearchClicks'),
      numeric: true,
      render: (row: T) => formatNumber(row.clicks, locale),
    },
    {
      key: 'impressions',
      label: t('analyticsSearchImpressions'),
      numeric: true,
      render: (row: T) => formatNumber(row.impressions, locale),
    },
    {
      key: 'ctr',
      label: t('analyticsSearchCtr'),
      numeric: true,
      render: (row: T) => formatPercent(row.ctr, locale),
    },
    {
      key: 'position',
      label: t('analyticsSearchPosition'),
      numeric: true,
      render: (row: T) => row.position.toFixed(1),
    },
  ]

  return (
    <div className={'flex flex-col gap-4'}>
      <p className={'type-caption text-ink-muted'}>
        {fillTemplate(t('analyticsSearchDataThrough'), {
          date: overview.dataThrough,
        })}{' '}
        · {t('analyticsSearchFilterNote')}
      </p>
      <div className={'grid grid-cols-2 gap-3 xl:grid-cols-4'}>
        {TILES.map((tile) => (
          <MetricTile
            key={tile.key}
            label={t(tile.label)}
            value={format(tile.key, overview.totals[tile.key])}
            delta={
              overview.previousTotals
                ? percentChange(
                    overview.totals[tile.key],
                    overview.previousTotals[tile.key]
                  )
                : null
            }
            goodWhenUp={tile.goodWhenUp}
            spark={overview.series.map((point) => point[tile.key])}
          />
        ))}
      </div>

      <ChartFrame
        title={t('analyticsTrend')}
        summary={`${metricLabel} ${overview.series.map((point) => format(metric, point[metric])).join(', ')}`}
        table={{
          columns: [t('analyticsDimDate'), metricLabel],
          rows: overview.series.map((point) => [
            formatBucketLabel(point.date, locale),
            format(metric, point[metric]),
          ]),
        }}
        actions={
          <select
            aria-label={t('analyticsMetric')}
            className={'admin-input min-h-11 w-auto'}
            value={metric}
            onChange={(event) => setMetric(event.target.value as MetricKey)}
          >
            {TILES.map((tile) => (
              <option key={tile.key} value={tile.key}>
                {t(tile.label)}
              </option>
            ))}
          </select>
        }
      >
        <TimeSeriesChart
          data={overview.series}
          xKey={'date'}
          series={[{ key: metric, label: metricLabel }]}
          valueFormat={(value) => format(metric, value)}
        />
      </ChartFrame>

      <div className={'grid gap-4 xl:grid-cols-2'}>
        <section className={'admin-card flex min-w-0 flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>
            {t('analyticsSearchQueries')}
          </h2>
          <MetricTable
            caption={t('analyticsSearchQueries')}
            rows={overview.queries}
            rowKey={(row) => row.query}
            columns={[
              {
                key: 'query',
                label: t('analyticsSearchQuery'),
                render: (row) => row.query,
              },
              ...searchColumns<(typeof overview.queries)[number]>(),
            ]}
          />
        </section>
        <section className={'admin-card flex min-w-0 flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsSearchPages')}</h2>
          <MetricTable
            caption={t('analyticsSearchPages')}
            rows={overview.pages}
            rowKey={(row) => row.page}
            columns={[
              {
                key: 'page',
                label: t('analyticsPage'),
                render: (row) => row.page,
              },
              ...searchColumns<(typeof overview.pages)[number]>(),
            ]}
          />
        </section>
      </div>

      <div className={'grid gap-4 md:grid-cols-2'}>
        <section className={'admin-card flex flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsDevices')}</h2>
          <BarList
            valueLabel={t('analyticsSearchClicks')}
            format={(value) => formatNumber(value, locale)}
            items={overview.devices.map((row) => ({
              label: row.device,
              value: row.clicks,
            }))}
          />
        </section>
        <section className={'admin-card flex flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsCountries')}</h2>
          <BarList
            valueLabel={t('analyticsSearchClicks')}
            format={(value) => formatNumber(value, locale)}
            items={overview.countries.map((row) => ({
              label: row.country,
              value: row.clicks,
            }))}
          />
        </section>
      </div>

      {opportunities.configured && (
        <section
          className={'flex flex-col gap-3'}
          aria-labelledby={'seo-opportunities'}
        >
          <h2 id={'seo-opportunities'} className={'type-heading-2 text-ink'}>
            {t('analyticsSeoOpportunities')}
          </h2>
          <div className={'grid gap-4 xl:grid-cols-3'}>
            <Opportunity
              title={t('analyticsSeoLowCtr')}
              hint={t('analyticsSeoLowCtrHint')}
              empty={opportunities.lowCtr.length === 0}
            >
              <MetricTable
                caption={t('analyticsSeoLowCtr')}
                rows={opportunities.lowCtr}
                rowKey={(row) => `${row.query}/${row.page}`}
                columns={[
                  {
                    key: 'query',
                    label: t('analyticsSearchQuery'),
                    render: (row) => `${row.query} · ${row.page}`,
                  },
                  {
                    key: 'impressions',
                    label: t('analyticsSearchImpressions'),
                    numeric: true,
                    render: (row) => formatNumber(row.impressions, locale),
                  },
                  {
                    key: 'ctr',
                    label: t('analyticsSearchCtr'),
                    numeric: true,
                    render: (row) => formatPercent(row.ctr, locale),
                  },
                  {
                    key: 'expected',
                    label: t('analyticsSeoExpectedCtr'),
                    numeric: true,
                    render: (row) => formatPercent(row.expectedCtr, locale),
                  },
                ]}
              />
            </Opportunity>
            <Opportunity
              title={t('analyticsSeoStriking')}
              hint={t('analyticsSeoStrikingHint')}
              empty={opportunities.strikingDistance.length === 0}
            >
              <MetricTable
                caption={t('analyticsSeoStriking')}
                rows={opportunities.strikingDistance}
                rowKey={(row) => `${row.query}/${row.page}`}
                columns={[
                  {
                    key: 'query',
                    label: t('analyticsSearchQuery'),
                    render: (row) => `${row.query} · ${row.page}`,
                  },
                  {
                    key: 'position',
                    label: t('analyticsSearchPosition'),
                    numeric: true,
                    render: (row) => row.position.toFixed(1),
                  },
                  {
                    key: 'impressions',
                    label: t('analyticsSearchImpressions'),
                    numeric: true,
                    render: (row) => formatNumber(row.impressions, locale),
                  },
                ]}
              />
            </Opportunity>
            <Opportunity
              title={t('analyticsSeoLowEngagement')}
              hint={t('analyticsSeoLowEngagementHint')}
              empty={opportunities.lowEngagementLandings.length === 0}
            >
              <MetricTable
                caption={t('analyticsSeoLowEngagement')}
                rows={opportunities.lowEngagementLandings}
                rowKey={(row) => row.path}
                columns={[
                  {
                    key: 'path',
                    label: t('analyticsPage'),
                    render: (row) => row.path,
                  },
                  {
                    key: 'sessions',
                    label: t('analyticsSessions'),
                    numeric: true,
                    render: (row) => formatNumber(row.sessions, locale),
                  },
                  {
                    key: 'rate',
                    label: t('analyticsEngagementRate'),
                    numeric: true,
                    render: (row) => formatPercent(row.engagementRate, locale),
                  },
                  {
                    key: 'time',
                    label: t('analyticsAvgEngagement'),
                    numeric: true,
                    render: (row) => formatDuration(row.avgEngagementSeconds),
                  },
                ]}
              />
            </Opportunity>
          </div>
        </section>
      )}
    </div>
  )
}
```

```tsx
// app/(admin)/admin/analytics/search/page.tsx
/** 검색 탭. Search Console 개요와 개선 기회를 함께 읽는다. 한쪽이 실패해도 다른 쪽은 보인다. */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import SearchView from '@/app/(admin)/admin/analytics/_components/search-view'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import {
  getSearchConsoleOverview,
  getSeoOpportunities,
} from '@/lib/server/services/admin/search-console'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Search' }

export default async function SearchPage({
  searchParams,
}: PageProps<'/admin/analytics/search'>) {
  const [filter, actor] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
  ])
  if (!actor) forbidden()
  const [overview, opportunities] = await Promise.all([
    getSearchConsoleOverview(actor, filter),
    getSeoOpportunities(actor, filter),
  ])
  if (!overview.ok) return <ReportError message={overview.message} />
  return (
    <div className={'flex flex-col gap-4'}>
      {!opportunities.ok && <ReportError message={opportunities.message} />}
      <SearchView
        overview={overview.data}
        opportunities={
          opportunities.ok ? opportunities.data : { configured: false }
        }
      />
    </div>
  )
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test tests/components/analytics-search.test.tsx && pnpm test:types && pnpm lint --max-warnings=0`
Expected: PASS. `analyticsSearchConsoleSoon`을 지웠으므로 남은 참조가 있으면 타입 검사가 알려 준다.

- [ ] **Step 6: Commit**

```bash
git add lib/admin-i18n "app/(admin)/admin/analytics" tests/components/analytics-search.test.tsx
git commit -m "feat(analytics): add the search tab with Search Console data and SEO opportunities"
```

---

### Task 6: MCP 분석 도구 5개

**Files:**

- Create: `lib/mcp/tools/analytics.ts`
- Modify: `lib/mcp/tools/index.ts`
- Test: `tests/lib/mcp/tools-analytics.test.ts`

**Interfaces:**

- Consumes: `defineTool`/`isToolVisible` (`lib/mcp/registry.ts`), `parseAnalyticsFilter`, `RANGE_PRESETS`, `DEVICE_TYPES`, `CHANNELS`, `CONTENT_GROUPS`, `getAnalyticsOverview`, `getAnalyticsTable`, `getAnalyticsPageDetail`, `ANALYTICS_TABLE_REPORTS`, `SESSION_DIMENSIONS`, `SESSION_METRIC_KEYS`, `getSearchConsoleTable`, `getSeoOpportunities`, `ok`/`fail`
- Produces: `analyticsTools: ToolDefinition[]` (이름: `analytics_overview`, `analytics_report`, `analytics_page_detail`, `search_console_report`, `seo_opportunities`)

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/mcp/tools-analytics.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const services = vi.hoisted(() => ({
  getAnalyticsOverview: vi.fn(),
  getAnalyticsTable: vi.fn(),
  getAnalyticsPageDetail: vi.fn(),
  getSearchConsoleTable: vi.fn(),
  getSeoOpportunities: vi.fn(),
}))

vi.mock('@/db', () => ({ db: {} }))
vi.mock('@/lib/server/services/admin/analytics', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/services/admin/analytics')
  >()),
  getAnalyticsOverview: services.getAnalyticsOverview,
  getAnalyticsTable: services.getAnalyticsTable,
  getAnalyticsPageDetail: services.getAnalyticsPageDetail,
}))
vi.mock('@/lib/server/services/admin/search-console', () => ({
  getSearchConsoleTable: services.getSearchConsoleTable,
  getSeoOpportunities: services.getSeoOpportunities,
}))

import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import { isToolVisible, type ToolDefinition } from '@/lib/mcp/registry'
import { ALL_TOOLS } from '@/lib/mcp/tools'
import type { Actor } from '@/lib/server/services/admin/types'

const tool = (name: string) =>
  ALL_TOOLS.find((candidate) => candidate.name === name) as ToolDefinition
const member: Actor = {
  userId: 'm',
  role: 'MEMBER',
  scopes: ['gyms:read'],
  via: 'mcp',
}
const NAMES = [
  'analytics_overview',
  'analytics_report',
  'analytics_page_detail',
  'search_console_report',
  'seo_opportunities',
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('analytics tools', () => {
  it('are visible to any approved member with the read scope and marked read-only', () => {
    for (const name of NAMES) {
      expect(isToolVisible(member, tool(name))).toBe(true)
      expect(isToolVisible({ ...member, role: 'UNVERIFIED' }, tool(name))).toBe(
        false
      )
      expect(tool(name).annotations?.readOnlyHint).toBe(true)
    }
  })

  it('rejects an unknown range or report before calling a service', () => {
    expect(
      tool('analytics_overview').input.safeParse({ range: 'forever' }).success
    ).toBe(false)
    expect(
      tool('analytics_report').input.safeParse({ report: 'revenue' }).success
    ).toBe(false)
    expect(
      tool('analytics_page_detail').input.safeParse({ path: 'ko' }).success
    ).toBe(false)
  })

  it('passes a parsed filter to the overview service', async () => {
    services.getAnalyticsOverview.mockResolvedValue({
      ok: true,
      data: { totals: {} },
    })
    const input = tool('analytics_overview').input.parse({
      range: '7d',
      device: 'mobile',
      compare: false,
    })
    await tool('analytics_overview').run(member, input)
    expect(services.getAnalyticsOverview).toHaveBeenCalledWith(member, {
      ...DEFAULT_ANALYTICS_FILTER,
      range: '7d',
      device: 'mobile',
      compare: false,
    })
  })

  it('runs explore through analytics_report and trims rows to the limit', async () => {
    services.getAnalyticsTable.mockResolvedValue({
      ok: true,
      data: {
        columns: ['channel', 'sessions'],
        rows: [
          { channel: 'Direct', sessions: 3 },
          { channel: 'Referral', sessions: 1 },
        ],
      },
    })
    const input = tool('analytics_report').input.parse({
      report: 'explore',
      dimensions: ['channel'],
      metrics: ['sessions'],
      limit: 1,
    })
    const result = await tool('analytics_report').run(member, input)
    expect(services.getAnalyticsTable).toHaveBeenCalledWith(
      member,
      'explore',
      DEFAULT_ANALYTICS_FILTER,
      {
        dimensions: ['channel'],
        metrics: ['sessions'],
        limit: 1,
      }
    )
    expect(result).toEqual({
      ok: true,
      data: {
        columns: ['channel', 'sessions'],
        rows: [{ channel: 'Direct', sessions: 3 }],
      },
    })
  })

  it('explains how to connect Search Console when it is not configured', async () => {
    services.getSearchConsoleTable.mockResolvedValue({
      ok: true,
      data: { configured: false },
    })
    const result = await tool('search_console_report').run(
      member,
      tool('search_console_report').input.parse({ dimension: 'query' })
    )
    expect(result).toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
      message: expect.stringContaining('GSC_CLIENT_EMAIL'),
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/mcp/tools-analytics.test.ts`
Expected: FAIL — tools not found (`tool(name)` is undefined)

- [ ] **Step 3: Write the implementation**

```ts
// lib/mcp/tools/analytics.ts
/**
 * 방문 분석·Search Console 읽기 도구. 웹 분석 화면과 같은 서비스를 쓰고, 필터는 URL 쿼리와 같은 파서로 검증한다.
 * 모두 읽기 전용이라 감사 로그에 남기지 않는다.
 */
import 'server-only'

import { z } from 'zod'
import { CHANNELS } from '@/lib/analytics/constants'
import { CONTENT_GROUPS } from '@/lib/analytics/content-groups'
import {
  DEVICE_TYPES,
  RANGE_PRESETS,
  parseAnalyticsFilter,
  type AnalyticsFilter,
} from '@/lib/analytics/filters'
import { SESSION_METRIC_KEYS } from '@/lib/analytics/metrics'
import { defineTool } from '@/lib/mcp/registry'
import { SESSION_DIMENSIONS } from '@/lib/server/analytics/queries/sessions'
import {
  ANALYTICS_TABLE_REPORTS,
  getAnalyticsOverview,
  getAnalyticsPageDetail,
  getAnalyticsTable,
} from '@/lib/server/services/admin/analytics'
import {
  getSearchConsoleTable,
  getSeoOpportunities,
} from '@/lib/server/services/admin/search-console'
import { fail, ok } from '@/lib/server/services/admin/types'

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .describe('Seoul date, YYYY-MM-DD.')

const filterFields = {
  range: z
    .enum(RANGE_PRESETS)
    .optional()
    .describe('Date range preset. Default 28d. Use custom with from and to.'),
  from: date
    .optional()
    .describe('Custom range start (inclusive), only with range "custom".'),
  to: date
    .optional()
    .describe('Custom range end (inclusive), only with range "custom".'),
  compare: z
    .boolean()
    .optional()
    .describe('Include the previous period of the same length. Default true.'),
  channel: z
    .enum(CHANNELS)
    .optional()
    .describe('Only sessions from this traffic channel.'),
  device: z.enum(DEVICE_TYPES).optional(),
  country: z
    .string()
    .regex(/^[A-Za-z]{2}$/)
    .optional()
    .describe('ISO 3166 alpha-2 country, estimated from time zone.'),
  locale: z
    .enum(['ko', 'en'])
    .optional()
    .describe('Public site language of the viewed pages.'),
  visitor: z.enum(['new', 'returning']).optional(),
  contentGroup: z.enum(CONTENT_GROUPS).optional(),
  path: z
    .string()
    .max(200)
    .optional()
    .describe(
      'Only pages whose path contains this text (literal, not a pattern).'
    ),
  includeInternal: z
    .boolean()
    .optional()
    .describe('Include visits by signed-in GYMS members. Default false.'),
}

type FilterInput = {
  [K in keyof typeof filterFields]?: z.infer<(typeof filterFields)[K]>
}

// 웹 화면과 같은 파서로 검증해 기본값·날짜 보정이 같게 동작한다.
function toFilter(input: FilterInput): AnalyticsFilter {
  return parseAnalyticsFilter({
    range: input.range,
    from: input.from,
    to: input.to,
    compare: input.compare === false ? '0' : undefined,
    channel: input.channel,
    device: input.device,
    country: input.country,
    locale: input.locale,
    visitor: input.visitor,
    group: input.contentGroup,
    path: input.path,
    internal: input.includeInternal ? '1' : undefined,
  })
}

const NOT_CONFIGURED =
  'Search Console is not connected. A LEAD must set GSC_CLIENT_EMAIL, GSC_PRIVATE_KEY and GSC_SITE_URL (see docs/architecture/analytics.md).'

const gate = [{ action: 'get' as const, resource: 'analyticsPage' as const }]
const readOnly = { readOnlyHint: true, openWorldHint: false }

export const analyticsTools = [
  defineTool({
    name: 'analytics_overview',
    title: 'Analytics overview',
    description:
      'Public site traffic for a date range: users, new users, sessions, engagement rate, bounce rate, views, average engagement time and key events, with the previous period, a time series, top channels, devices and pages. Member visits are excluded unless includeInternal is true.',
    scope: 'gyms:read',
    gate,
    annotations: readOnly,
    input: z.object(filterFields),
    run: (actor, input) => getAnalyticsOverview(actor, toFilter(input)),
  }),
  defineTool({
    name: 'analytics_report',
    title: 'Analytics report',
    description:
      'One analytics table: channels, sources, referrers, campaigns, landing_pages, devices, browsers, os, screens, countries, languages, pages, events, not_found (broken links), web_vitals, or explore (pick up to two dimensions and any metrics).',
    scope: 'gyms:read',
    gate,
    annotations: readOnly,
    input: z.object({
      ...filterFields,
      report: z.enum(ANALYTICS_TABLE_REPORTS),
      dimensions: z
        .array(z.enum(SESSION_DIMENSIONS))
        .max(2)
        .optional()
        .describe('explore only. Up to two breakdowns.'),
      metrics: z
        .array(z.enum(SESSION_METRIC_KEYS))
        .min(1)
        .optional()
        .describe('explore only.'),
      limit: z.number().int().min(1).max(100).default(50),
    }),
    run: async (actor, input) => {
      const result = await getAnalyticsTable(
        actor,
        input.report,
        toFilter(input),
        {
          dimensions: input.dimensions ?? ['channel'],
          metrics: input.metrics ?? [
            'users',
            'sessions',
            'engagementRate',
            'avgEngagementSeconds',
          ],
          limit: input.limit,
        }
      )
      return result.ok
        ? ok({ ...result.data, rows: result.data.rows.slice(0, input.limit) })
        : result
    },
  }),
  defineTool({
    name: 'analytics_page_detail',
    title: 'Analytics page detail',
    description:
      'Detail for one public page path (e.g. /ko/session/25-26): views, users, time on page, exit rate, daily views, scroll depth, the pages before and after it, and traffic channels.',
    scope: 'gyms:read',
    gate,
    annotations: readOnly,
    input: z.object({
      ...filterFields,
      path: z
        .string()
        .startsWith('/')
        .max(512)
        .describe('Page path starting with /.'),
    }),
    run: (actor, input) =>
      getAnalyticsPageDetail(
        actor,
        toFilter({ ...input, path: undefined }),
        input.path
      ),
  }),
  defineTool({
    name: 'search_console_report',
    title: 'Search Console report',
    description:
      'Google search performance from Search Console by query, page, device, country or date: clicks, impressions, CTR and average position. Only the device and path filters apply. Data lags two to three days.',
    scope: 'gyms:read',
    gate,
    annotations: readOnly,
    input: z.object({
      range: filterFields.range,
      from: filterFields.from,
      to: filterFields.to,
      device: filterFields.device,
      path: filterFields.path,
      dimension: z.enum(['query', 'page', 'device', 'country', 'date']),
      limit: z.number().int().min(1).max(500).default(50),
    }),
    run: async (actor, input) => {
      const result = await getSearchConsoleTable(
        actor,
        input.dimension,
        toFilter(input),
        input.limit
      )
      if (!result.ok) return result
      return result.data.configured
        ? ok(result.data)
        : fail('NOT_FOUND', NOT_CONFIGURED)
    },
  }),
  defineTool({
    name: 'seo_opportunities',
    title: 'SEO opportunities',
    description:
      'Three lists to act on: queries shown often but clicked rarely (fix titles and descriptions), queries ranked 8 to 20 (strengthen content), and pages organic visitors leave quickly (match the search intent).',
    scope: 'gyms:read',
    gate,
    annotations: readOnly,
    input: z.object({
      range: filterFields.range,
      from: filterFields.from,
      to: filterFields.to,
      device: filterFields.device,
      path: filterFields.path,
    }),
    run: async (actor, input) => {
      const result = await getSeoOpportunities(actor, toFilter(input))
      if (!result.ok) return result
      return result.data.configured
        ? ok(result.data)
        : fail('NOT_FOUND', NOT_CONFIGURED)
    },
  }),
]
```

`lib/mcp/tools/index.ts`: import를 추가하고 목록 끝에 펼친다.

```ts
import { analyticsTools } from '@/lib/mcp/tools/analytics'
```

```ts
  ...imageTools,
  ...analyticsTools,
]
```

`ToolAnnotations`에 `openWorldHint`가 없으면 `readOnly`에서 그 키를 뺀다.

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/lib/mcp && pnpm test:types`
Expected: PASS (기존 MCP 테스트 포함). 도구 목록 개수를 고정한 기존 테스트가 있으면 5개 늘어난 값으로 고친다.

- [ ] **Step 5: Commit**

```bash
git add lib/mcp/tools tests/lib/mcp/tools-analytics.test.ts
git commit -m "feat(mcp): expose analytics and Search Console as read-only tools"
```

---

### Task 7: 문서와 최종 확인

**Files:**

- Modify: `docs/architecture/analytics.md`
- Modify: `docs/architecture/mcp.md`
- Modify: `docs/architecture/caching.md`
- Modify: `docs/handoff.md`
- Create: `tests/e2e/admin-analytics-search.spec.ts`

- [ ] **Step 1: Write the e2e for the not-configured state**

```ts
// tests/e2e/admin-analytics-search.spec.ts
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
```

Run: `AUTH_DRIZZLE_URL=postgres://gdgoc:gdgoc@127.0.0.1:5432/gdgoc_dev pnpm test:e2e:prod tests/e2e/admin-analytics-search.spec.ts`
Expected: PASS (로컬 `.env`에 `GSC_*`가 없어야 한다)

- [ ] **Step 2: Update the documents**

`docs/architecture/analytics.md` 끝에 추가:

```markdown
## Search Console

검색 탭과 MCP `search_console_report`·`seo_opportunities`는 Search Console API를 쓴다(`lib/server/analytics/search-console/*`).

### 연결 (LEAD, 한 번)

1. Google Cloud(구글 로그인 클라이언트가 있는 프로젝트)에서 **Search Console API**를 사용 설정한다.
2. 서비스 계정을 만들고 JSON 키를 내려받는다.
3. Search Console → 사이트 속성 → 설정 → **사용자 및 권한**에서 서비스 계정 이메일을 **제한됨** 권한으로 추가한다.
4. Dokploy 환경 변수: `GSC_CLIENT_EMAIL`(키의 `client_email`), `GSC_PRIVATE_KEY`(키의 `private_key`, 한 줄로 넣어도 `\n`이 줄바꿈으로 바뀐다),
   `GSC_SITE_URL`(URL 접두어 속성이면 `https://gdgoc.yonsei.ac.kr/`, 도메인 속성이면 `sc-domain:gdgoc.yonsei.ac.kr`). 다시 배포한다.

### 동작

- 서비스 계정 JWT(RS256)를 `node:crypto`로 서명해 읽기 전용 토큰을 받는다. 토큰은 메모리에 1시간 보관한다.
- 응답은 `'use cache: remote'`로 6시간 캐시한다(`cacheLife('searchConsole')`, 태그 `search-console`). 오류는 캐시되지 않는다.
- 종료일은 서울 기준 어제로 자르고 `dataState: 'all'`로 받는다. 화면에 기준일을 표시한다.
- 우리 필터 중 기기·페이지 경로만 Search Console 요청에 반영된다.
- 개선 기회 기준은 `lib/analytics/seo.ts`에 있다(노출 50 이상·일반 클릭률의 절반 미만 / 8~20위·노출 20 이상 / 자연 검색 세션 5 이상·참여율 50% 미만).

### 오류

| 증상                           | 원인                                                     |
| ------------------------------ | -------------------------------------------------------- |
| "Search Console denied access" | 서비스 계정 이메일이 속성 사용자에 없다(3단계)           |
| "rejected the request"         | `GSC_SITE_URL` 형식이 속성 종류와 다르거나 키가 잘못됐다 |
| "quota is used up"             | API 할당량 초과. 캐시가 차면 줄어든다                    |
```

`docs/architecture/mcp.md` 도구 표의 `이미지` 행 다음에 추가:

```markdown
| 분석 | `analytics_overview`, `analytics_report`, `analytics_page_detail`, `search_console_report`, `seo_opportunities` (모두 읽기 전용, 승인된 모든 역할) |
```

그 표 아래 목록 끝에 한 줄 추가:

```markdown
- 분석 도구의 필터 인자는 웹 분석 화면의 URL 쿼리와 같은 파서로 검증한다. Search Console이 연결되지 않았으면 검색 도구는 `NOT_FOUND`와 연결 방법을 돌려준다.
```

`docs/architecture/caching.md`의 캐시 수명 표(또는 프로필 목록)에 `searchConsole` 행을 추가한다: stale 1시간, revalidate 6시간, expire 1일, 태그 `search-console`, 관리자 전용(공개 캐시 무효화 대상 아님).

`docs/handoff.md` 외부 서비스 표에 행을 추가한다:

```markdown
| Search Console | 검색어·노출·순위(GYMS 분석 검색 탭) | gdgoc yonsei 구글 계정. 서비스 계정 연결 방법은 [`architecture/analytics.md`](./architecture/analytics.md) |
```

- [ ] **Step 3: Verify in a real browser**

로컬 운영 빌드에서 `agent-browser` 스킬로 `/ko/admin/analytics/search`를 라이트·다크, 1440px·390px에서 열어 설정 안내가 읽기 좋게 보이는지 확인한다.
Search Console 자격 증명이 있으면(사용자가 제공한 경우에만) `.env.local`에 넣고 실제 데이터 화면도 확인한다. 자격 증명을 저장소에 커밋하지 않는다.

- [ ] **Step 4: Final checks**

Run: `pnpm test:types && pnpm lint --max-warnings=0 && pnpm test`
Expected: 모두 통과

Run: `AUTH_DRIZZLE_URL=postgres://gdgoc:gdgoc@127.0.0.1:5432/gdgoc_dev pnpm test:e2e:prod`
Expected: 알려진 간헐 실패(`home-motion.spec.ts`의 "UI/UX curve") 외 통과

- [ ] **Step 5: Commit**

```bash
git add docs tests/e2e/admin-analytics-search.spec.ts
git commit -m "docs(analytics): document Search Console setup and the analytics MCP tools"
```
