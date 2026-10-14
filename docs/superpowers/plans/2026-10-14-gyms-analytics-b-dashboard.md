# GYMS 웹 분석 — 계획 B: 대시보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 계획 A가 쌓은 `analytics_*` 데이터를 GYMS `/admin/analytics`의 6개 탭(개요·유입·참여·사용자·성능·탐색)에서 날짜 범위와 필터로 조회하고, 표를 CSV로 내보낸다.

**Architecture:** 순수 모듈(`lib/analytics/{filters,date-range,content-groups,metrics,csv}.ts`)이 필터·기간·지표 정의를 맡고, `lib/server/analytics/queries/*`가 SQL 집계를 한다. 세션 단위 지표는 하나의 범용 집계 함수(`aggregateSessions`)가 차원만 바꿔 개요·유입·사용자·탐색을 모두 만든다. `lib/server/services/admin/analytics.ts`가 권한 확인과 오류 변환을 하고, 서버 컴포넌트 페이지가 결과를 Recharts·HTML 차트 컴포넌트에 넘긴다.

**Tech Stack:** Next.js 16 App Router(`cacheComponents`), React 19(React Compiler), Drizzle `sql` 템플릿 + PostgreSQL, Recharts 3, Tailwind 4(관리자 토큰), Vitest + PGlite, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-14-gyms-analytics-design.md` (7·8·9·14·15장과 16장의 대시보드 부분)

**선행 조건:** 계획 A가 머지되어 있어야 한다(`db/schema/analytics.ts`, `tests/helpers/analytics-test-db.ts`, `lib/analytics/constants.ts`의 `CHANNELS`, `analytics_events_sessionId_idx`).

## Global Constraints

- 지표 정의(명세 7장): 참여 세션 = 참여 시간 합 **≥ 10초** 또는 조회 **≥ 2회** 또는 `cta` 이벤트 있음. 이탈률 = 1 − 참여율. Web Vitals 등급 LCP **2.5/4s**, INP **200/500ms**, CLS **0.1/0.25**, FCP **1.8/3s**, TTFB **0.8/1.8s**, 값은 **p75**.
- 기간 프리셋: 오늘·어제·7일·28일(기본)·90일·12개월·직접 지정. 직접 지정은 **최대 26개월** 전까지. 일·시간 구간은 **서울(UTC+9)** 기준.
- 저장된 `timestamp`는 시간대 없는 실제 UTC 시각이다. SQL에서 서울 구간은 `col + interval '9 hours'`로 만든다. 날짜 파라미터는 `${date.toISOString()}::timestamp`로 넘긴다.
- 분석 쿼리는 `SET LOCAL statement_timeout = '10s'` 트랜잭션 안에서 실행한다. 관리자 조회 관례대로 요청 간 캐시를 하지 않는다.
- 내부 트래픽(`isInternal`)은 **기본 제외**, 필터로 포함할 수 있다.
- 조회 권한: `analyticsPage`를 `BASE_PAGES`에 넣어 **MEMBER·CORE·LEAD·ALUMNUS** 허용, UNVERIFIED 거부. 쓰기 권한은 없다.
- 차트 색(dataviz 스킬로 검증, 관리자 카드 면 `#ffffff`/`#212124` 기준 통과): 범주 슬롯 라이트 `#2a78d6 #eb6834 #1baf7a #eda100 #e87ba4 #008300 #6250d6 #e34948`, 다크 `#3987e5 #d95926 #199e70 #c98500 #d55181 #008300 #9085e9 #e66767`. 슬롯은 **고정 순서**로 배정하고 순환하지 않는다. 9번째부터는 "기타"로 접는다. 라이트 슬롯 3·4·5는 대비 3:1 미만이라 **모든 차트에 표 보기**를 둔다.
- 상태 색(Web Vitals 등급 전용): good `#0ca30c`, needs-improvement `#fab219`, poor `#d03b3b`. 항상 아이콘+라벨과 함께 쓴다.
- 마크 규격: 선 2px, 막대 두께 ≤ 24px·끝 4px 둥글게, 격자는 1px 실선(점선 금지), 이중 y축 금지, 값·라벨 글자는 시리즈 색이 아니라 잉크 토큰. 2개 이상 시리즈는 범례 필수.
- 비교 기간 선은 점선 대신 **회색 실선**으로 그린다(dataviz: 점선은 예측선처럼 읽힌다). 명세 9장의 "점선"을 이렇게 대체한다.
- 페이지 표의 제목은 마지막으로 수집된 문서 제목에서 ` | GDGoC Yonsei`를 뗀 값을 쓴다(명세 7장의 "DB 제목 결합"을 단순화. 문서 제목이 곧 세션·프로젝트 제목이다).
- `prefers-reduced-motion`이면 차트 애니메이션을 끈다. 터치 영역 **44px** 이상(`app/(admin)/DESIGN.md`).
- 관리자 문구는 `lib/admin-i18n/messages/{en,ko}.ts` 두 파일에 같은 키로 넣는다(타입이 강제).
- 주석·export 규칙, React Compiler, 커밋 트레일러, 로컬 DB 접두(`AUTH_DRIZZLE_URL=postgres://gdgoc:gdgoc@127.0.0.1:5432/gdgoc_dev`)는 계획 A의 Global Constraints와 같다.
- 각 Task 끝에 `pnpm test:types && pnpm lint --max-warnings=0 && pnpm test` 통과.

## Review Focus

1. **데이터가 하나도 없는 기간·필터** → 모든 탭이 0과 "아직 데이터가 없습니다" 상태를 보여야 하고 0으로 나누기(NaN, Infinity)가 화면에 나오면 안 된다. Task 3(`deriveSessionMetrics`)과 Task 4(빈 DB 집계)에 테스트.
2. **잘못된 URL 쿼리(`range=abc`, `from=2020-13-40`, `device=phone`)** → 기본값으로 되돌리고 오류 화면을 띄우지 않는다. Task 2에 테스트.
3. **긴 기간(12개월)이 시간 초과** → 해당 화면만 "기간을 줄여 보세요" 오류 카드, 다른 탭은 정상. Task 7에 테스트(`57014` 오류 변환).
4. **경로 포함 필터에 `%`·`_` 입력** → 와일드카드가 아니라 글자 그대로 찾는다. Task 4에 테스트.
5. **CSV 값에 쉼표·따옴표·줄바꿈·`=`로 시작하는 문자열** → 열이 깨지지 않고 엑셀 수식으로 실행되지 않는다. Task 7에 테스트.

---

## File Structure

| 파일                                                                                                                                              | 책임                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `lib/analytics/content-groups.ts`                                                                                                                 | 경로 → 콘텐츠 그룹 규칙(TS·SQL 공용 정규식 표)                    |
| `lib/analytics/filters.ts`                                                                                                                        | 필터 타입, URL 쿼리 파싱·직렬화                                   |
| `lib/analytics/date-range.ts`                                                                                                                     | 서울 기준 기간·직전 기간·구간 키 계산                             |
| `lib/analytics/metrics.ts`                                                                                                                        | 지표 정의·임계값, 파생 지표, 증감률                               |
| `lib/analytics/csv.ts`                                                                                                                            | CSV 직렬화(수식 주입 방지)                                        |
| `lib/server/analytics/queries/sql.ts`                                                                                                             | 행 정규화, 시간 제한 트랜잭션, 필터→WHERE, 구간·그룹 SQL          |
| `lib/server/analytics/queries/sessions.ts`                                                                                                        | 세션 차원·지표 범용 집계 `aggregateSessions`                      |
| `lib/server/analytics/queries/pages.ts`                                                                                                           | 페이지 표, 페이지 상세, 이벤트, 404                               |
| `lib/server/analytics/queries/vitals.ts`                                                                                                          | Web Vitals p75·등급 분포·추이·나쁜 페이지                         |
| `lib/server/analytics/queries/cohorts.ts`                                                                                                         | 주간 리텐션 코호트                                                |
| `lib/server/analytics/queries/realtime.ts`                                                                                                        | 최근 5분 활성 방문자, 30분 분당 조회                              |
| `lib/server/services/admin/analytics.ts`                                                                                                          | 권한·시간 초과 처리, 화면별 묶음, 표 보고서                       |
| `app/api/admin/analytics/export/route.ts`                                                                                                         | CSV 내보내기                                                      |
| `app/api/admin/analytics/realtime/route.ts`                                                                                                       | 실시간 카드 폴링                                                  |
| `app/(admin)/admin/analytics/layout.tsx`                                                                                                          | 권한 경계, 헤더, 필터 바, 탭                                      |
| `app/(admin)/admin/analytics/{page,acquisition/page,engagement/page,engagement/page-detail/page,audience/page,performance/page,explore/page}.tsx` | 탭 화면                                                           |
| `app/(admin)/admin/analytics/_components/*`                                                                                                       | 필터 바, 탭, 차트 프레임, 시계열, 막대 목록, 히트맵, 지표 타일 등 |
| `app/(admin)/admin/analytics/_lib/format.ts`                                                                                                      | 숫자·시간·비율 표시 형식(순수)                                    |
| `scripts/seed/analytics.ts`                                                                                                                       | 개발용 가상 분석 데이터 생성기                                    |

수정: `lib/server/permission/policy.ts`, `app/(admin)/admin/navigation-list.ts`, `app/components/admin/nav-item.tsx`, `lib/admin-i18n/messages/{en,ko}.ts`, `app/admin.css`, `scripts/seed-dev.ts`, `package.json`(recharts).

---

### Task 1: 권한 키, 메뉴, 관리자 문구

**Files:**

- Modify: `lib/server/permission/policy.ts`
- Modify: `app/(admin)/admin/navigation-list.ts`
- Modify: `app/components/admin/nav-item.tsx`
- Modify: `lib/admin-i18n/messages/en.ts`, `lib/admin-i18n/messages/ko.ts`
- Test: `tests/lib/server/permission/policy.test.ts` (기존 파일에 추가)

**Interfaces:**

- Produces: `ResourceType`에 `'analyticsPage'`, `NavigationKey`에 `'analytics'`, 관리자 문구 키(아래 표 전부)

- [ ] **Step 1: Write the failing test** — 기존 `tests/lib/server/permission/policy.test.ts` 맨 아래에 추가

```ts
describe('analyticsPage', () => {
  it.each(['MEMBER', 'CORE', 'LEAD', 'ALUMNUS'] as const)(
    'lets %s open the analytics pages',
    (role) => {
      expect(isAllowed(role, 'get', 'analyticsPage')).toBe(true)
    }
  )

  it('keeps unverified accounts out and grants no write access', () => {
    expect(isAllowed('UNVERIFIED', 'get', 'analyticsPage')).toBe(false)
    expect(isAllowed('LEAD', 'post', 'analyticsPage')).toBe(false)
  })
})
```

파일 상단에 `isAllowed` import가 없으면 `import { isAllowed } from '@/lib/server/permission/policy'`를 추가한다.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/server/permission/policy.test.ts`
Expected: FAIL — 타입 오류 또는 `expected false to be true`

- [ ] **Step 3: Implement**

`lib/server/permission/policy.ts`: `ResourceType` 유니온 끝에 `| 'analyticsPage'`를 추가하고 `BASE_PAGES`를 바꾼다.

```ts
const BASE_PAGES = {
  adminPage: true,
  profilePage: true,
  projectsPage: true,
  sessionsPage: true,
  analyticsPage: true,
} as const
```

`app/(admin)/admin/navigation-list.ts`: `NavigationKey`에 `| 'analytics'`를 추가하고, `projects` 항목 바로 뒤에 넣는다(모바일 하단 탭은 앞에서부터 잘리므로 홈·멤버·세션·프로젝트 다음 자리).

```ts
    {
      key: 'analytics',
      name: t.analytics,
      path: localizeAdminHref('/admin/analytics', locale),
      dataResource: 'analyticsPage',
    },
```

`app/components/admin/nav-item.tsx`: heroicons import에 `ChartBarIcon`을 추가하고 `NAV_ICONS`에 `analytics: ChartBarIcon,`을 `projects` 다음 줄에 넣는다.

`lib/admin-i18n/messages/en.ts`의 `backToDashboard` 다음에 아래 키를 모두 추가하고, `ko.ts`에도 같은 키를 한국어 값으로 추가한다.

| 키                                | en                                                                                               | ko                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `analytics`                       | `Analytics`                                                                                      | `분석`                                                                                        |
| `analyticsDescription`            | `How visitors find and use the public site. Member visits are excluded unless you include them.` | `방문자가 공개 사이트를 어떻게 찾고 이용하는지 봅니다. 멤버 방문은 포함하지 않으면 빠집니다.` |
| `analyticsTabOverview`            | `Overview`                                                                                       | `개요`                                                                                        |
| `analyticsTabAcquisition`         | `Acquisition`                                                                                    | `유입`                                                                                        |
| `analyticsTabEngagement`          | `Engagement`                                                                                     | `참여`                                                                                        |
| `analyticsTabAudience`            | `Audience`                                                                                       | `사용자`                                                                                      |
| `analyticsTabPerformance`         | `Performance`                                                                                    | `성능`                                                                                        |
| `analyticsTabSearch`              | `Search`                                                                                         | `검색`                                                                                        |
| `analyticsTabExplore`             | `Explore`                                                                                        | `탐색`                                                                                        |
| `analyticsTabsLabel`              | `Analytics reports`                                                                              | `분석 보고서`                                                                                 |
| `analyticsFiltersLabel`           | `Report filters`                                                                                 | `보고서 필터`                                                                                 |
| `analyticsRange`                  | `Date range`                                                                                     | `기간`                                                                                        |
| `analyticsRangeToday`             | `Today`                                                                                          | `오늘`                                                                                        |
| `analyticsRangeYesterday`         | `Yesterday`                                                                                      | `어제`                                                                                        |
| `analyticsRange7d`                | `Last 7 days`                                                                                    | `최근 7일`                                                                                    |
| `analyticsRange28d`               | `Last 28 days`                                                                                   | `최근 28일`                                                                                   |
| `analyticsRange90d`               | `Last 90 days`                                                                                   | `최근 90일`                                                                                   |
| `analyticsRange12m`               | `Last 12 months`                                                                                 | `최근 12개월`                                                                                 |
| `analyticsRangeCustom`            | `Custom range`                                                                                   | `직접 지정`                                                                                   |
| `analyticsFrom`                   | `From`                                                                                           | `시작일`                                                                                      |
| `analyticsTo`                     | `To`                                                                                             | `종료일`                                                                                      |
| `analyticsCompare`                | `Compare with previous period`                                                                   | `직전 기간과 비교`                                                                            |
| `analyticsIncludeInternal`        | `Include member visits`                                                                          | `멤버 방문 포함`                                                                              |
| `analyticsAll`                    | `All`                                                                                            | `전체`                                                                                        |
| `analyticsChannel`                | `Channel`                                                                                        | `채널`                                                                                        |
| `analyticsDevice`                 | `Device`                                                                                         | `기기`                                                                                        |
| `analyticsVisitorType`            | `Visitor type`                                                                                   | `방문자 유형`                                                                                 |
| `analyticsLocale`                 | `Site language`                                                                                  | `사이트 언어`                                                                                 |
| `analyticsContentGroup`           | `Content group`                                                                                  | `콘텐츠 그룹`                                                                                 |
| `analyticsCountry`                | `Country (estimated)`                                                                            | `국가(추정)`                                                                                  |
| `analyticsPathContains`           | `Page path contains`                                                                             | `페이지 경로 포함`                                                                            |
| `analyticsResetFilters`           | `Reset filters`                                                                                  | `필터 초기화`                                                                                 |
| `analyticsUpdating`               | `Updating…`                                                                                      | `갱신 중…`                                                                                    |
| `analyticsUsers`                  | `Users`                                                                                          | `사용자`                                                                                      |
| `analyticsNewUsers`               | `New users`                                                                                      | `신규 사용자`                                                                                 |
| `analyticsSessions`               | `Sessions`                                                                                       | `세션`                                                                                        |
| `analyticsEngagedSessions`        | `Engaged sessions`                                                                               | `참여 세션`                                                                                   |
| `analyticsEngagementRate`         | `Engagement rate`                                                                                | `참여율`                                                                                      |
| `analyticsBounceRate`             | `Bounce rate`                                                                                    | `이탈률`                                                                                      |
| `analyticsViews`                  | `Views`                                                                                          | `조회수`                                                                                      |
| `analyticsViewsPerSession`        | `Views per session`                                                                              | `세션당 조회수`                                                                               |
| `analyticsAvgEngagement`          | `Avg. engagement time`                                                                           | `평균 참여 시간`                                                                              |
| `analyticsKeyEvents`              | `Key events`                                                                                     | `핵심 이벤트`                                                                                 |
| `analyticsVsPrevious`             | `vs previous period`                                                                             | `직전 기간 대비`                                                                              |
| `analyticsPreviousPeriod`         | `Previous period`                                                                                | `직전 기간`                                                                                   |
| `analyticsNoData`                 | `No data yet`                                                                                    | `아직 데이터가 없습니다`                                                                      |
| `analyticsNoDataHint`             | `Visits appear here a few seconds after someone opens the public site.`                          | `누군가 공개 사이트를 열면 몇 초 뒤 여기에 나타납니다.`                                       |
| `analyticsCollectingSince`        | `Collecting since {date}`                                                                        | `{date}부터 수집 중`                                                                          |
| `analyticsTimeout`                | `This report took too long. Try a shorter date range.`                                           | `보고서를 만드는 데 너무 오래 걸렸습니다. 기간을 줄여 보세요.`                                |
| `analyticsShowTable`              | `Show as table`                                                                                  | `표로 보기`                                                                                   |
| `analyticsShowChart`              | `Show as chart`                                                                                  | `차트로 보기`                                                                                 |
| `analyticsDownloadCsv`            | `Download CSV`                                                                                   | `CSV 내려받기`                                                                                |
| `analyticsRealtime`               | `Right now`                                                                                      | `실시간`                                                                                      |
| `analyticsActiveVisitors`         | `Visitors in the last 5 minutes`                                                                 | `최근 5분 방문자`                                                                             |
| `analyticsViewsPerMinute`         | `Views per minute, last 30 minutes`                                                              | `최근 30분 분당 조회수`                                                                       |
| `analyticsActivePages`            | `Pages being viewed`                                                                             | `지금 보는 페이지`                                                                            |
| `analyticsTrend`                  | `Trend`                                                                                          | `추이`                                                                                        |
| `analyticsTopChannels`            | `Top channels`                                                                                   | `상위 채널`                                                                                   |
| `analyticsTopPages`               | `Top pages`                                                                                      | `상위 페이지`                                                                                 |
| `analyticsDevices`                | `Devices`                                                                                        | `기기`                                                                                        |
| `analyticsChannelsOverTime`       | `Sessions by channel`                                                                            | `채널별 세션`                                                                                 |
| `analyticsSourceMedium`           | `Source / medium`                                                                                | `소스 / 매체`                                                                                 |
| `analyticsReferrers`              | `Referring sites`                                                                                | `참조 사이트`                                                                                 |
| `analyticsCampaigns`              | `Campaigns`                                                                                      | `캠페인`                                                                                      |
| `analyticsLandingPages`           | `Landing pages`                                                                                  | `방문 시작 페이지`                                                                            |
| `analyticsSearchAndAi`            | `Search engines and AI assistants`                                                               | `검색 엔진과 AI 어시스턴트`                                                                   |
| `analyticsPages`                  | `Pages`                                                                                          | `페이지`                                                                                      |
| `analyticsPage`                   | `Page`                                                                                           | `페이지`                                                                                      |
| `analyticsScroll75`               | `Reached 75%`                                                                                    | `75% 도달`                                                                                    |
| `analyticsEntrances`              | `Entrances`                                                                                      | `방문 시작`                                                                                   |
| `analyticsExitRate`               | `Exit rate`                                                                                      | `종료율`                                                                                      |
| `analyticsAvgTimeOnPage`          | `Avg. time on page`                                                                              | `평균 체류 시간`                                                                              |
| `analyticsEvents`                 | `Events`                                                                                         | `이벤트`                                                                                      |
| `analyticsEventName`              | `Event`                                                                                          | `이벤트`                                                                                      |
| `analyticsEventLabel`             | `Label or target`                                                                                | `라벨 또는 대상`                                                                              |
| `analyticsCount`                  | `Count`                                                                                          | `횟수`                                                                                        |
| `analyticsNotFound`               | `Broken links (404)`                                                                             | `깨진 링크(404)`                                                                              |
| `analyticsReferrer`               | `Came from`                                                                                      | `유입 경로`                                                                                   |
| `analyticsPageDetail`             | `Page detail`                                                                                    | `페이지 상세`                                                                                 |
| `analyticsScrollDepth`            | `Scroll depth`                                                                                   | `스크롤 깊이`                                                                                 |
| `analyticsPreviousPages`          | `Previous pages`                                                                                 | `이전 페이지`                                                                                 |
| `analyticsNextPages`              | `Next pages`                                                                                     | `다음 페이지`                                                                                 |
| `analyticsEntranceSource`         | `Session start`                                                                                  | `방문 시작`                                                                                   |
| `analyticsExitTarget`             | `Left the site`                                                                                  | `사이트 떠남`                                                                                 |
| `analyticsNewVsReturning`         | `New vs returning users`                                                                         | `신규 vs 재방문 사용자`                                                                       |
| `analyticsReturningUsers`         | `Returning users`                                                                                | `재방문 사용자`                                                                               |
| `analyticsRetention`              | `Weekly retention`                                                                               | `주간 리텐션`                                                                                 |
| `analyticsCohort`                 | `First visit week`                                                                               | `첫 방문 주`                                                                                  |
| `analyticsWeekN`                  | `Week {n}`                                                                                       | `{n}주 차`                                                                                    |
| `analyticsBrowsers`               | `Browsers`                                                                                       | `브라우저`                                                                                    |
| `analyticsOperatingSystems`       | `Operating systems`                                                                              | `운영체제`                                                                                    |
| `analyticsScreens`                | `Screen sizes`                                                                                   | `화면 크기`                                                                                   |
| `analyticsLanguages`              | `Browser languages`                                                                              | `브라우저 언어`                                                                               |
| `analyticsCountries`              | `Countries (estimated from time zone)`                                                           | `국가(시간대로 추정)`                                                                         |
| `analyticsTrafficByHour`          | `Sessions by weekday and hour (Seoul)`                                                           | `요일·시간별 세션(서울)`                                                                      |
| `analyticsWeekdays`               | `Mon,Tue,Wed,Thu,Fri,Sat,Sun`                                                                    | `월,화,수,목,금,토,일`                                                                        |
| `analyticsWebVitals`              | `Core Web Vitals (75th percentile)`                                                              | `코어 웹 바이탈(75번째 백분위)`                                                               |
| `analyticsRatingGood`             | `Good`                                                                                           | `좋음`                                                                                        |
| `analyticsRatingNeedsImprovement` | `Needs improvement`                                                                              | `개선 필요`                                                                                   |
| `analyticsRatingPoor`             | `Poor`                                                                                           | `나쁨`                                                                                        |
| `analyticsSamples`                | `Samples`                                                                                        | `표본`                                                                                        |
| `analyticsSlowestPages`           | `Slowest pages`                                                                                  | `느린 페이지`                                                                                 |
| `analyticsByDevice`               | `By device`                                                                                      | `기기별`                                                                                      |
| `analyticsMetric`                 | `Metric`                                                                                         | `지표`                                                                                        |
| `analyticsExploreDimensions`      | `Break down by`                                                                                  | `나눠 볼 기준`                                                                                |
| `analyticsExploreMetrics`         | `Metrics`                                                                                        | `지표`                                                                                        |
| `analyticsExploreSecondDimension` | `Second breakdown (optional)`                                                                    | `두 번째 기준(선택)`                                                                          |
| `analyticsExploreApply`           | `Apply`                                                                                          | `적용`                                                                                        |
| `analyticsNone`                   | `None`                                                                                           | `없음`                                                                                        |
| `analyticsDimDate`                | `Date`                                                                                           | `날짜`                                                                                        |
| `analyticsDimSource`              | `Source`                                                                                         | `소스`                                                                                        |
| `analyticsDimMedium`              | `Medium`                                                                                         | `매체`                                                                                        |
| `analyticsDimCampaign`            | `Campaign`                                                                                       | `캠페인`                                                                                      |
| `analyticsDimLandingPath`         | `Landing page`                                                                                   | `방문 시작 페이지`                                                                            |
| `analyticsDimLandingGroup`        | `Landing content group`                                                                          | `방문 시작 콘텐츠 그룹`                                                                       |
| `analyticsDimBrowser`             | `Browser`                                                                                        | `브라우저`                                                                                    |
| `analyticsDimOs`                  | `Operating system`                                                                               | `운영체제`                                                                                    |
| `analyticsDimLanguage`            | `Language`                                                                                       | `언어`                                                                                        |
| `analyticsDimScreen`              | `Screen size`                                                                                    | `화면 크기`                                                                                   |
| `analyticsDimReferrer`            | `Referring site`                                                                                 | `참조 사이트`                                                                                 |
| `analyticsDimWeekday`             | `Weekday`                                                                                        | `요일`                                                                                        |
| `analyticsDimHour`                | `Hour (Seoul)`                                                                                   | `시간(서울)`                                                                                  |
| `analyticsSearchConsoleSoon`      | `Search Console data appears here once it is connected.`                                         | `Search Console을 연결하면 여기에 검색 데이터가 나타납니다.`                                  |

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/lib/server/permission/policy.test.ts && pnpm test:types`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/permission/policy.ts "app/(admin)/admin/navigation-list.ts" app/components/admin/nav-item.tsx lib/admin-i18n tests/lib/server/permission/policy.test.ts
git commit -m "feat(admin): add the analytics permission, menu entry and copy"
```

---

### Task 2: 콘텐츠 그룹, 필터, 기간 계산

**Files:**

- Create: `lib/analytics/content-groups.ts`
- Create: `lib/analytics/filters.ts`
- Create: `lib/analytics/date-range.ts`
- Test: `tests/lib/analytics/filters.test.ts`
- Test: `tests/lib/analytics/date-range.test.ts`

**Interfaces:**

- Consumes: `CHANNELS`, `Channel` (`lib/analytics/constants.ts`, 계획 A)
- Produces:
  - `CONTENT_GROUPS`, `type ContentGroup`, `CONTENT_GROUP_RULES: ReadonlyArray<{ group: ContentGroup; pattern: string }>`, `contentGroupOf(path: string): ContentGroup`
  - `RANGE_PRESETS`, `type RangePreset`, `DEVICE_TYPES`, `type DeviceTypeFilter`, `type AnalyticsFilter`, `DEFAULT_ANALYTICS_FILTER`, `type SearchParamsRecord = Record<string, string | string[] | undefined>`, `parseAnalyticsFilter(params: SearchParamsRecord): AnalyticsFilter`, `analyticsFilterToSearchParams(filter: AnalyticsFilter): URLSearchParams`
  - `type TimeBucket = 'hour' | 'day' | 'week'`, `type DateRange = { start: Date; end: Date; previousStart: Date; previousEnd: Date; bucket: TimeBucket; days: number }`, `resolveDateRange(filter: Pick<AnalyticsFilter, 'range' | 'from' | 'to'>, now: Date): DateRange`, `bucketKeys(start: Date, end: Date, bucket: TimeBucket): string[]`, `seoulDateString(date: Date): string`, `SEOUL_OFFSET_MS`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/lib/analytics/filters.test.ts
import { describe, expect, it } from 'vitest'
import { contentGroupOf } from '@/lib/analytics/content-groups'
import {
  DEFAULT_ANALYTICS_FILTER,
  analyticsFilterToSearchParams,
  parseAnalyticsFilter,
} from '@/lib/analytics/filters'

describe('contentGroupOf', () => {
  it.each([
    ['/ko', 'home'],
    ['/en/session', 'session-list'],
    ['/ko/session/25-26', 'session-list'],
    [
      '/ko/session/25-26/0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e11',
      'session-detail',
    ],
    ['/en/project/25-26', 'project-list'],
    ['/en/project/25-26/12', 'project-detail'],
    ['/ko/member/25-26', 'member'],
    ['/ko/calendar', 'calendar'],
    ['/en/terms-of-service', 'legal'],
    ['/ko/unknown/page/here', 'other'],
  ])('%s → %s', (path, group) => {
    expect(contentGroupOf(path)).toBe(group)
  })
})

describe('parseAnalyticsFilter', () => {
  it('returns the defaults for an empty query', () => {
    expect(parseAnalyticsFilter({})).toEqual(DEFAULT_ANALYTICS_FILTER)
  })

  it('reads every supported key', () => {
    expect(
      parseAnalyticsFilter({
        range: 'custom',
        from: '2026-09-01',
        to: '2026-09-30',
        compare: '0',
        channel: 'Organic Search',
        device: 'mobile',
        country: 'kr',
        locale: 'en',
        visitor: 'returning',
        group: 'session-detail',
        path: '/ko/session',
        internal: '1',
      })
    ).toEqual({
      range: 'custom',
      from: '2026-09-01',
      to: '2026-09-30',
      compare: false,
      channel: 'Organic Search',
      device: 'mobile',
      country: 'KR',
      locale: 'en',
      visitor: 'returning',
      contentGroup: 'session-detail',
      path: '/ko/session',
      includeInternal: true,
    })
  })

  it('falls back to defaults for invalid values', () => {
    expect(
      parseAnalyticsFilter({
        range: 'abc',
        from: '2020-13-40',
        channel: 'Carrier pigeon',
        device: 'phone',
        country: 'Korea',
        locale: 'jp',
        visitor: 'vip',
        group: 'blog',
        path: ['a', 'b'],
      })
    ).toEqual(DEFAULT_ANALYTICS_FILTER)
  })

  it('drops custom dates unless the range is custom', () => {
    expect(
      parseAnalyticsFilter({ range: '7d', from: '2026-09-01' })
    ).toMatchObject({
      range: '7d',
      from: null,
      to: null,
    })
  })

  it('round-trips through search params and omits defaults', () => {
    const filter = {
      ...DEFAULT_ANALYTICS_FILTER,
      range: '90d' as const,
      device: 'desktop' as const,
    }
    const params = analyticsFilterToSearchParams(filter)
    expect(params.toString()).toBe('range=90d&device=desktop')
    expect(parseAnalyticsFilter(Object.fromEntries(params))).toEqual(filter)
  })
})
```

```ts
// tests/lib/analytics/date-range.test.ts
import { describe, expect, it } from 'vitest'
import {
  bucketKeys,
  resolveDateRange,
  seoulDateString,
} from '@/lib/analytics/date-range'

// 서울 2026-10-14 14:00 = UTC 05:00
const NOW = new Date('2026-10-14T05:00:00.000Z')

describe('resolveDateRange', () => {
  it('uses Seoul day boundaries for today', () => {
    const range = resolveDateRange(
      { range: 'today', from: null, to: null },
      NOW
    )
    expect(range.start.toISOString()).toBe('2026-10-13T15:00:00.000Z')
    expect(range.end.toISOString()).toBe('2026-10-14T15:00:00.000Z')
    expect(range.previousStart.toISOString()).toBe('2026-10-12T15:00:00.000Z')
    expect(range).toMatchObject({ bucket: 'hour', days: 1 })
  })

  it('covers 28 days including today with the previous 28 days before it', () => {
    const range = resolveDateRange({ range: '28d', from: null, to: null }, NOW)
    expect(range.start.toISOString()).toBe('2026-09-16T15:00:00.000Z')
    expect(range.end.toISOString()).toBe('2026-10-14T15:00:00.000Z')
    expect(range.previousEnd.toISOString()).toBe(range.start.toISOString())
    expect(range.previousStart.toISOString()).toBe('2026-08-19T15:00:00.000Z')
    expect(range).toMatchObject({ bucket: 'day', days: 28 })
  })

  it('switches to weekly buckets for 12 months', () => {
    expect(
      resolveDateRange({ range: '12m', from: null, to: null }, NOW)
    ).toMatchObject({
      bucket: 'week',
      days: 365,
    })
  })

  it('reads an inclusive custom range, swaps reversed dates and clamps to 26 months', () => {
    const range = resolveDateRange(
      { range: 'custom', from: '2026-09-30', to: '2026-09-01' },
      NOW
    )
    expect(range.start.toISOString()).toBe('2026-08-31T15:00:00.000Z')
    expect(range.end.toISOString()).toBe('2026-09-30T15:00:00.000Z')
    expect(range.days).toBe(30)

    const clamped = resolveDateRange(
      { range: 'custom', from: '2020-01-01', to: '2026-10-14' },
      NOW
    )
    expect(seoulDateString(clamped.start)).toBe('2024-08-14')
  })

  it('falls back to 28 days when a custom range is incomplete', () => {
    expect(
      resolveDateRange({ range: 'custom', from: null, to: null }, NOW).days
    ).toBe(28)
  })
})

describe('bucketKeys', () => {
  it('lists Seoul days, hours and Monday weeks', () => {
    const range = resolveDateRange({ range: '7d', from: null, to: null }, NOW)
    expect(bucketKeys(range.start, range.end, 'day')).toEqual([
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
    ])
    const today = resolveDateRange(
      { range: 'today', from: null, to: null },
      NOW
    )
    const hours = bucketKeys(today.start, today.end, 'hour')
    expect(hours).toHaveLength(24)
    expect(hours[0]).toBe('2026-10-14T00')
    expect(bucketKeys(range.start, range.end, 'week')).toEqual([
      '2026-10-06',
      '2026-10-13',
    ])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test tests/lib/analytics/filters.test.ts tests/lib/analytics/date-range.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/analytics/content-groups.ts
/** 공개 사이트 경로를 콘텐츠 그룹으로 묶는다. 같은 정규식 표를 SQL(`~`)에서도 써서 화면과 집계가 어긋나지 않게 한다. */

export const CONTENT_GROUPS = [
  'home',
  'session-list',
  'session-detail',
  'project-list',
  'project-detail',
  'member',
  'calendar',
  'legal',
  'other',
] as const

export type ContentGroup = (typeof CONTENT_GROUPS)[number]

/** 위에서부터 먼저 맞는 규칙이 이긴다. Postgres POSIX 정규식과 JS 정규식 양쪽에서 같은 뜻인 문법만 쓴다. */
export const CONTENT_GROUP_RULES: ReadonlyArray<{
  group: ContentGroup
  pattern: string
}> = [
  { group: 'home', pattern: '^/(en|ko)$' },
  { group: 'session-detail', pattern: '^/(en|ko)/session/[^/]+/[^/]+$' },
  { group: 'session-list', pattern: '^/(en|ko)/session(/[^/]+)?$' },
  { group: 'project-detail', pattern: '^/(en|ko)/project/[^/]+/[^/]+$' },
  { group: 'project-list', pattern: '^/(en|ko)/project(/[^/]+)?$' },
  { group: 'member', pattern: '^/(en|ko)/member(/[^/]+)?$' },
  { group: 'calendar', pattern: '^/(en|ko)/calendar$' },
  { group: 'legal', pattern: '^/(en|ko)/(privacy-policy|terms-of-service)$' },
]

const COMPILED = CONTENT_GROUP_RULES.map((rule) => ({
  ...rule,
  regex: new RegExp(rule.pattern),
}))

export function contentGroupOf(path: string): ContentGroup {
  return COMPILED.find((rule) => rule.regex.test(path))?.group ?? 'other'
}
```

```ts
// lib/analytics/filters.ts
/** 분석 화면의 필터 모델. URL 쿼리와 오가며, 잘못된 값은 오류 대신 기본값으로 되돌린다(공유 링크가 깨져도 화면은 열린다). */
import { CHANNELS, type Channel } from '@/lib/analytics/constants'
import {
  CONTENT_GROUPS,
  type ContentGroup,
} from '@/lib/analytics/content-groups'

export const RANGE_PRESETS = [
  'today',
  'yesterday',
  '7d',
  '28d',
  '90d',
  '12m',
  'custom',
] as const
export type RangePreset = (typeof RANGE_PRESETS)[number]

export const DEVICE_TYPES = ['mobile', 'tablet', 'desktop'] as const
export type DeviceTypeFilter = (typeof DEVICE_TYPES)[number]

export type AnalyticsFilter = {
  range: RangePreset
  /** `range`가 custom일 때만 쓰는 서울 날짜(YYYY-MM-DD, 양 끝 포함). */
  from: string | null
  to: string | null
  compare: boolean
  channel: Channel | null
  device: DeviceTypeFilter | null
  /** ISO 3166 두 글자, 대문자. */
  country: string | null
  locale: 'ko' | 'en' | null
  visitor: 'new' | 'returning' | null
  contentGroup: ContentGroup | null
  /** 페이지 경로에 포함된 글자(와일드카드 아님). */
  path: string | null
  includeInternal: boolean
}

export const DEFAULT_ANALYTICS_FILTER: AnalyticsFilter = {
  range: '28d',
  from: null,
  to: null,
  compare: true,
  channel: null,
  device: null,
  country: null,
  locale: null,
  visitor: null,
  contentGroup: null,
  path: null,
  includeInternal: false,
}

export type SearchParamsRecord = Record<string, string | string[] | undefined>

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function single(params: SearchParamsRecord, key: string): string | null {
  const value = params[key]
  return typeof value === 'string' && value.length > 0 ? value : null
}

function oneOf<T extends string>(
  value: string | null,
  options: readonly T[]
): T | null {
  return value !== null && (options as readonly string[]).includes(value)
    ? (value as T)
    : null
}

function validDate(value: string | null): string | null {
  if (!value || !DATE_PATTERN.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : value
}

export function parseAnalyticsFilter(
  params: SearchParamsRecord
): AnalyticsFilter {
  const range =
    oneOf(single(params, 'range'), RANGE_PRESETS) ??
    DEFAULT_ANALYTICS_FILTER.range
  const country = single(params, 'country')?.toUpperCase() ?? null
  const path = single(params, 'path')?.trim().slice(0, 200) || null

  return {
    range,
    from: range === 'custom' ? validDate(single(params, 'from')) : null,
    to: range === 'custom' ? validDate(single(params, 'to')) : null,
    compare: single(params, 'compare') !== '0',
    channel: oneOf(single(params, 'channel'), CHANNELS),
    device: oneOf(single(params, 'device'), DEVICE_TYPES),
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    locale: oneOf(single(params, 'locale'), ['ko', 'en'] as const),
    visitor: oneOf(single(params, 'visitor'), ['new', 'returning'] as const),
    contentGroup: oneOf(single(params, 'group'), CONTENT_GROUPS),
    path,
    includeInternal: single(params, 'internal') === '1',
  }
}

/** 기본값과 같은 항목은 빼서 공유 링크를 짧게 유지한다. */
export function analyticsFilterToSearchParams(
  filter: AnalyticsFilter
): URLSearchParams {
  const params = new URLSearchParams()
  if (filter.range !== DEFAULT_ANALYTICS_FILTER.range)
    params.set('range', filter.range)
  if (filter.range === 'custom' && filter.from) params.set('from', filter.from)
  if (filter.range === 'custom' && filter.to) params.set('to', filter.to)
  if (!filter.compare) params.set('compare', '0')
  if (filter.channel) params.set('channel', filter.channel)
  if (filter.device) params.set('device', filter.device)
  if (filter.country) params.set('country', filter.country)
  if (filter.locale) params.set('locale', filter.locale)
  if (filter.visitor) params.set('visitor', filter.visitor)
  if (filter.contentGroup) params.set('group', filter.contentGroup)
  if (filter.path) params.set('path', filter.path)
  if (filter.includeInternal) params.set('internal', '1')
  return params
}
```

```ts
// lib/analytics/date-range.ts
/**
 * 보고서 기간을 서울 날짜 경계로 계산한다. 서울은 일광 절약 시간이 없어 UTC+9 고정 오프셋으로 충분하다.
 * 끝은 포함하지 않는다(`[start, end)`). 직전 기간은 같은 길이로 바로 앞이다.
 */
import { RETENTION_MONTHS } from '@/lib/analytics/constants'
import type { AnalyticsFilter } from '@/lib/analytics/filters'

export type TimeBucket = 'hour' | 'day' | 'week'

export type DateRange = {
  start: Date
  end: Date
  previousStart: Date
  previousEnd: Date
  bucket: TimeBucket
  days: number
}

export const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

const PRESET_DAYS = {
  today: 1,
  '7d': 7,
  '28d': 28,
  '90d': 90,
  '12m': 365,
} as const

/** 서울 기준 그날 0시의 UTC 시각. */
function seoulDayStart(date: Date): number {
  return (
    Math.floor((date.getTime() + SEOUL_OFFSET_MS) / DAY_MS) * DAY_MS -
    SEOUL_OFFSET_MS
  )
}

function fromSeoulDate(value: string): number {
  return Date.parse(`${value}T00:00:00Z`) - SEOUL_OFFSET_MS
}

export function seoulDateString(date: Date): string {
  return new Date(date.getTime() + SEOUL_OFFSET_MS).toISOString().slice(0, 10)
}

// 차트 점 개수를 수십~백여 개로 유지한다.
function bucketFor(days: number): TimeBucket {
  if (days <= 2) return 'hour'
  if (days <= 120) return 'day'
  return 'week'
}

function build(start: number, end: number): DateRange {
  const length = end - start
  const days = Math.round(length / DAY_MS)
  return {
    start: new Date(start),
    end: new Date(end),
    previousStart: new Date(start - length),
    previousEnd: new Date(start),
    bucket: bucketFor(days),
    days,
  }
}

export function resolveDateRange(
  filter: Pick<AnalyticsFilter, 'range' | 'from' | 'to'>,
  now: Date
): DateRange {
  const tomorrow = seoulDayStart(now) + DAY_MS

  if (filter.range === 'yesterday')
    return build(tomorrow - 2 * DAY_MS, tomorrow - DAY_MS)
  if (filter.range === 'custom' && filter.from && filter.to) {
    const earliest = new Date(now.getTime())
    earliest.setUTCMonth(earliest.getUTCMonth() - RETENTION_MONTHS)
    const [first, last] = [
      fromSeoulDate(filter.from),
      fromSeoulDate(filter.to),
    ].sort((a, b) => a - b) as [number, number]
    const start = Math.max(first, seoulDayStart(earliest))
    const end = Math.min(last + DAY_MS, tomorrow)
    return build(start, Math.max(end, start + DAY_MS))
  }

  const days =
    filter.range === 'custom' ? PRESET_DAYS['28d'] : PRESET_DAYS[filter.range]
  return build(tomorrow - days * DAY_MS, tomorrow)
}

/** SQL `bucketSql`과 같은 형식의 구간 키 목록. 빈 구간을 0으로 채울 때 쓴다. */
export function bucketKeys(
  start: Date,
  end: Date,
  bucket: TimeBucket
): string[] {
  const keys: string[] = []
  if (bucket === 'hour') {
    for (let t = start.getTime(); t < end.getTime(); t += HOUR_MS) {
      keys.push(new Date(t + SEOUL_OFFSET_MS).toISOString().slice(0, 13))
    }
    return keys
  }
  if (bucket === 'day') {
    for (let t = start.getTime(); t < end.getTime(); t += DAY_MS)
      keys.push(seoulDateString(new Date(t)))
    return keys
  }
  // 주는 월요일에 시작한다(Postgres date_trunc('week')와 같다).
  const first = new Date(start.getTime() + SEOUL_OFFSET_MS)
  const mondayOffset = (first.getUTCDay() + 6) % 7
  for (
    let t = start.getTime() - mondayOffset * DAY_MS;
    t < end.getTime();
    t += 7 * DAY_MS
  ) {
    keys.push(seoulDateString(new Date(t)))
  }
  return keys
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test tests/lib/analytics/filters.test.ts tests/lib/analytics/date-range.test.ts`
Expected: PASS. 시간 구간 키 형식은 `YYYY-MM-DDTHH`(13자)다.

- [ ] **Step 5: Commit**

```bash
git add lib/analytics tests/lib/analytics
git commit -m "feat(analytics): parse report filters and resolve Seoul date ranges"
```

---

### Task 3: 지표 정의와 CSV 직렬화

**Files:**

- Create: `lib/analytics/metrics.ts`
- Create: `lib/analytics/csv.ts`
- Test: `tests/lib/analytics/metrics.test.ts`

**Interfaces:**

- Consumes: `WebVitalName`, `WebVitalRating` (계획 A `events.ts`)
- Produces:
  - `ENGAGED_MIN_ENGAGEMENT_MS = 10_000`, `ENGAGED_MIN_VIEWS = 2`, `WEB_VITAL_THRESHOLDS`, `rateWebVital(metric: WebVitalName, value: number): WebVitalRating`
  - `type SessionMetrics = { users: number; newUsers: number; sessions: number; engagedSessions: number; views: number; engagementMs: number; keyEvents: number }`
  - `type DerivedSessionMetrics = SessionMetrics & { engagementRate: number; bounceRate: number; viewsPerSession: number; avgEngagementSeconds: number }`
  - `SESSION_METRIC_KEYS` (탐색에서 고를 수 있는 지표 이름 튜플), `type SessionMetricKey`
  - `EMPTY_SESSION_METRICS: SessionMetrics`, `deriveSessionMetrics(metrics: SessionMetrics): DerivedSessionMetrics`, `percentChange(current: number, previous: number): number | null`
  - `toCsv(columns: string[], rows: Array<Record<string, string | number | null>>): string`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/analytics/metrics.test.ts
import { describe, expect, it } from 'vitest'
import { toCsv } from '@/lib/analytics/csv'
import {
  EMPTY_SESSION_METRICS,
  deriveSessionMetrics,
  percentChange,
  rateWebVital,
} from '@/lib/analytics/metrics'

describe('deriveSessionMetrics', () => {
  it('derives GA4-style rates', () => {
    expect(
      deriveSessionMetrics({
        users: 80,
        newUsers: 50,
        sessions: 100,
        engagedSessions: 60,
        views: 250,
        engagementMs: 4_500_000,
        keyEvents: 7,
      })
    ).toMatchObject({
      engagementRate: 0.6,
      bounceRate: 0.4,
      viewsPerSession: 2.5,
      avgEngagementSeconds: 45,
    })
  })

  it('returns zeros instead of NaN when there are no sessions', () => {
    expect(deriveSessionMetrics(EMPTY_SESSION_METRICS)).toMatchObject({
      engagementRate: 0,
      bounceRate: 0,
      viewsPerSession: 0,
      avgEngagementSeconds: 0,
    })
  })
})

describe('percentChange', () => {
  it('is null without a previous value', () => {
    expect(percentChange(10, 0)).toBeNull()
    expect(percentChange(15, 10)).toBeCloseTo(0.5)
    expect(percentChange(5, 10)).toBeCloseTo(-0.5)
  })
})

describe('rateWebVital', () => {
  it.each([
    ['LCP', 2500, 'good'],
    ['LCP', 2501, 'needs-improvement'],
    ['LCP', 4001, 'poor'],
    ['INP', 199, 'good'],
    ['CLS', 0.26, 'poor'],
    ['TTFB', 900, 'needs-improvement'],
  ] as const)('%s %d → %s', (metric, value, rating) => {
    expect(rateWebVital(metric, value)).toBe(rating)
  })
})

describe('toCsv', () => {
  it('quotes separators and neutralizes spreadsheet formulas', () => {
    const csv = toCsv(
      ['path', 'title', 'views'],
      [
        { path: '/ko', title: 'Hello, "world"\nline', views: 3 },
        { path: '=HYPERLINK("x")', title: null, views: 0 },
      ]
    )
    expect(csv).toBe(
      '﻿path,title,views\r\n/ko,"Hello, ""world""\nline",3\r\n"\'=HYPERLINK(""x"")",,0\r\n'
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/analytics/metrics.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/analytics/metrics.ts
/** 지표 정의와 임계값의 단일 출처. 화면·MCP·테스트가 같이 쓴다(명세 7장). GA4 정의를 따른다. */
import type { WebVitalName, WebVitalRating } from '@/lib/analytics/events'

export const ENGAGED_MIN_ENGAGEMENT_MS = 10_000
export const ENGAGED_MIN_VIEWS = 2

/** web.dev의 Core Web Vitals 기준. good 이하면 좋음, poor 초과면 나쁨. */
export const WEB_VITAL_THRESHOLDS: Record<
  WebVitalName,
  { good: number; poor: number; unit: 'ms' | 'score' }
> = {
  LCP: { good: 2500, poor: 4000, unit: 'ms' },
  INP: { good: 200, poor: 500, unit: 'ms' },
  CLS: { good: 0.1, poor: 0.25, unit: 'score' },
  FCP: { good: 1800, poor: 3000, unit: 'ms' },
  TTFB: { good: 800, poor: 1800, unit: 'ms' },
}

export function rateWebVital(
  metric: WebVitalName,
  value: number
): WebVitalRating {
  const threshold = WEB_VITAL_THRESHOLDS[metric]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/** SQL이 돌려주는 합계. 비율은 `deriveSessionMetrics`가 계산한다. */
export type SessionMetrics = {
  users: number
  newUsers: number
  sessions: number
  engagedSessions: number
  views: number
  engagementMs: number
  keyEvents: number
}

export type DerivedSessionMetrics = SessionMetrics & {
  engagementRate: number
  bounceRate: number
  viewsPerSession: number
  avgEngagementSeconds: number
}

export const SESSION_METRIC_KEYS = [
  'users',
  'newUsers',
  'sessions',
  'engagedSessions',
  'engagementRate',
  'bounceRate',
  'views',
  'viewsPerSession',
  'avgEngagementSeconds',
  'keyEvents',
] as const

export type SessionMetricKey = (typeof SESSION_METRIC_KEYS)[number]

export const EMPTY_SESSION_METRICS: SessionMetrics = {
  users: 0,
  newUsers: 0,
  sessions: 0,
  engagedSessions: 0,
  views: 0,
  engagementMs: 0,
  keyEvents: 0,
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0
}

/** 세션이 없으면 비율은 0이다. 화면에 NaN·Infinity가 나오지 않게 한다. */
export function deriveSessionMetrics(
  metrics: SessionMetrics
): DerivedSessionMetrics {
  const engagementRate = ratio(metrics.engagedSessions, metrics.sessions)
  return {
    ...metrics,
    engagementRate,
    bounceRate: metrics.sessions > 0 ? 1 - engagementRate : 0,
    viewsPerSession: ratio(metrics.views, metrics.sessions),
    avgEngagementSeconds: ratio(metrics.engagementMs, metrics.sessions) / 1000,
  }
}

/** 직전 값이 0이면 증감률을 정의할 수 없어 null. */
export function percentChange(
  current: number,
  previous: number
): number | null {
  return previous > 0 ? (current - previous) / previous : null
}
```

```ts
// lib/analytics/csv.ts
/** 보고서 표를 엑셀에서 바로 여는 CSV로 만든다. BOM으로 한글이 깨지지 않게 하고, 수식으로 시작하는 값은 글자로 만든다. */

// =, +, -, @, 탭, CR로 시작하면 스프레드시트가 수식으로 실행할 수 있다(CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/

function cell(value: string | number | null): string {
  if (value === null) return ''
  if (typeof value === 'number') return String(value)
  const safe = FORMULA_START.test(value) ? `'${value}` : value
  return /[",\n\r]/.test(safe) || safe !== value
    ? `"${safe.replaceAll('"', '""')}"`
    : safe
}

export function toCsv(
  columns: string[],
  rows: Array<Record<string, string | number | null>>
): string {
  const lines = [
    columns.join(','),
    ...rows.map((row) =>
      columns.map((column) => cell(row[column] ?? null)).join(',')
    ),
  ]
  return `﻿${lines.join('\r\n')}\r\n`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/lib/analytics/metrics.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/analytics/metrics.ts lib/analytics/csv.ts tests/lib/analytics/metrics.test.ts
git commit -m "feat(analytics): define GA4-compatible metrics and CSV export"
```

---

### Task 4: SQL 도우미와 세션 범용 집계

**Files:**

- Create: `lib/server/analytics/queries/sql.ts`
- Create: `lib/server/analytics/queries/sessions.ts`
- Create: `tests/helpers/analytics-fixtures.ts`
- Test: `tests/lib/analytics/session-queries.test.ts`

**Interfaces:**

- Consumes: `AnalyticsFilter`, `DateRange`, `TimeBucket`, `CONTENT_GROUP_RULES`, `SessionMetrics`, `ENGAGED_MIN_*`, `createAnalyticsTestDb`
- Produces:
  - `sql.ts`: `type QueryExecutor = { execute: (query: SQL) => Promise<unknown> }`, `selectRows<T>(executor: QueryExecutor, query: SQL): Promise<T[]>`, `withAnalyticsTimeout<T>(work: (tx: QueryExecutor) => Promise<T>): Promise<T>`, `isQueryTimeout(error: unknown): boolean`, `timestampParam(date: Date): SQL`, `bucketSql(column: SQL, bucket: TimeBucket): SQL`, `contentGroupSql(column: SQL): SQL`, `sessionConditions(filter: AnalyticsFilter, alias: string): SQL[]`, `pageConditions(filter: AnalyticsFilter, alias: string): SQL[]`, `whereAll(conditions: SQL[]): SQL`
  - `sessions.ts`: `SESSION_DIMENSIONS` (튜플), `type SessionDimension`, `type SessionMetricRow = { dimensions: Record<string, string>; metrics: SessionMetrics }`, `aggregateSessions(executor: QueryExecutor, input: { filter: AnalyticsFilter; start: Date; end: Date; bucket: TimeBucket; dimensions: SessionDimension[]; orderBy?: keyof SessionMetrics; limit?: number }): Promise<SessionMetricRow[]>`, `collectingSince(executor: QueryExecutor): Promise<Date | null>`
  - `tests/helpers/analytics-fixtures.ts`: `insertSession(client: PGlite, session: FixtureSession): Promise<void>`, `type FixtureSession`

- [ ] **Step 1: Write the fixture helper**

```ts
// tests/helpers/analytics-fixtures.ts
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
```

- [ ] **Step 2: Write the failing test**

```ts
// tests/lib/analytics/session-queries.test.ts
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

import {
  DEFAULT_ANALYTICS_FILTER,
  type AnalyticsFilter,
} from '@/lib/analytics/filters'
import {
  aggregateSessions,
  collectingSince,
} from '@/lib/server/analytics/queries/sessions'
import { withAnalyticsTimeout } from '@/lib/server/analytics/queries/sql'
import { insertSession } from '@/tests/helpers/analytics-fixtures'
import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'

const START = new Date('2026-10-01T00:00:00.000Z')
const END = new Date('2026-10-08T00:00:00.000Z')
const V1 = '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d01'
const V2 = '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d02'
const V3 = '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d03'

function run(
  filter: Partial<AnalyticsFilter>,
  dimensions: Parameters<typeof aggregateSessions>[1]['dimensions'] = []
) {
  return withAnalyticsTimeout((tx) =>
    aggregateSessions(tx, {
      filter: { ...DEFAULT_ANALYTICS_FILTER, ...filter },
      start: START,
      end: END,
      bucket: 'day',
      dimensions,
    })
  )
}

beforeEach(async () => {
  testDb.current = await createAnalyticsTestDb()
  const client = testDb.current.client
  // 참여: 2회 조회
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e01',
    visitorId: V1,
    startedAt: '2026-10-02 01:00:00',
    channel: 'Organic Search',
    referrerHost: 'google.com',
    deviceType: 'mobile',
    views: [
      { path: '/ko', at: '2026-10-02 01:00:00', engagementMs: 4_000 },
      {
        path: '/ko/session/25-26',
        at: '2026-10-02 01:01:00',
        engagementMs: 3_000,
      },
    ],
  })
  // 이탈: 1회 조회, 5초
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e02',
    visitorId: V2,
    startedAt: '2026-10-03 10:00:00',
    views: [
      { path: '/en/project', at: '2026-10-03 10:00:00', engagementMs: 5_000 },
    ],
  })
  // 참여: CTA 클릭, 재방문
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e03',
    visitorId: V1,
    startedAt: '2026-10-05 12:00:00',
    isNewVisitor: false,
    channel: 'Organic Search',
    referrerHost: 'google.com',
    deviceType: 'mobile',
    views: [{ path: '/ko', at: '2026-10-05 12:00:00', engagementMs: 2_000 }],
    events: [
      { name: 'cta', at: '2026-10-05 12:00:05', label: 'join_instagram' },
    ],
  })
  // 내부 트래픽
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e04',
    visitorId: V3,
    startedAt: '2026-10-04 09:00:00',
    isInternal: true,
    views: [
      {
        path: '/ko/100%_done',
        at: '2026-10-04 09:00:00',
        engagementMs: 60_000,
      },
    ],
  })
  // 기간 밖
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e05',
    visitorId: V3,
    startedAt: '2026-09-20 09:00:00',
  })
})

describe('aggregateSessions', () => {
  it('totals the range and excludes internal traffic by default', async () => {
    const [row] = await run({})
    expect(row!.metrics).toEqual({
      users: 2,
      newUsers: 2,
      sessions: 3,
      engagedSessions: 2,
      views: 4,
      engagementMs: 14_000,
      keyEvents: 1,
    })
  })

  it('includes internal traffic on request', async () => {
    const [row] = await run({ includeInternal: true })
    expect(row!.metrics.sessions).toBe(4)
  })

  it('groups by dimensions and sorts by sessions', async () => {
    const rows = await run({}, ['channel', 'deviceType'])
    expect(rows.map((row) => [row.dimensions, row.metrics.sessions])).toEqual([
      [{ channel: 'Organic Search', deviceType: 'mobile' }, 2],
      [{ channel: 'Direct', deviceType: 'desktop' }, 1],
    ])
  })

  it('buckets by Seoul day', async () => {
    const rows = await run({}, ['date'])
    expect(
      Object.fromEntries(
        rows.map((row) => [row.dimensions.date, row.metrics.sessions])
      )
    ).toEqual({
      '2026-10-02': 1,
      '2026-10-03': 1,
      '2026-10-05': 1,
    })
  })

  it('applies session and page filters', async () => {
    expect((await run({ device: 'mobile' }))[0]!.metrics.sessions).toBe(2)
    expect((await run({ visitor: 'returning' }))[0]!.metrics.sessions).toBe(1)
    expect((await run({ locale: 'en' }))[0]!.metrics.sessions).toBe(1)
    expect(
      (await run({ contentGroup: 'session-list' }))[0]!.metrics.sessions
    ).toBe(1)
  })

  it('matches path filters literally, not as LIKE wildcards', async () => {
    expect(
      (await run({ includeInternal: true, path: '100%_' }))[0]!.metrics.sessions
    ).toBe(1)
    // '_o'를 와일드카드로 읽으면 '/ko'가 걸린다. 글자 그대로는 어느 경로에도 없다.
    expect(await run({ includeInternal: true, path: '_o' })).toEqual([])
  })

  it('returns no rows for an empty range', async () => {
    const rows = await withAnalyticsTimeout((tx) =>
      aggregateSessions(tx, {
        filter: DEFAULT_ANALYTICS_FILTER,
        start: new Date('2025-01-01T00:00:00Z'),
        end: new Date('2025-01-02T00:00:00Z'),
        bucket: 'day',
        dimensions: [],
      })
    )
    expect(rows).toEqual([])
  })
})

describe('collectingSince', () => {
  it('returns the first session start', async () => {
    const since = await withAnalyticsTimeout((tx) => collectingSince(tx))
    expect(since?.toISOString()).toBe('2026-09-20T09:00:00.000Z')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm test tests/lib/analytics/session-queries.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 4: Write `sql.ts`**

```ts
// lib/server/analytics/queries/sql.ts
/**
 * 분석 쿼리 공용 도구. 드라이버(postgres-js·PGlite)마다 execute 결과 모양이 달라 selectRows로 맞춘다.
 * 저장된 timestamp는 시간대 없는 UTC 시각이라 서울 구간은 9시간을 더해 자른다.
 */
import 'server-only'

import { sql, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { CONTENT_GROUP_RULES } from '@/lib/analytics/content-groups'
import type { TimeBucket } from '@/lib/analytics/date-range'
import type { AnalyticsFilter } from '@/lib/analytics/filters'

export type QueryExecutor = { execute: (query: SQL) => Promise<unknown> }

export async function selectRows<T>(
  executor: QueryExecutor,
  query: SQL
): Promise<T[]> {
  const result = await executor.execute(query)
  return (
    Array.isArray(result) ? result : (result as { rows: T[] }).rows
  ) as T[]
}

/** 무거운 기간 쿼리가 DB를 붙잡지 않게 10초에서 끊는다. 초과하면 Postgres가 57014 오류를 던진다. */
export function withAnalyticsTimeout<T>(
  work: (tx: QueryExecutor) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL statement_timeout = '10s'`)
    return work(tx)
  })
}

export function isQueryTimeout(error: unknown): boolean {
  const code = error as { code?: unknown; cause?: { code?: unknown } } | null
  return code?.code === '57014' || code?.cause?.code === '57014'
}

export function timestampParam(date: Date): SQL {
  return sql`${date.toISOString()}::timestamp`
}

/** `lib/analytics/date-range.ts`의 `bucketKeys`와 같은 키를 만든다. */
export function bucketSql(column: SQL, bucket: TimeBucket): SQL {
  const seoul = sql`(${column} + interval '9 hours')`
  if (bucket === 'hour') return sql`to_char(${seoul}, 'YYYY-MM-DD"T"HH24')`
  if (bucket === 'week')
    return sql`to_char(date_trunc('week', ${seoul}), 'YYYY-MM-DD')`
  return sql`to_char(${seoul}, 'YYYY-MM-DD')`
}

export function contentGroupSql(column: SQL): SQL {
  const cases = CONTENT_GROUP_RULES.map(
    (rule) => sql`WHEN ${column} ~ ${rule.pattern} THEN ${rule.group}`
  )
  return sql`(CASE ${sql.join(cases, sql` `)} ELSE 'other' END)`
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

/** 세션 속성 필터(기간 제외). `alias`는 analytics_sessions 별칭이다. */
export function sessionConditions(
  filter: AnalyticsFilter,
  alias: string
): SQL[] {
  const s = sql.raw(`"${alias}"`)
  const conditions: SQL[] = []
  if (!filter.includeInternal) conditions.push(sql`NOT ${s}."isInternal"`)
  if (filter.channel) conditions.push(sql`${s}.channel = ${filter.channel}`)
  if (filter.device) conditions.push(sql`${s}."deviceType" = ${filter.device}`)
  if (filter.country) conditions.push(sql`${s}.country = ${filter.country}`)
  if (filter.visitor)
    conditions.push(sql`${s}."isNewVisitor" = ${filter.visitor === 'new'}`)
  return conditions
}

/** 페이지 속성 필터. `alias`는 analytics_page_views 별칭이다. */
export function pageConditions(filter: AnalyticsFilter, alias: string): SQL[] {
  const v = sql.raw(`"${alias}"`)
  const conditions: SQL[] = []
  if (filter.locale) conditions.push(sql`${v}.locale = ${filter.locale}`)
  if (filter.contentGroup)
    conditions.push(
      sql`${contentGroupSql(sql`${v}.path`)} = ${filter.contentGroup}`
    )
  if (filter.path)
    conditions.push(
      sql`${v}.path ILIKE ${`%${escapeLike(filter.path)}%`} ESCAPE '\\'`
    )
  return conditions
}

export function whereAll(conditions: SQL[]): SQL {
  return conditions.length > 0 ? sql.join(conditions, sql` AND `) : sql`TRUE`
}
```

- [ ] **Step 5: Write `sessions.ts`**

```ts
// lib/server/analytics/queries/sessions.ts
/**
 * 세션 단위 지표를 원하는 차원으로 묶는 범용 집계. 개요·유입·사용자·탐색이 모두 이 함수 하나를 차원만 바꿔 쓴다.
 * 세션은 시작 시각으로 기간에 넣고(GA4와 같음), 페이지 필터가 있으면 맞는 조회가 하나라도 있는 세션만 센다.
 */
import 'server-only'

import { sql, type SQL } from 'drizzle-orm'
import type { TimeBucket } from '@/lib/analytics/date-range'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import {
  ENGAGED_MIN_ENGAGEMENT_MS,
  ENGAGED_MIN_VIEWS,
  type SessionMetrics,
} from '@/lib/analytics/metrics'
import {
  bucketSql,
  contentGroupSql,
  pageConditions,
  selectRows,
  sessionConditions,
  timestampParam,
  whereAll,
  type QueryExecutor,
} from '@/lib/server/analytics/queries/sql'

export const SESSION_DIMENSIONS = [
  'date',
  'channel',
  'source',
  'medium',
  'campaign',
  'referrer',
  'landingPath',
  'landingGroup',
  'deviceType',
  'browser',
  'os',
  'screen',
  'country',
  'language',
  'visitorType',
  'weekday',
  'hour',
] as const

export type SessionDimension = (typeof SESSION_DIMENSIONS)[number]

export type SessionMetricRow = {
  dimensions: Record<string, string>
  metrics: SessionMetrics
}

function dimensionSql(dimension: SessionDimension, bucket: TimeBucket): SQL {
  const seoul = sql`(ss."startedAt" + interval '9 hours')`
  switch (dimension) {
    case 'date':
      return bucketSql(sql`ss."startedAt"`, bucket)
    case 'channel':
      return sql`ss.channel`
    case 'source':
      return sql`coalesce(ss."utmSource", ss."referrerHost", '(direct)')`
    case 'medium':
      return sql`coalesce(ss."utmMedium", CASE WHEN ss.channel = 'Organic Search' THEN 'organic' WHEN ss."referrerHost" IS NOT NULL THEN 'referral' ELSE '(none)' END)`
    case 'campaign':
      return sql`coalesce(ss."utmCampaign", '(not set)')`
    case 'referrer':
      return sql`coalesce(ss."referrerHost", '(direct)')`
    case 'landingPath':
      return sql`ss."landingPath"`
    case 'landingGroup':
      return contentGroupSql(sql`ss."landingPath"`)
    case 'deviceType':
      return sql`ss."deviceType"`
    case 'browser':
      return sql`ss.browser`
    case 'os':
      return sql`ss.os`
    case 'screen':
      return sql`coalesce(ss."screenWidth"::text || 'x' || ss."screenHeight"::text, 'unknown')`
    case 'country':
      return sql`ss.country`
    case 'language':
      return sql`lower(split_part(coalesce(ss.language, 'unknown'), '-', 1))`
    case 'visitorType':
      return sql`CASE WHEN ss."isNewVisitor" THEN 'new' ELSE 'returning' END`
    case 'weekday':
      // 0 = 월요일
      return sql`(extract(isodow from ${seoul})::int - 1)::text`
    case 'hour':
      return sql`extract(hour from ${seoul})::int::text`
  }
}

/** 세션별 조회 수·참여 시간·핵심 이벤트 수와 참여 여부를 붙인 CTE. */
function sessionStatsCte(filter: AnalyticsFilter, start: Date, end: Date): SQL {
  const pageFilter = pageConditions(filter, 'fv')
  const conditions = [
    sql`s."startedAt" >= ${timestampParam(start)}`,
    sql`s."startedAt" < ${timestampParam(end)}`,
    ...sessionConditions(filter, 's'),
  ]
  if (pageFilter.length > 0) {
    conditions.push(
      sql`EXISTS (SELECT 1 FROM analytics_page_views fv WHERE fv."sessionId" = s.id AND ${whereAll(pageFilter)})`
    )
  }
  return sql`
    ss AS (
      SELECT s.*,
        coalesce(v.views, 0) AS views,
        coalesce(v.engagement_ms, 0) AS engagement_ms,
        coalesce(e.key_events, 0) AS key_events,
        (coalesce(v.engagement_ms, 0) >= ${ENGAGED_MIN_ENGAGEMENT_MS}
          OR coalesce(v.views, 0) >= ${ENGAGED_MIN_VIEWS}
          OR coalesce(e.key_events, 0) > 0) AS engaged
      FROM analytics_sessions s
      LEFT JOIN LATERAL (
        SELECT count(*) AS views, sum("engagementMs") AS engagement_ms
        FROM analytics_page_views WHERE "sessionId" = s.id
      ) v ON TRUE
      LEFT JOIN LATERAL (
        SELECT count(*) AS key_events
        FROM analytics_events WHERE "sessionId" = s.id AND name = 'cta'
      ) e ON TRUE
      WHERE ${whereAll(conditions)}
    )`
}

type RawRow = Record<string, string | number | null> & {
  users: number
  new_users: number
  sessions: number
  engaged_sessions: number
  views: number
  engagement_ms: number
  key_events: number
}

/** 차원이 비어 있으면 합계 한 행(세션이 없으면 빈 배열). 기본 정렬은 세션 수 내림차순. */
export async function aggregateSessions(
  executor: QueryExecutor,
  input: {
    filter: AnalyticsFilter
    start: Date
    end: Date
    bucket: TimeBucket
    dimensions: SessionDimension[]
    orderBy?: keyof SessionMetrics
    limit?: number
  }
): Promise<SessionMetricRow[]> {
  const columns = input.dimensions.map(
    (dimension) =>
      sql`${dimensionSql(dimension, input.bucket)} AS ${sql.raw(`"dim_${dimension}"`)}`
  )
  const groupBy = input.dimensions.map((_, index) => sql.raw(String(index + 1)))
  const orderColumn = {
    users: 'users',
    newUsers: 'new_users',
    sessions: 'sessions',
    engagedSessions: 'engaged_sessions',
    views: 'views',
    engagementMs: 'engagement_ms',
    keyEvents: 'key_events',
  }[input.orderBy ?? 'sessions']

  const rows = await selectRows<RawRow>(
    executor,
    sql`
      WITH ${sessionStatsCte(input.filter, input.start, input.end)}
      SELECT ${columns.length > 0 ? sql`${sql.join(columns, sql`, `)},` : sql``}
        count(*)::int AS sessions,
        count(DISTINCT ss."visitorId")::int AS users,
        count(DISTINCT ss."visitorId") FILTER (WHERE ss."isNewVisitor")::int AS new_users,
        count(*) FILTER (WHERE ss.engaged)::int AS engaged_sessions,
        coalesce(sum(ss.views), 0)::float8 AS views,
        coalesce(sum(ss.engagement_ms), 0)::float8 AS engagement_ms,
        coalesce(sum(ss.key_events), 0)::float8 AS key_events
      FROM ss
      ${groupBy.length > 0 ? sql`GROUP BY ${sql.join(groupBy, sql`, `)}` : sql``}
      HAVING count(*) > 0
      ORDER BY ${sql.raw(orderColumn)} DESC${groupBy.length > 0 ? sql`, ${sql.join(groupBy, sql`, `)}` : sql``}
      ${input.limit ? sql`LIMIT ${input.limit}` : sql``}
    `
  )

  return rows.map((row) => ({
    dimensions: Object.fromEntries(
      input.dimensions.map((dimension) => [
        dimension,
        String(row[`dim_${dimension}`]),
      ])
    ),
    metrics: {
      users: Number(row.users),
      newUsers: Number(row.new_users),
      sessions: Number(row.sessions),
      engagedSessions: Number(row.engaged_sessions),
      views: Number(row.views),
      engagementMs: Number(row.engagement_ms),
      keyEvents: Number(row.key_events),
    },
  }))
}

/** 첫 세션 시작 시각. 빈 화면에 "언제부터 수집 중인지"를 보여 준다. */
export async function collectingSince(
  executor: QueryExecutor
): Promise<Date | null> {
  const [row] = await selectRows<{ since: string | null }>(
    executor,
    sql`SELECT to_char(min("startedAt"), 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS since FROM analytics_sessions`
  )
  return row?.since ? new Date(row.since) : null
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test tests/lib/analytics/session-queries.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add lib/server/analytics/queries tests/helpers/analytics-fixtures.ts tests/lib/analytics/session-queries.test.ts
git commit -m "feat(analytics): aggregate session metrics by any dimension"
```

---

### Task 5: 페이지·이벤트·404 쿼리

**Files:**

- Create: `lib/server/analytics/queries/pages.ts`
- Test: `tests/lib/analytics/page-queries.test.ts`

**Interfaces:**

- Consumes: Task 4의 `sql.ts` 전부, `contentGroupOf`
- Produces:
  - `type PageRow = { path: string; title: string | null; contentGroup: ContentGroup; views: number; users: number; avgEngagementSeconds: number; scroll75Rate: number; entrances: number; exits: number; exitRate: number }`
  - `getPages(executor, input: { filter: AnalyticsFilter; start: Date; end: Date; limit?: number }): Promise<PageRow[]>`
  - `type PageFlowRow = { path: string; views: number }`
  - `type PageDetail = { totals: Omit<PageRow, 'path' | 'title' | 'contentGroup'>; series: Array<{ bucket: string; views: number }>; scrollDepth: Array<{ threshold: number; rate: number }>; previousPages: PageFlowRow[]; nextPages: PageFlowRow[]; channels: Array<{ channel: string; views: number }> }`
  - `getPageDetail(executor, input: { filter; start; end; bucket: TimeBucket; path: string }): Promise<PageDetail>`
  - `type EventRow = { name: string; label: string; count: number; sessions: number }`, `getEvents(executor, input: { filter; start; end; limit?: number }): Promise<EventRow[]>`
  - `type NotFoundRow = { path: string; views: number; referrer: string }`, `getNotFound(executor, input: { filter; start; end; limit?: number }): Promise<NotFoundRow[]>`
  - 상수 `ENTRANCE_MARKER = '(entrance)'`, `EXIT_MARKER = '(exit)'`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/analytics/page-queries.test.ts
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

import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import {
  getEvents,
  getNotFound,
  getPageDetail,
  getPages,
} from '@/lib/server/analytics/queries/pages'
import { withAnalyticsTimeout } from '@/lib/server/analytics/queries/sql'
import { insertSession } from '@/tests/helpers/analytics-fixtures'
import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'

const range = {
  filter: DEFAULT_ANALYTICS_FILTER,
  start: new Date('2026-10-01T00:00:00.000Z'),
  end: new Date('2026-10-08T00:00:00.000Z'),
}

beforeEach(async () => {
  testDb.current = await createAnalyticsTestDb()
  const client = testDb.current.client
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e01',
    visitorId: '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d01',
    startedAt: '2026-10-02 01:00:00',
    channel: 'Organic Search',
    views: [
      {
        path: '/ko',
        at: '2026-10-02 01:00:00',
        engagementMs: 10_000,
        scroll: 80,
        title: '홈 | GDGoC Yonsei',
      },
      {
        path: '/ko/session/25-26',
        at: '2026-10-02 01:01:00',
        engagementMs: 30_000,
        scroll: 50,
      },
    ],
    events: [
      {
        name: 'cta',
        at: '2026-10-02 01:00:30',
        viewIndex: 0,
        label: 'join_instagram',
      },
      {
        name: 'outbound',
        at: '2026-10-02 01:02:00',
        viewIndex: 1,
        targetUrl: 'https://velog.io/x',
      },
    ],
  })
  await insertSession(client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e02',
    visitorId: '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d02',
    startedAt: '2026-10-03 10:00:00',
    referrerHost: 'velog.io',
    channel: 'Referral',
    views: [
      { path: '/ko/old-link', at: '2026-10-03 10:00:00', isNotFound: true },
      {
        path: '/ko',
        at: '2026-10-03 10:00:10',
        engagementMs: 20_000,
        scroll: 100,
        title: '홈 | GDGoC Yonsei',
      },
    ],
    events: [
      {
        name: 'cta',
        at: '2026-10-03 10:00:20',
        viewIndex: 1,
        label: 'join_instagram',
      },
    ],
  })
})

describe('getPages', () => {
  it('reports views, engagement, scroll, entrances and exits per path', async () => {
    const rows = await withAnalyticsTimeout((tx) => getPages(tx, range))
    expect(rows[0]).toEqual({
      path: '/ko',
      title: '홈',
      contentGroup: 'home',
      views: 2,
      users: 2,
      avgEngagementSeconds: 15,
      scroll75Rate: 1,
      entrances: 1,
      exits: 1,
      exitRate: 0.5,
    })
  })
})

describe('getPageDetail', () => {
  it('lists previous and next pages with entrance and exit markers', async () => {
    const detail = await withAnalyticsTimeout((tx) =>
      getPageDetail(tx, { ...range, bucket: 'day', path: '/ko' })
    )
    expect(detail.totals.views).toBe(2)
    expect(detail.previousPages).toEqual([
      { path: '(entrance)', views: 1 },
      { path: '/ko/old-link', views: 1 },
    ])
    expect(detail.nextPages).toEqual([
      { path: '(exit)', views: 1 },
      { path: '/ko/session/25-26', views: 1 },
    ])
    expect(detail.scrollDepth).toEqual([
      { threshold: 25, rate: 1 },
      { threshold: 50, rate: 1 },
      { threshold: 75, rate: 1 },
      { threshold: 90, rate: 0.5 },
      { threshold: 100, rate: 0.5 },
    ])
    expect(detail.channels).toEqual([
      { channel: 'Organic Search', views: 1 },
      { channel: 'Referral', views: 1 },
    ])
    expect(detail.series).toEqual([
      { bucket: '2026-10-02', views: 1 },
      { bucket: '2026-10-03', views: 1 },
    ])
  })
})

describe('getEvents', () => {
  it('groups events by name and label or target', async () => {
    const rows = await withAnalyticsTimeout((tx) => getEvents(tx, range))
    expect(rows).toEqual([
      { name: 'cta', label: 'join_instagram', count: 2, sessions: 2 },
      { name: 'outbound', label: 'https://velog.io/x', count: 1, sessions: 1 },
    ])
  })
})

describe('getNotFound', () => {
  it('lists 404 paths with where visitors came from', async () => {
    const rows = await withAnalyticsTimeout((tx) => getNotFound(tx, range))
    expect(rows).toEqual([
      { path: '/ko/old-link', views: 1, referrer: 'velog.io' },
    ])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/analytics/page-queries.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
// lib/server/analytics/queries/pages.ts
/**
 * 페이지 단위 보고서. 조회는 발생 시각으로 기간에 넣는다. 종료(exit)는 세션의 마지막 조회, 방문 시작은 sequence 1이다.
 * 제목은 마지막으로 수집된 문서 제목에서 사이트 접미사를 뗀 값이다.
 */
import 'server-only'

import { sql, type SQL } from 'drizzle-orm'
import {
  contentGroupOf,
  type ContentGroup,
} from '@/lib/analytics/content-groups'
import type { TimeBucket } from '@/lib/analytics/date-range'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import {
  bucketSql,
  pageConditions,
  selectRows,
  sessionConditions,
  timestampParam,
  whereAll,
  type QueryExecutor,
} from '@/lib/server/analytics/queries/sql'

export const ENTRANCE_MARKER = '(entrance)'
export const EXIT_MARKER = '(exit)'

const TITLE_SUFFIX = / \| GDGoC Yonsei$/

type RangeInput = { filter: AnalyticsFilter; start: Date; end: Date }

export type PageRow = {
  path: string
  title: string | null
  contentGroup: ContentGroup
  views: number
  users: number
  avgEngagementSeconds: number
  scroll75Rate: number
  entrances: number
  exits: number
  exitRate: number
}

export type PageFlowRow = { path: string; views: number }

export type PageDetail = {
  totals: Omit<PageRow, 'path' | 'title' | 'contentGroup'>
  series: Array<{ bucket: string; views: number }>
  scrollDepth: Array<{ threshold: number; rate: number }>
  previousPages: PageFlowRow[]
  nextPages: PageFlowRow[]
  channels: Array<{ channel: string; views: number }>
}

export type EventRow = {
  name: string
  label: string
  count: number
  sessions: number
}
export type NotFoundRow = { path: string; views: number; referrer: string }

/** 기간·세션·페이지 필터를 건 조회 집합(별칭 v, s)과 세션 안 마지막 순번(last_sequence). */
function filteredViews(input: RangeInput, extra: SQL[] = []): SQL {
  const conditions = [
    sql`v."occurredAt" >= ${timestampParam(input.start)}`,
    sql`v."occurredAt" < ${timestampParam(input.end)}`,
    ...sessionConditions(input.filter, 's'),
    ...pageConditions(input.filter, 'v'),
    ...extra,
  ]
  return sql`
    fv AS (
      SELECT v.*, s.channel, s."referrerHost",
        (SELECT max(sequence) FROM analytics_page_views lv WHERE lv."sessionId" = v."sessionId") AS last_sequence
      FROM analytics_page_views v
      JOIN analytics_sessions s ON s.id = v."sessionId"
      WHERE ${whereAll(conditions)}
    )`
}

type PageAggregate = {
  views: number
  users: number
  engagement_ms: number
  scroll75: number
  entrances: number
  exits: number
}

const PAGE_AGGREGATES = sql`
  count(*)::int AS views,
  count(DISTINCT fv."visitorId")::int AS users,
  coalesce(sum(fv."engagementMs"), 0)::float8 AS engagement_ms,
  count(*) FILTER (WHERE fv."maxScrollPercent" >= 75)::int AS scroll75,
  count(*) FILTER (WHERE fv.sequence = 1)::int AS entrances,
  count(*) FILTER (WHERE fv.sequence = fv.last_sequence)::int AS exits`

function toTotals(row: PageAggregate | undefined): PageDetail['totals'] {
  const views = Number(row?.views ?? 0)
  const exits = Number(row?.exits ?? 0)
  return {
    views,
    users: Number(row?.users ?? 0),
    avgEngagementSeconds:
      views > 0 ? Number(row?.engagement_ms ?? 0) / views / 1000 : 0,
    scroll75Rate: views > 0 ? Number(row?.scroll75 ?? 0) / views : 0,
    entrances: Number(row?.entrances ?? 0),
    exits,
    exitRate: views > 0 ? exits / views : 0,
  }
}

export async function getPages(
  executor: QueryExecutor,
  input: RangeInput & { limit?: number }
): Promise<PageRow[]> {
  const rows = await selectRows<
    PageAggregate & { path: string; title: string | null }
  >(
    executor,
    sql`
      WITH ${filteredViews(input)}
      SELECT fv.path,
        (array_agg(fv.title ORDER BY fv."occurredAt" DESC) FILTER (WHERE fv.title IS NOT NULL))[1] AS title,
        ${PAGE_AGGREGATES}
      FROM fv
      WHERE NOT fv."isNotFound"
      GROUP BY fv.path
      ORDER BY views DESC, fv.path
      LIMIT ${input.limit ?? 100}
    `
  )
  return rows.map((row) => ({
    path: row.path,
    title: row.title ? row.title.replace(TITLE_SUFFIX, '') : null,
    contentGroup: contentGroupOf(row.path),
    ...toTotals(row),
  }))
}

export async function getPageDetail(
  executor: QueryExecutor,
  input: RangeInput & { bucket: TimeBucket; path: string }
): Promise<PageDetail> {
  const onPath = [sql`v.path = ${input.path}`]
  const [totals] = await selectRows<PageAggregate>(
    executor,
    sql`WITH ${filteredViews(input, onPath)} SELECT ${PAGE_AGGREGATES} FROM fv`
  )
  const series = await selectRows<{ bucket: string; views: number }>(
    executor,
    sql`
      WITH ${filteredViews(input, onPath)}
      SELECT ${bucketSql(sql`fv."occurredAt"`, input.bucket)} AS bucket, count(*)::int AS views
      FROM fv GROUP BY 1 ORDER BY 1
    `
  )
  const [scroll] = await selectRows<Record<string, number>>(
    executor,
    sql`
      WITH ${filteredViews(input, onPath)}
      SELECT count(*)::int AS total,
        count(*) FILTER (WHERE "maxScrollPercent" >= 25)::int AS s25,
        count(*) FILTER (WHERE "maxScrollPercent" >= 50)::int AS s50,
        count(*) FILTER (WHERE "maxScrollPercent" >= 75)::int AS s75,
        count(*) FILTER (WHERE "maxScrollPercent" >= 90)::int AS s90,
        count(*) FILTER (WHERE "maxScrollPercent" >= 100)::int AS s100
      FROM fv
    `
  )
  const flow = (offset: -1 | 1, marker: string) =>
    selectRows<PageFlowRow>(
      executor,
      sql`
        WITH ${filteredViews(input, onPath)}
        SELECT coalesce(n.path, ${marker}) AS path, count(*)::int AS views
        FROM fv
        LEFT JOIN analytics_page_views n
          ON n."sessionId" = fv."sessionId" AND n.sequence = fv.sequence + ${offset}
        GROUP BY 1 ORDER BY views DESC, 1 LIMIT 10
      `
    )
  const [previousPages, nextPages] = [
    await flow(-1, ENTRANCE_MARKER),
    await flow(1, EXIT_MARKER),
  ]
  const channels = await selectRows<{ channel: string; views: number }>(
    executor,
    sql`
      WITH ${filteredViews(input, onPath)}
      SELECT fv.channel, count(*)::int AS views FROM fv GROUP BY 1 ORDER BY views DESC, 1
    `
  )

  const total = Number(scroll?.total ?? 0)
  return {
    totals: toTotals(totals),
    series: series.map((row) => ({
      bucket: row.bucket,
      views: Number(row.views),
    })),
    scrollDepth: [25, 50, 75, 90, 100].map((threshold) => ({
      threshold,
      rate: total > 0 ? Number(scroll?.[`s${threshold}`] ?? 0) / total : 0,
    })),
    previousPages: previousPages.map((row) => ({
      path: row.path,
      views: Number(row.views),
    })),
    nextPages: nextPages.map((row) => ({
      path: row.path,
      views: Number(row.views),
    })),
    channels: channels.map((row) => ({
      channel: row.channel,
      views: Number(row.views),
    })),
  }
}

export async function getEvents(
  executor: QueryExecutor,
  input: RangeInput & { limit?: number }
): Promise<EventRow[]> {
  const rows = await selectRows<EventRow>(
    executor,
    sql`
      SELECT e.name, coalesce(e.label, e."targetUrl", '(not set)') AS label,
        count(*)::int AS count, count(DISTINCT e."sessionId")::int AS sessions
      FROM analytics_events e
      JOIN analytics_sessions s ON s.id = e."sessionId"
      JOIN analytics_page_views v ON v.id = e."pageViewId"
      WHERE e.name <> 'web_vital'
        AND e."occurredAt" >= ${timestampParam(input.start)}
        AND e."occurredAt" < ${timestampParam(input.end)}
        AND ${whereAll([...sessionConditions(input.filter, 's'), ...pageConditions(input.filter, 'v')])}
      GROUP BY 1, 2
      ORDER BY count DESC, 1, 2
      LIMIT ${input.limit ?? 100}
    `
  )
  return rows.map((row) => ({
    ...row,
    count: Number(row.count),
    sessions: Number(row.sessions),
  }))
}

/** 유입 경로: 방문 시작 페이지면 외부 리퍼러(없으면 직접), 아니면 바로 앞의 사이트 안 페이지. */
export async function getNotFound(
  executor: QueryExecutor,
  input: RangeInput & { limit?: number }
): Promise<NotFoundRow[]> {
  const rows = await selectRows<NotFoundRow>(
    executor,
    sql`
      WITH ${filteredViews(input, [sql`v."isNotFound"`])}
      SELECT fv.path,
        CASE WHEN fv.sequence = 1 THEN coalesce(fv."referrerHost", '(direct)') ELSE coalesce(p.path, '(unknown)') END AS referrer,
        count(*)::int AS views
      FROM fv
      LEFT JOIN analytics_page_views p ON p."sessionId" = fv."sessionId" AND p.sequence = fv.sequence - 1
      GROUP BY 1, 2
      ORDER BY views DESC, 1, 2
      LIMIT ${input.limit ?? 100}
    `
  )
  return rows.map((row) => ({
    path: row.path,
    views: Number(row.views),
    referrer: row.referrer,
  }))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/lib/analytics/page-queries.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/server/analytics/queries/pages.ts tests/lib/analytics/page-queries.test.ts
git commit -m "feat(analytics): report pages, page flow, events and broken links"
```

---

### Task 6: Web Vitals, 리텐션 코호트, 실시간 쿼리

**Files:**

- Create: `lib/server/analytics/queries/vitals.ts`
- Create: `lib/server/analytics/queries/cohorts.ts`
- Create: `lib/server/analytics/queries/realtime.ts`
- Test: `tests/lib/analytics/vitals-cohorts-realtime.test.ts`

**Interfaces:**

- Consumes: Task 4 `sql.ts`, `WEB_VITAL_NAMES`, `WebVitalName`
- Produces:
  - `type VitalSummary = { metric: WebVitalName; p75: number | null; good: number; needsImprovement: number; poor: number; samples: number }`
  - `type WebVitalsReport = { summary: VitalSummary[]; series: Array<{ bucket: string; metric: WebVitalName; p75: number }>; byDevice: Array<{ deviceType: string; metric: WebVitalName; p75: number; samples: number }>; slowestPages: Array<{ path: string; metric: WebVitalName; p75: number; samples: number }> }`
  - `getWebVitals(executor, input: { filter; start; end; bucket: TimeBucket }): Promise<WebVitalsReport>`
  - `type CohortRow = { cohort: string; size: number; rates: number[] }`, `getRetention(executor, input: { filter; end: Date; weeks?: number }): Promise<CohortRow[]>`
  - `type RealtimeSnapshot = { activeVisitors: number; perMinute: Array<{ minutesAgo: number; views: number }>; activePages: Array<{ path: string; visitors: number }> }`, `getRealtime(executor, input: { now: Date; includeInternal: boolean }): Promise<RealtimeSnapshot>`

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/analytics/vitals-cohorts-realtime.test.ts
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

import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import { getRetention } from '@/lib/server/analytics/queries/cohorts'
import { getRealtime } from '@/lib/server/analytics/queries/realtime'
import { withAnalyticsTimeout } from '@/lib/server/analytics/queries/sql'
import { getWebVitals } from '@/lib/server/analytics/queries/vitals'
import { insertSession } from '@/tests/helpers/analytics-fixtures'
import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'

const sessionId = (n: number) =>
  `0b6f4a0e-3d0c-4a43-9a51-${String(n).padStart(12, '0')}`
const visitorId = (n: number) =>
  `6a0c2d84-5b8e-4d4f-a1a3-${String(n).padStart(12, '0')}`

beforeEach(async () => {
  testDb.current = await createAnalyticsTestDb()
})

describe('getWebVitals', () => {
  it('computes p75 and rating counts per metric', async () => {
    const lcp = [1000, 2000, 3000, 5000]
    for (const [index, value] of lcp.entries()) {
      await insertSession(testDb.current!.client, {
        id: sessionId(index + 1),
        visitorId: visitorId(index + 1),
        startedAt: '2026-10-02 01:00:00',
        deviceType: index < 2 ? 'mobile' : 'desktop',
        events: [
          {
            name: 'web_vital',
            at: '2026-10-02 01:00:05',
            metric: 'LCP',
            value,
            rating:
              value <= 2500
                ? 'good'
                : value <= 4000
                  ? 'needs-improvement'
                  : 'poor',
          },
        ],
      })
    }
    const report = await withAnalyticsTimeout((tx) =>
      getWebVitals(tx, {
        filter: DEFAULT_ANALYTICS_FILTER,
        start: new Date('2026-10-01T00:00:00Z'),
        end: new Date('2026-10-08T00:00:00Z'),
        bucket: 'day',
      })
    )
    expect(report.summary.find((row) => row.metric === 'LCP')).toEqual({
      metric: 'LCP',
      p75: 3500,
      good: 2,
      needsImprovement: 1,
      poor: 1,
      samples: 4,
    })
    expect(report.summary.find((row) => row.metric === 'INP')).toMatchObject({
      p75: null,
      samples: 0,
    })
    expect(report.byDevice).toContainEqual({
      deviceType: 'desktop',
      metric: 'LCP',
      p75: 4500,
      samples: 2,
    })
  })
})

describe('getRetention', () => {
  it('builds weekly cohorts from each visitor first session', async () => {
    // 코호트 주(서울 월요일 2026-09-28): 방문자 1·2. 방문자 1은 다음 주에도 방문.
    await insertSession(testDb.current!.client, {
      id: sessionId(1),
      visitorId: visitorId(1),
      startedAt: '2026-09-29 01:00:00',
    })
    await insertSession(testDb.current!.client, {
      id: sessionId(2),
      visitorId: visitorId(2),
      startedAt: '2026-09-30 01:00:00',
    })
    await insertSession(testDb.current!.client, {
      id: sessionId(3),
      visitorId: visitorId(1),
      startedAt: '2026-10-06 01:00:00',
      isNewVisitor: false,
    })
    const rows = await withAnalyticsTimeout((tx) =>
      getRetention(tx, {
        filter: DEFAULT_ANALYTICS_FILTER,
        end: new Date('2026-10-12T15:00:00Z'),
        weeks: 3,
      })
    )
    expect(rows).toEqual([{ cohort: '2026-09-28', size: 2, rates: [1, 0.5] }])
  })
})

describe('getRealtime', () => {
  it('counts visitors in the last five minutes and views per minute', async () => {
    await insertSession(testDb.current!.client, {
      id: sessionId(1),
      visitorId: visitorId(1),
      startedAt: '2026-10-14 04:57:00',
      views: [
        { path: '/ko', at: '2026-10-14 04:57:00' },
        { path: '/ko/session', at: '2026-10-14 04:59:30' },
      ],
    })
    await insertSession(testDb.current!.client, {
      id: sessionId(2),
      visitorId: visitorId(2),
      startedAt: '2026-10-14 04:40:00',
      views: [{ path: '/en', at: '2026-10-14 04:40:00' }],
    })
    const snapshot = await withAnalyticsTimeout((tx) =>
      getRealtime(tx, {
        now: new Date('2026-10-14T05:00:00Z'),
        includeInternal: false,
      })
    )
    expect(snapshot.activeVisitors).toBe(1)
    expect(snapshot.activePages).toEqual([{ path: '/ko/session', visitors: 1 }])
    expect(snapshot.perMinute).toHaveLength(30)
    expect(snapshot.perMinute.find((row) => row.minutesAgo === 0)?.views).toBe(
      1
    )
    expect(snapshot.perMinute.find((row) => row.minutesAgo === 20)?.views).toBe(
      1
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/analytics/vitals-cohorts-realtime.test.ts`
Expected: FAIL — modules not found

- [ ] **Step 3: Write the implementations**

```ts
// lib/server/analytics/queries/vitals.ts
/** Web Vitals 보고서. Google 평가와 같이 75번째 백분위(p75)를 대표값으로 쓴다. */
import 'server-only'

import { sql, type SQL } from 'drizzle-orm'
import type { TimeBucket } from '@/lib/analytics/date-range'
import { WEB_VITAL_NAMES, type WebVitalName } from '@/lib/analytics/events'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import {
  bucketSql,
  pageConditions,
  selectRows,
  sessionConditions,
  timestampParam,
  whereAll,
  type QueryExecutor,
} from '@/lib/server/analytics/queries/sql'

export type VitalSummary = {
  metric: WebVitalName
  p75: number | null
  good: number
  needsImprovement: number
  poor: number
  samples: number
}

export type WebVitalsReport = {
  summary: VitalSummary[]
  series: Array<{ bucket: string; metric: WebVitalName; p75: number }>
  byDevice: Array<{
    deviceType: string
    metric: WebVitalName
    p75: number
    samples: number
  }>
  slowestPages: Array<{
    path: string
    metric: WebVitalName
    p75: number
    samples: number
  }>
}

// 표본이 너무 적은 페이지는 순위를 왜곡하므로 뺀다.
const MIN_PAGE_SAMPLES = 5

function vitalEvents(input: {
  filter: AnalyticsFilter
  start: Date
  end: Date
}): SQL {
  return sql`
    ve AS (
      SELECT e.metric, e.value, e.rating, e.path, s."deviceType", e."occurredAt"
      FROM analytics_events e
      JOIN analytics_sessions s ON s.id = e."sessionId"
      JOIN analytics_page_views v ON v.id = e."pageViewId"
      WHERE e.name = 'web_vital'
        AND e."occurredAt" >= ${timestampParam(input.start)}
        AND e."occurredAt" < ${timestampParam(input.end)}
        AND ${whereAll([...sessionConditions(input.filter, 's'), ...pageConditions(input.filter, 'v')])}
    )`
}

const P75 = sql`percentile_cont(0.75) WITHIN GROUP (ORDER BY ve.value)::float8`

export async function getWebVitals(
  executor: QueryExecutor,
  input: { filter: AnalyticsFilter; start: Date; end: Date; bucket: TimeBucket }
): Promise<WebVitalsReport> {
  const summaryRows = await selectRows<{
    metric: WebVitalName
    p75: number
    good: number
    ni: number
    poor: number
    samples: number
  }>(
    executor,
    sql`
      WITH ${vitalEvents(input)}
      SELECT ve.metric, ${P75} AS p75,
        count(*) FILTER (WHERE ve.rating = 'good')::int AS good,
        count(*) FILTER (WHERE ve.rating = 'needs-improvement')::int AS ni,
        count(*) FILTER (WHERE ve.rating = 'poor')::int AS poor,
        count(*)::int AS samples
      FROM ve GROUP BY ve.metric
    `
  )
  const series = await selectRows<{
    bucket: string
    metric: WebVitalName
    p75: number
  }>(
    executor,
    sql`
      WITH ${vitalEvents(input)}
      SELECT ${bucketSql(sql`ve."occurredAt"`, input.bucket)} AS bucket, ve.metric, ${P75} AS p75
      FROM ve GROUP BY 1, 2 ORDER BY 1, 2
    `
  )
  const byDevice = await selectRows<{
    deviceType: string
    metric: WebVitalName
    p75: number
    samples: number
  }>(
    executor,
    sql`
      WITH ${vitalEvents(input)}
      SELECT ve."deviceType" AS "deviceType", ve.metric, ${P75} AS p75, count(*)::int AS samples
      FROM ve GROUP BY 1, 2 ORDER BY 1, 2
    `
  )
  const slowestPages = await selectRows<{
    path: string
    metric: WebVitalName
    p75: number
    samples: number
  }>(
    executor,
    sql`
      WITH ${vitalEvents(input)}
      SELECT ve.path, ve.metric, ${P75} AS p75, count(*)::int AS samples
      FROM ve WHERE ve.metric IN ('LCP', 'INP', 'CLS')
      GROUP BY 1, 2 HAVING count(*) >= ${MIN_PAGE_SAMPLES}
      ORDER BY p75 DESC LIMIT 20
    `
  )

  const byMetric = new Map(summaryRows.map((row) => [row.metric, row]))
  return {
    summary: WEB_VITAL_NAMES.map((metric) => {
      const row = byMetric.get(metric)
      return {
        metric,
        p75: row ? Number(row.p75) : null,
        good: Number(row?.good ?? 0),
        needsImprovement: Number(row?.ni ?? 0),
        poor: Number(row?.poor ?? 0),
        samples: Number(row?.samples ?? 0),
      }
    }),
    series: series.map((row) => ({ ...row, p75: Number(row.p75) })),
    byDevice: byDevice.map((row) => ({
      ...row,
      p75: Number(row.p75),
      samples: Number(row.samples),
    })),
    slowestPages: slowestPages.map((row) => ({
      ...row,
      p75: Number(row.p75),
      samples: Number(row.samples),
    })),
  }
}
```

```ts
// lib/server/analytics/queries/cohorts.ts
/**
 * 주간 리텐션. 방문자의 첫 세션 주(서울 월요일 시작)가 코호트이고, n주 차 비율은 그 주에 다시 온 방문자 비율이다.
 * 첫 세션은 기간과 무관하게 전체 기록에서 찾는다(기간 시작 전에 처음 온 사람을 신규로 잘못 세지 않게).
 */
import 'server-only'

import { sql } from 'drizzle-orm'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import {
  selectRows,
  sessionConditions,
  timestampParam,
  whereAll,
  type QueryExecutor,
} from '@/lib/server/analytics/queries/sql'

export type CohortRow = { cohort: string; size: number; rates: number[] }

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export async function getRetention(
  executor: QueryExecutor,
  input: { filter: AnalyticsFilter; end: Date; weeks?: number }
): Promise<CohortRow[]> {
  const weeks = input.weeks ?? 12
  const since = new Date(input.end.getTime() - weeks * WEEK_MS)
  const conditions = whereAll(
    sessionConditions({ ...input.filter, visitor: null }, 's')
  )

  const rows = await selectRows<{
    cohort: string
    week: number
    visitors: number
  }>(
    executor,
    sql`
      WITH visits AS (
        SELECT s."visitorId", date_trunc('week', s."startedAt" + interval '9 hours') AS week
        FROM analytics_sessions s
        WHERE s."startedAt" < ${timestampParam(input.end)} AND ${conditions}
        GROUP BY 1, 2
      ),
      firsts AS (
        SELECT "visitorId", min(week) AS cohort FROM visits GROUP BY 1
      )
      SELECT to_char(f.cohort, 'YYYY-MM-DD') AS cohort,
        (extract(epoch from (v.week - f.cohort)) / 604800)::int AS week,
        count(DISTINCT v."visitorId")::int AS visitors
      FROM firsts f JOIN visits v ON v."visitorId" = f."visitorId"
      WHERE f.cohort >= date_trunc('week', ${timestampParam(since)} + interval '9 hours')
      GROUP BY 1, 2 ORDER BY 1, 2
    `
  )

  const cohorts = new Map<string, Map<number, number>>()
  for (const row of rows) {
    const weeksOf = cohorts.get(row.cohort) ?? new Map<number, number>()
    weeksOf.set(Number(row.week), Number(row.visitors))
    cohorts.set(row.cohort, weeksOf)
  }

  const endWeekMs = input.end.getTime()
  return [...cohorts.entries()].map(([cohort, byWeek]) => {
    const size = byWeek.get(0) ?? 0
    // 아직 끝나지 않은 주는 비율에 넣지 않는다.
    const elapsed = Math.floor(
      (endWeekMs - (Date.parse(`${cohort}T00:00:00Z`) - 9 * 3600 * 1000)) /
        WEEK_MS
    )
    const rates = Array.from(
      { length: Math.max(1, Math.min(elapsed, weeks)) },
      (_, week) => (size > 0 ? (byWeek.get(week) ?? 0) / size : 0)
    )
    return { cohort, size, rates }
  })
}
```

```ts
// lib/server/analytics/queries/realtime.ts
/** 실시간 카드. 최근 5분 안에 조회가 있었던 방문자를 활성으로 본다(GA4 실시간은 30분이지만 동아리 규모에서는 5분이 더 생생하다). */
import 'server-only'

import { sql } from 'drizzle-orm'
import {
  selectRows,
  timestampParam,
  type QueryExecutor,
} from '@/lib/server/analytics/queries/sql'

export type RealtimeSnapshot = {
  activeVisitors: number
  perMinute: Array<{ minutesAgo: number; views: number }>
  activePages: Array<{ path: string; visitors: number }>
}

const MINUTE_MS = 60_000

export async function getRealtime(
  executor: QueryExecutor,
  input: { now: Date; includeInternal: boolean }
): Promise<RealtimeSnapshot> {
  const fiveMinutesAgo = new Date(input.now.getTime() - 5 * MINUTE_MS)
  const thirtyMinutesAgo = new Date(input.now.getTime() - 30 * MINUTE_MS)
  const internal = input.includeInternal ? sql`TRUE` : sql`NOT s."isInternal"`

  const [active] = await selectRows<{ visitors: number }>(
    executor,
    sql`
      SELECT count(DISTINCT v."visitorId")::int AS visitors
      FROM analytics_page_views v JOIN analytics_sessions s ON s.id = v."sessionId"
      WHERE v."occurredAt" >= ${timestampParam(fiveMinutesAgo)} AND ${internal}
    `
  )
  // 방문자마다 가장 최근에 본 페이지만 센다.
  const pages = await selectRows<{ path: string; visitors: number }>(
    executor,
    sql`
      SELECT latest.path, count(*)::int AS visitors FROM (
        SELECT DISTINCT ON (v."visitorId") v.path
        FROM analytics_page_views v JOIN analytics_sessions s ON s.id = v."sessionId"
        WHERE v."occurredAt" >= ${timestampParam(fiveMinutesAgo)} AND ${internal}
        ORDER BY v."visitorId", v."occurredAt" DESC
      ) latest
      GROUP BY 1 ORDER BY visitors DESC, 1 LIMIT 5
    `
  )
  const minutes = await selectRows<{ minutes_ago: number; views: number }>(
    executor,
    sql`
      SELECT floor(extract(epoch from (${timestampParam(input.now)} - v."occurredAt")) / 60)::int AS minutes_ago,
        count(*)::int AS views
      FROM analytics_page_views v JOIN analytics_sessions s ON s.id = v."sessionId"
      WHERE v."occurredAt" >= ${timestampParam(thirtyMinutesAgo)} AND ${internal}
      GROUP BY 1
    `
  )

  const byMinute = new Map(
    minutes.map((row) => [Number(row.minutes_ago), Number(row.views)])
  )
  return {
    activeVisitors: Number(active?.visitors ?? 0),
    perMinute: Array.from({ length: 30 }, (_, index) => {
      const minutesAgo = 29 - index
      return { minutesAgo, views: byMinute.get(minutesAgo) ?? 0 }
    }),
    activePages: pages.map((row) => ({
      path: row.path,
      visitors: Number(row.visitors),
    })),
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/lib/analytics/vitals-cohorts-realtime.test.ts`
Expected: PASS. 코호트 경계가 하루 어긋나면 `date_trunc('week', …)`에 넘기는 값이 서울 기준(+9시간)인지 확인한다.

- [ ] **Step 5: Commit**

```bash
git add lib/server/analytics/queries tests/lib/analytics/vitals-cohorts-realtime.test.ts
git commit -m "feat(analytics): report web vitals, weekly retention and realtime activity"
```

---

### Task 7: 서비스 계층, CSV 내보내기·실시간 라우트

**Files:**

- Create: `lib/analytics/messages.ts`
- Create: `lib/server/services/admin/analytics.ts`
- Create: `app/api/admin/analytics/export/route.ts`
- Create: `app/api/admin/analytics/realtime/route.ts`
- Test: `tests/lib/server/services/analytics.test.ts`

**Interfaces:**

- Consumes: Task 2~6 전부, `authorize`, `fail`/`ok`/`ServiceResult`/`Actor`, `logger`, `getWebActor`, `privateJson`/`serviceFailureResponse` (`lib/server/http.ts` — 이름은 파일에서 확인한다), `toCsv`
- Produces (모두 `ServiceResult`, `now` 기본값 `new Date()`):
  - `type SeriesPoint = { bucket: string } & DerivedSessionMetrics`
  - `type AnalyticsOverview = { range: DateRange; collectingSince: string | null; totals: DerivedSessionMetrics; previousTotals: DerivedSessionMetrics | null; series: SeriesPoint[]; previousSeries: SeriesPoint[] | null; channels: Array<{ name: string } & DerivedSessionMetrics>; devices: Array<{ name: string } & DerivedSessionMetrics>; topPages: PageRow[] }`
  - `getAnalyticsOverview(actor, filter, now?)`
  - `type AnalyticsAcquisition = { channels; channelSeries: Array<Record<string, number | string>>; channelOrder: string[]; sources: Array<{ source: string; medium: string; channel: string } & DerivedSessionMetrics>; referrers; campaigns; landingPages }`, `getAnalyticsAcquisition(actor, filter, now?)`
  - `type AnalyticsEngagement = { pages: PageRow[]; events: EventRow[]; notFound: NotFoundRow[] }`, `getAnalyticsEngagement(actor, filter, now?)`
  - `getAnalyticsPageDetail(actor, filter, path, now?)` → `ServiceResult<PageDetail & { range: DateRange }>`
  - `type AnalyticsAudience = { newVsReturning: Array<{ bucket: string; newUsers: number; returningUsers: number }>; retention: CohortRow[]; devices; browsers; operatingSystems; screens; languages; countries; hourWeekday: Array<{ weekday: number; hour: number; sessions: number }> }`, `getAnalyticsAudience(actor, filter, now?)`
  - `getAnalyticsWebVitals(actor, filter, now?)` → `ServiceResult<WebVitalsReport>`
  - `getAnalyticsRealtime(actor, includeInternal, now?)` → `ServiceResult<RealtimeSnapshot>`
  - `ANALYTICS_TABLE_REPORTS` 튜플(`channels sources referrers campaigns landing_pages devices browsers os screens countries languages pages events not_found web_vitals explore`), `type AnalyticsTableReport`
  - `type ExploreInput = { dimensions: SessionDimension[]; metrics: SessionMetricKey[]; limit: number }`, `parseExploreInput(params: SearchParamsRecord): ExploreInput`
  - `type AnalyticsTable = { columns: string[]; rows: Array<Record<string, string | number | null>> }`, `getAnalyticsTable(actor, report, filter, explore?, now?)`
  - `lib/analytics/messages.ts`: `ANALYTICS_TIMEOUT_MESSAGE` (영문 서비스 실패 문구. 클라이언트 오류 카드가 이 값을 알아보고 `analyticsTimeout` 번역으로 바꾼다)

- [ ] **Step 1: Write the failing test**

```ts
// tests/lib/server/services/analytics.test.ts
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

import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import * as sessions from '@/lib/server/analytics/queries/sessions'
import {
  getAnalyticsOverview,
  getAnalyticsTable,
  parseExploreInput,
} from '@/lib/server/services/admin/analytics'
import type { Actor } from '@/lib/server/services/admin/types'
import { insertSession } from '@/tests/helpers/analytics-fixtures'
import { createAnalyticsTestDb } from '@/tests/helpers/analytics-test-db'

const NOW = new Date('2026-10-14T05:00:00.000Z')
const actor = (
  role: Actor['role'],
  scopes: Actor['scopes'] = 'session'
): Actor => ({
  userId: `user-${role}`,
  role,
  scopes,
  via: scopes === 'session' ? 'web' : 'mcp',
})

beforeEach(async () => {
  testDb.current = await createAnalyticsTestDb()
  await insertSession(testDb.current.client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e01',
    visitorId: '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d01',
    startedAt: '2026-10-13 01:00:00',
    channel: 'Organic Search',
    views: [
      { path: '/ko', at: '2026-10-13 01:00:00', engagementMs: 4_000 },
      { path: '/ko/calendar', at: '2026-10-13 01:01:00', engagementMs: 9_000 },
    ],
  })
  await insertSession(testDb.current.client, {
    id: '0b6f4a0e-3d0c-4a43-9a51-7b0b3c2f8e02',
    visitorId: '6a0c2d84-5b8e-4d4f-a1a3-2f9e7c5b1d02',
    startedAt: '2026-09-10 01:00:00',
  })
})

describe('analytics service', () => {
  it('rejects unverified accounts', async () => {
    await expect(
      getAnalyticsOverview(actor('UNVERIFIED'), DEFAULT_ANALYTICS_FILTER, NOW)
    ).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
  })

  it('builds the overview with zero-filled series and the previous period', async () => {
    const result = await getAnalyticsOverview(
      actor('MEMBER'),
      DEFAULT_ANALYTICS_FILTER,
      NOW
    )
    if (!result.ok) throw new Error(result.message)
    expect(result.data.totals).toMatchObject({
      sessions: 1,
      views: 2,
      engagementRate: 1,
    })
    expect(result.data.previousTotals).toMatchObject({
      sessions: 1,
      engagementRate: 0,
    })
    expect(result.data.series).toHaveLength(28)
    expect(result.data.series.at(-2)).toMatchObject({
      bucket: '2026-10-13',
      sessions: 1,
    })
    expect(result.data.series.at(-1)).toMatchObject({
      bucket: '2026-10-14',
      sessions: 0,
      engagementRate: 0,
    })
    expect(result.data.collectingSince).toBe('2026-09-10T01:00:00.000Z')
    expect(result.data.channels[0]).toMatchObject({
      name: 'Organic Search',
      sessions: 1,
    })
  })

  it('skips the previous period when comparison is off', async () => {
    const result = await getAnalyticsOverview(
      actor('MEMBER'),
      { ...DEFAULT_ANALYTICS_FILTER, compare: false },
      NOW
    )
    expect(result.ok && result.data.previousTotals).toBeNull()
  })

  it('turns a statement timeout into a friendly failure', async () => {
    const spy = vi
      .spyOn(sessions, 'aggregateSessions')
      .mockRejectedValueOnce(
        Object.assign(new Error('canceling statement'), { code: '57014' })
      )
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(
      getAnalyticsOverview(actor('MEMBER'), DEFAULT_ANALYTICS_FILTER, NOW)
    ).resolves.toMatchObject({
      ok: false,
      code: 'INTERNAL',
      message: expect.stringContaining('shorter date range'),
    })
    spy.mockRestore()
    consoleError.mockRestore()
  })

  it('serves table reports including explore', async () => {
    const pages = await getAnalyticsTable(
      actor('CORE'),
      'pages',
      DEFAULT_ANALYTICS_FILTER,
      undefined,
      NOW
    )
    expect(pages.ok && pages.data.rows.map((row) => row.path)).toEqual([
      '/ko',
      '/ko/calendar',
    ])

    const explore = await getAnalyticsTable(
      actor('CORE'),
      'explore',
      DEFAULT_ANALYTICS_FILTER,
      parseExploreInput({
        dims: 'channel,deviceType',
        metrics: 'sessions,engagementRate',
      }),
      NOW
    )
    expect(explore.ok && explore.data).toEqual({
      columns: ['channel', 'deviceType', 'sessions', 'engagementRate'],
      rows: [
        {
          channel: 'Organic Search',
          deviceType: 'desktop',
          sessions: 1,
          engagementRate: 1,
        },
      ],
    })
  })

  it('needs only the read scope for MCP tokens', async () => {
    const result = await getAnalyticsTable(
      actor('MEMBER', ['gyms:read']),
      'channels',
      DEFAULT_ANALYTICS_FILTER,
      undefined,
      NOW
    )
    expect(result.ok).toBe(true)
  })
})

describe('parseExploreInput', () => {
  it('keeps known values, caps at two dimensions and falls back to defaults', () => {
    expect(
      parseExploreInput({
        dims: 'channel,os,browser',
        metrics: 'users,bogus',
        limit: '9999',
      })
    ).toEqual({
      dimensions: ['channel', 'os'],
      metrics: ['users'],
      limit: 500,
    })
    expect(parseExploreInput({})).toEqual({
      dimensions: ['channel'],
      metrics: ['users', 'sessions', 'engagementRate', 'avgEngagementSeconds'],
      limit: 100,
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/lib/server/services/analytics.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the service**

```ts
// lib/analytics/messages.ts
/** 서비스 실패 문구 중 화면이 알아보고 번역해야 하는 것. 서버·클라이언트 공용. */
export const ANALYTICS_TIMEOUT_MESSAGE =
  'The analytics query took too long. Try a shorter date range.'
```

```ts
// lib/server/services/admin/analytics.ts
/**
 * 분석 화면·CSV·MCP가 공유하는 읽기 서비스. 권한(get analyticsPage)을 확인하고 한 트랜잭션 안에서 쿼리를 묶는다.
 * 시간 초과(57014)는 기간을 줄이라는 실패로, 그 밖의 예외는 로그를 남기고 INTERNAL로 바꾼다.
 */
import 'server-only'

import {
  bucketKeys,
  resolveDateRange,
  type DateRange,
} from '@/lib/analytics/date-range'
import type {
  AnalyticsFilter,
  SearchParamsRecord,
} from '@/lib/analytics/filters'
import {
  EMPTY_SESSION_METRICS,
  SESSION_METRIC_KEYS,
  deriveSessionMetrics,
  type DerivedSessionMetrics,
  type SessionMetricKey,
} from '@/lib/analytics/metrics'
import {
  getRetention,
  type CohortRow,
} from '@/lib/server/analytics/queries/cohorts'
import {
  getEvents,
  getNotFound,
  getPageDetail,
  getPages,
  type EventRow,
  type NotFoundRow,
  type PageDetail,
  type PageRow,
} from '@/lib/server/analytics/queries/pages'
import {
  getRealtime,
  type RealtimeSnapshot,
} from '@/lib/server/analytics/queries/realtime'
import {
  SESSION_DIMENSIONS,
  aggregateSessions,
  collectingSince,
  type SessionDimension,
  type SessionMetricRow,
} from '@/lib/server/analytics/queries/sessions'
import {
  isQueryTimeout,
  withAnalyticsTimeout,
  type QueryExecutor,
} from '@/lib/server/analytics/queries/sql'
import {
  getWebVitals,
  type WebVitalsReport,
} from '@/lib/server/analytics/queries/vitals'
import { logger } from '@/lib/server/logger'
import { authorize } from '@/lib/server/services/admin/authorize'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import { ANALYTICS_TIMEOUT_MESSAGE } from '@/lib/analytics/messages'

export type SeriesPoint = { bucket: string } & DerivedSessionMetrics
type Named = { name: string } & DerivedSessionMetrics

async function runAnalyticsRead<T>(
  actor: Actor,
  scope: string,
  work: (tx: QueryExecutor) => Promise<T>
): Promise<ServiceResult<T>> {
  const authorization = authorize(actor, 'get', 'analyticsPage')
  if (!authorization.ok) return authorization
  try {
    return ok(await withAnalyticsTimeout(work))
  } catch (error) {
    logger.error(scope, error)
    return fail(
      'INTERNAL',
      isQueryTimeout(error)
        ? ANALYTICS_TIMEOUT_MESSAGE
        : 'Failed to load analytics'
    )
  }
}

function named(rows: SessionMetricRow[], dimension: SessionDimension): Named[] {
  return rows.map((row) => ({
    name: row.dimensions[dimension] ?? '',
    ...deriveSessionMetrics(row.metrics),
  }))
}

function fillSeries(rows: SessionMetricRow[], keys: string[]): SeriesPoint[] {
  const byBucket = new Map(
    rows.map((row) => [row.dimensions.date, row.metrics])
  )
  return keys.map((bucket) => ({
    bucket,
    ...deriveSessionMetrics(byBucket.get(bucket) ?? EMPTY_SESSION_METRICS),
  }))
}

function totalsOf(rows: SessionMetricRow[]): DerivedSessionMetrics {
  return deriveSessionMetrics(rows[0]?.metrics ?? EMPTY_SESSION_METRICS)
}

export type AnalyticsOverview = {
  range: DateRange
  collectingSince: string | null
  totals: DerivedSessionMetrics
  previousTotals: DerivedSessionMetrics | null
  series: SeriesPoint[]
  previousSeries: SeriesPoint[] | null
  channels: Named[]
  devices: Named[]
  topPages: PageRow[]
}

export function getAnalyticsOverview(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<AnalyticsOverview>> {
  const range = resolveDateRange(filter, now)
  const base = { filter, bucket: range.bucket }
  const current = { ...base, start: range.start, end: range.end }
  const previous = {
    ...base,
    start: range.previousStart,
    end: range.previousEnd,
  }

  return runAnalyticsRead(actor, 'analytics.overview', async (tx) => {
    const totals = await aggregateSessions(tx, { ...current, dimensions: [] })
    const series = await aggregateSessions(tx, {
      ...current,
      dimensions: ['date'],
    })
    const channels = await aggregateSessions(tx, {
      ...current,
      dimensions: ['channel'],
      limit: 8,
    })
    const devices = await aggregateSessions(tx, {
      ...current,
      dimensions: ['deviceType'],
    })
    const topPages = await getPages(tx, {
      filter,
      start: range.start,
      end: range.end,
      limit: 8,
    })
    const since = await collectingSince(tx)
    const previousTotals = filter.compare
      ? await aggregateSessions(tx, { ...previous, dimensions: [] })
      : null
    const previousSeries = filter.compare
      ? await aggregateSessions(tx, { ...previous, dimensions: ['date'] })
      : null

    return {
      range,
      collectingSince: since?.toISOString() ?? null,
      totals: totalsOf(totals),
      previousTotals: previousTotals ? totalsOf(previousTotals) : null,
      series: fillSeries(
        series,
        bucketKeys(range.start, range.end, range.bucket)
      ),
      previousSeries: previousSeries
        ? fillSeries(
            previousSeries,
            bucketKeys(range.previousStart, range.previousEnd, range.bucket)
          )
        : null,
      channels: named(channels, 'channel'),
      devices: named(devices, 'deviceType'),
      topPages,
    }
  })
}

export type AnalyticsAcquisition = {
  channels: Named[]
  channelSeries: Array<Record<string, number | string>>
  channelOrder: string[]
  sources: Array<
    { source: string; medium: string; channel: string } & DerivedSessionMetrics
  >
  referrers: Named[]
  campaigns: Array<
    { campaign: string; source: string; medium: string } & DerivedSessionMetrics
  >
  landingPages: Named[]
}

// 범주 색은 8개뿐이라 상위 7개 채널 밖은 "Other"로 접는다.
const MAX_SERIES = 7

export function getAnalyticsAcquisition(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<AnalyticsAcquisition>> {
  const range = resolveDateRange(filter, now)
  const input = {
    filter,
    bucket: range.bucket,
    start: range.start,
    end: range.end,
  }

  return runAnalyticsRead(actor, 'analytics.acquisition', async (tx) => {
    const channels = named(
      await aggregateSessions(tx, { ...input, dimensions: ['channel'] }),
      'channel'
    )
    const byDate = await aggregateSessions(tx, {
      ...input,
      dimensions: ['date', 'channel'],
    })
    const sources = await aggregateSessions(tx, {
      ...input,
      dimensions: ['source', 'medium', 'channel'],
      limit: 50,
    })
    const referrers = await aggregateSessions(tx, {
      ...input,
      dimensions: ['referrer'],
      limit: 30,
    })
    const campaigns = await aggregateSessions(tx, {
      ...input,
      dimensions: ['campaign', 'source', 'medium'],
      limit: 30,
    })
    const landing = await aggregateSessions(tx, {
      ...input,
      dimensions: ['landingPath'],
      limit: 30,
    })

    const channelOrder = channels.slice(0, MAX_SERIES).map((row) => row.name)
    const hasOther = channels.length > MAX_SERIES
    const keys = bucketKeys(range.start, range.end, range.bucket)
    const channelSeries = keys.map((bucket) => {
      const point: Record<string, number | string> = { bucket }
      for (const name of channelOrder) point[name] = 0
      if (hasOther) point.Other = 0
      for (const row of byDate) {
        if (row.dimensions.date !== bucket) continue
        const name = channelOrder.includes(row.dimensions.channel!)
          ? row.dimensions.channel!
          : 'Other'
        point[name] = Number(point[name] ?? 0) + row.metrics.sessions
      }
      return point
    })

    return {
      channels,
      channelSeries,
      channelOrder: hasOther ? [...channelOrder, 'Other'] : channelOrder,
      sources: sources.map((row) => ({
        source: row.dimensions.source!,
        medium: row.dimensions.medium!,
        channel: row.dimensions.channel!,
        ...deriveSessionMetrics(row.metrics),
      })),
      referrers: named(referrers, 'referrer').filter(
        (row) => row.name !== '(direct)'
      ),
      campaigns: campaigns
        .filter((row) => row.dimensions.campaign !== '(not set)')
        .map((row) => ({
          campaign: row.dimensions.campaign!,
          source: row.dimensions.source!,
          medium: row.dimensions.medium!,
          ...deriveSessionMetrics(row.metrics),
        })),
      landingPages: named(landing, 'landingPath'),
    }
  })
}

export type AnalyticsEngagement = {
  pages: PageRow[]
  events: EventRow[]
  notFound: NotFoundRow[]
}

export function getAnalyticsEngagement(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<AnalyticsEngagement>> {
  const range = resolveDateRange(filter, now)
  const input = { filter, start: range.start, end: range.end }
  return runAnalyticsRead(actor, 'analytics.engagement', async (tx) => ({
    pages: await getPages(tx, input),
    events: await getEvents(tx, input),
    notFound: await getNotFound(tx, input),
  }))
}

export function getAnalyticsPageDetail(
  actor: Actor,
  filter: AnalyticsFilter,
  path: string,
  now: Date = new Date()
): Promise<ServiceResult<PageDetail & { range: DateRange }>> {
  const range = resolveDateRange(filter, now)
  return runAnalyticsRead(actor, 'analytics.page-detail', async (tx) => {
    const detail = await getPageDetail(tx, {
      filter,
      start: range.start,
      end: range.end,
      bucket: range.bucket,
      path,
    })
    const byBucket = new Map(
      detail.series.map((point) => [point.bucket, point.views])
    )
    return {
      ...detail,
      series: bucketKeys(range.start, range.end, range.bucket).map(
        (bucket) => ({ bucket, views: byBucket.get(bucket) ?? 0 })
      ),
      range,
    }
  })
}

export type AnalyticsAudience = {
  newVsReturning: Array<{
    bucket: string
    newUsers: number
    returningUsers: number
  }>
  retention: CohortRow[]
  devices: Named[]
  browsers: Named[]
  operatingSystems: Named[]
  screens: Named[]
  languages: Named[]
  countries: Named[]
  hourWeekday: Array<{ weekday: number; hour: number; sessions: number }>
}

export function getAnalyticsAudience(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<AnalyticsAudience>> {
  const range = resolveDateRange(filter, now)
  const input = {
    filter,
    bucket: range.bucket,
    start: range.start,
    end: range.end,
  }
  const by = (tx: QueryExecutor, dimension: SessionDimension, limit = 10) =>
    aggregateSessions(tx, { ...input, dimensions: [dimension], limit }).then(
      (rows) => named(rows, dimension)
    )

  return runAnalyticsRead(actor, 'analytics.audience', async (tx) => {
    const visitorRows = await aggregateSessions(tx, {
      ...input,
      dimensions: ['date', 'visitorType'],
    })
    const heat = await aggregateSessions(tx, {
      ...input,
      dimensions: ['weekday', 'hour'],
    })
    return {
      newVsReturning: bucketKeys(range.start, range.end, range.bucket).map(
        (bucket) => {
          const of = (type: string) =>
            visitorRows.find(
              (row) =>
                row.dimensions.date === bucket &&
                row.dimensions.visitorType === type
            )?.metrics.users ?? 0
          return {
            bucket,
            newUsers: of('new'),
            returningUsers: of('returning'),
          }
        }
      ),
      retention: await getRetention(tx, { filter, end: range.end }),
      devices: await by(tx, 'deviceType'),
      browsers: await by(tx, 'browser'),
      operatingSystems: await by(tx, 'os'),
      screens: await by(tx, 'screen'),
      languages: await by(tx, 'language'),
      countries: await by(tx, 'country', 20),
      hourWeekday: heat.map((row) => ({
        weekday: Number(row.dimensions.weekday),
        hour: Number(row.dimensions.hour),
        sessions: row.metrics.sessions,
      })),
    }
  })
}

export function getAnalyticsWebVitals(
  actor: Actor,
  filter: AnalyticsFilter,
  now: Date = new Date()
): Promise<ServiceResult<WebVitalsReport>> {
  const range = resolveDateRange(filter, now)
  return runAnalyticsRead(actor, 'analytics.web-vitals', (tx) =>
    getWebVitals(tx, {
      filter,
      start: range.start,
      end: range.end,
      bucket: range.bucket,
    })
  )
}

export function getAnalyticsRealtime(
  actor: Actor,
  includeInternal: boolean,
  now: Date = new Date()
): Promise<ServiceResult<RealtimeSnapshot>> {
  return runAnalyticsRead(actor, 'analytics.realtime', (tx) =>
    getRealtime(tx, { now, includeInternal })
  )
}

export const ANALYTICS_TABLE_REPORTS = [
  'channels',
  'sources',
  'referrers',
  'campaigns',
  'landing_pages',
  'devices',
  'browsers',
  'os',
  'screens',
  'countries',
  'languages',
  'pages',
  'events',
  'not_found',
  'web_vitals',
  'explore',
] as const

export type AnalyticsTableReport = (typeof ANALYTICS_TABLE_REPORTS)[number]

export type ExploreInput = {
  dimensions: SessionDimension[]
  metrics: SessionMetricKey[]
  limit: number
}

const DEFAULT_EXPLORE: ExploreInput = {
  dimensions: ['channel'],
  metrics: ['users', 'sessions', 'engagementRate', 'avgEngagementSeconds'],
  limit: 100,
}

function listParam<T extends string>(
  value: string | string[] | undefined,
  options: readonly T[]
): T[] {
  if (typeof value !== 'string') return []
  return value
    .split(',')
    .filter((item): item is T => (options as readonly string[]).includes(item))
}

/** 탐색은 차원 최대 2개. 잘못된 값은 버리고, 남는 것이 없으면 기본값을 쓴다. */
export function parseExploreInput(params: SearchParamsRecord): ExploreInput {
  const dimensions = [
    ...new Set(listParam(params.dims, SESSION_DIMENSIONS)),
  ].slice(0, 2)
  const metrics = [...new Set(listParam(params.metrics, SESSION_METRIC_KEYS))]
  const limit = Number(typeof params.limit === 'string' ? params.limit : NaN)
  return {
    dimensions: dimensions.length > 0 ? dimensions : DEFAULT_EXPLORE.dimensions,
    metrics: metrics.length > 0 ? metrics : DEFAULT_EXPLORE.metrics,
    limit:
      Number.isInteger(limit) && limit > 0
        ? Math.min(limit, 500)
        : DEFAULT_EXPLORE.limit,
  }
}

export type AnalyticsTable = {
  columns: string[]
  rows: Array<Record<string, string | number | null>>
}

const ROUND = (value: number) => Math.round(value * 10_000) / 10_000

function sessionTable(
  rows: SessionMetricRow[],
  dimensions: SessionDimension[],
  metrics: readonly SessionMetricKey[]
): AnalyticsTable {
  return {
    columns: [...dimensions, ...metrics],
    rows: rows.map((row) => {
      const derived = deriveSessionMetrics(row.metrics)
      return {
        ...Object.fromEntries(
          dimensions.map((dimension) => [
            dimension,
            row.dimensions[dimension] ?? null,
          ])
        ),
        ...Object.fromEntries(
          metrics.map((metric) => [metric, ROUND(derived[metric])])
        ),
      }
    }),
  }
}

const SESSION_REPORT_DIMENSIONS: Partial<
  Record<AnalyticsTableReport, SessionDimension[]>
> = {
  channels: ['channel'],
  sources: ['source', 'medium'],
  referrers: ['referrer'],
  campaigns: ['campaign', 'source', 'medium'],
  landing_pages: ['landingPath'],
  devices: ['deviceType'],
  browsers: ['browser'],
  os: ['os'],
  screens: ['screen'],
  countries: ['country'],
  languages: ['language'],
}

/** CSV와 MCP `analytics_report`가 쓰는 평평한 표. */
export function getAnalyticsTable(
  actor: Actor,
  report: AnalyticsTableReport,
  filter: AnalyticsFilter,
  explore: ExploreInput = DEFAULT_EXPLORE,
  now: Date = new Date()
): Promise<ServiceResult<AnalyticsTable>> {
  const range = resolveDateRange(filter, now)
  const input = { filter, start: range.start, end: range.end }

  return runAnalyticsRead(
    actor,
    `analytics.table.${report}`,
    async (tx): Promise<AnalyticsTable> => {
      const sessionDimensions =
        report === 'explore'
          ? explore.dimensions
          : SESSION_REPORT_DIMENSIONS[report]
      if (sessionDimensions) {
        const rows = await aggregateSessions(tx, {
          ...input,
          bucket: range.bucket,
          dimensions: sessionDimensions,
          limit: report === 'explore' ? explore.limit : 200,
        })
        return sessionTable(
          rows,
          sessionDimensions,
          report === 'explore' ? explore.metrics : SESSION_METRIC_KEYS
        )
      }
      if (report === 'pages') {
        const rows = await getPages(tx, { ...input, limit: 500 })
        return {
          columns: [
            'path',
            'title',
            'contentGroup',
            'views',
            'users',
            'avgEngagementSeconds',
            'scroll75Rate',
            'entrances',
            'exits',
            'exitRate',
          ],
          rows: rows.map((row) => ({
            ...row,
            avgEngagementSeconds: ROUND(row.avgEngagementSeconds),
            scroll75Rate: ROUND(row.scroll75Rate),
            exitRate: ROUND(row.exitRate),
          })),
        }
      }
      if (report === 'events') {
        return {
          columns: ['name', 'label', 'count', 'sessions'],
          rows: await getEvents(tx, { ...input, limit: 500 }),
        }
      }
      if (report === 'not_found') {
        return {
          columns: ['path', 'referrer', 'views'],
          rows: await getNotFound(tx, { ...input, limit: 500 }),
        }
      }
      const vitals = await getWebVitals(tx, { ...input, bucket: range.bucket })
      return {
        columns: [
          'metric',
          'p75',
          'good',
          'needsImprovement',
          'poor',
          'samples',
        ],
        rows: vitals.summary.map((row) => ({
          ...row,
          p75: row.p75 === null ? null : ROUND(row.p75),
        })),
      }
    }
  )
}
```

- [ ] **Step 4: Write the API routes**

```ts
// app/api/admin/analytics/export/route.ts
/** 분석 표를 CSV로 내려준다. 세션 쿠키로 행위자를 정하고 권한은 서비스가 확인한다. */
import type { NextRequest } from 'next/server'
import { toCsv } from '@/lib/analytics/csv'
import { parseAnalyticsFilter } from '@/lib/analytics/filters'
import { privateError, serviceFailureResponse } from '@/lib/server/http'
import {
  ANALYTICS_TABLE_REPORTS,
  getAnalyticsTable,
  parseExploreInput,
  type AnalyticsTableReport,
} from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export async function GET(request: NextRequest) {
  const actor = await getWebActor()
  if (!actor) return privateError('Unauthorized', 401)

  const params = Object.fromEntries(request.nextUrl.searchParams)
  const report = params.report as AnalyticsTableReport
  if (!(ANALYTICS_TABLE_REPORTS as readonly string[]).includes(report)) {
    return privateError('Unknown report', 400)
  }

  const result = await getAnalyticsTable(
    actor,
    report,
    parseAnalyticsFilter(params),
    parseExploreInput(params)
  )
  if (!result.ok) return serviceFailureResponse(result)

  return new Response(toCsv(result.data.columns, result.data.rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="gdgoc-analytics-${report}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
```

```ts
// app/api/admin/analytics/realtime/route.ts
/** 개요 탭의 실시간 카드가 30초마다 부른다. */
import type { NextRequest } from 'next/server'
import {
  privateError,
  privateJson,
  serviceFailureResponse,
} from '@/lib/server/http'
import { getAnalyticsRealtime } from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export async function GET(request: NextRequest) {
  const actor = await getWebActor()
  if (!actor) return privateError('Unauthorized', 401)
  const result = await getAnalyticsRealtime(
    actor,
    request.nextUrl.searchParams.get('internal') === '1'
  )
  return result.ok ? privateJson(result.data) : serviceFailureResponse(result)
}
```

- [ ] **Step 5: Run tests**

Run: `pnpm test tests/lib/server/services/analytics.test.ts && pnpm test:types`
Expected: PASS. `vi.spyOn(sessions, 'aggregateSessions')`가 ESM 바인딩 때문에 서비스 호출을 바꾸지 못하면, 테스트 상단에서 `vi.mock('@/lib/server/analytics/queries/sessions', async (importOriginal) => ({ ...(await importOriginal()), aggregateSessions: vi.fn((...args) => actual(...args)) }))` 형태로 바꿔 시간 초과 케이스에서만 거부값을 준다.

- [ ] **Step 6: Commit**

```bash
git add lib/analytics/messages.ts lib/server/services/admin/analytics.ts app/api/admin/analytics tests/lib/server/services/analytics.test.ts
git commit -m "feat(analytics): serve dashboard reports, CSV export and realtime polling"
```

---

### Task 8: 차트 기반(색 토큰, 형식, 차트 컴포넌트)

**Files:**

- Modify: `package.json` (recharts)
- Modify: `app/admin.css` (차트 색 변수)
- Create: `app/(admin)/admin/analytics/_lib/format.ts`
- Create: `app/(admin)/admin/analytics/_components/chart-frame.tsx`
- Create: `app/(admin)/admin/analytics/_components/time-series-chart.tsx`
- Create: `app/(admin)/admin/analytics/_components/bar-list.tsx`
- Create: `app/(admin)/admin/analytics/_components/metric-tile.tsx`
- Create: `app/(admin)/admin/analytics/_components/heatmap-grid.tsx`
- Create: `app/(admin)/admin/analytics/_components/rating-bar.tsx`
- Test: `tests/components/analytics-charts.test.tsx`
- Test: `tests/lib/analytics/format.test.ts`

**Interfaces:**

- Produces:
  - `format.ts`: `formatNumber(value: number, locale: Locale): string`(1,284 / 12.9K), `formatPercent(value: number, locale: Locale): string`(0.4567→"45.7%"), `formatDuration(seconds: number): string`("1m 05s", "42s"), `formatSignedPercent(value: number | null, locale: Locale): string | null`, `formatBucketLabel(bucket: string, locale: Locale): string`, `formatVital(metric: WebVitalName, value: number | null): string`
  - `ChartFrame({ title, description?, summary, table, children, actions? })` — `table: { columns: string[]; rows: Array<Array<string | number>> }`
  - `TimeSeriesChart({ data, series, xKey, valueFormat, compareKey?, compareLabel?, height? })` — `series: Array<{ key: string; label: string }>` (색은 순서대로 `--chart-1..8`)
  - `BarList({ items, valueLabel, format })` — `items: Array<{ label: string; value: number; href?: string; secondary?: string }>`
  - `MetricTile({ label, value, delta, goodWhenUp, spark })`
  - `HeatmapGrid({ rows, columns, values, format })` — `values[rowIndex][columnIndex]`
  - `RatingBar({ good, needsImprovement, poor, labels })`

- [ ] **Step 1: Add Recharts and the color tokens**

Run: `pnpm add recharts@^3.10.1`
Expected: dependencies에 `"recharts": "^3.10.1"`. 설치 정책 때문에 거부되면 허용되는 가장 최신 3.x를 쓴다.

`app/admin.css`의 라이트 `:root` 블록 끝(`--danger-soft` 다음)에 추가:

```css
/* 차트 범주 색은 고정 순서다. dataviz 검증: 카드 면 #ffffff에서 CVD·명도 기준 통과, 슬롯 3·4·5는 3:1 미만이라 표 보기가 필수다. */
--chart-1: #2a78d6;
--chart-2: #eb6834;
--chart-3: #1baf7a;
--chart-4: #eda100;
--chart-5: #e87ba4;
--chart-6: #008300;
--chart-7: #6250d6;
--chart-8: #e34948;
--chart-compare: #9b958f;
--chart-grid: #ecebe9;
--chart-seq-1: #e6f1fb;
--chart-seq-2: #b7d3f6;
--chart-seq-3: #6da7ec;
--chart-seq-4: #2a78d6;
--chart-seq-5: #184f95;
/* Web Vitals 등급 전용 상태 색. 항상 아이콘과 라벨을 함께 쓴다. */
--status-good: #0ca30c;
--status-warning: #fab219;
--status-critical: #d03b3b;
```

다크 `.dark` 블록 끝(`--danger-soft` 다음)에 추가:

```css
--chart-1: #3987e5;
--chart-2: #d95926;
--chart-3: #199e70;
--chart-4: #c98500;
--chart-5: #d55181;
--chart-6: #008300;
--chart-7: #9085e9;
--chart-8: #e66767;
--chart-compare: #6f6963;
--chart-grid: #2f2f34;
--chart-seq-1: #16324a;
--chart-seq-2: #1c5cab;
--chart-seq-3: #2a78d6;
--chart-seq-4: #5598e7;
--chart-seq-5: #9ec5f4;
--status-good: #0ca30c;
--status-warning: #fab219;
--status-critical: #d03b3b;
```

- [ ] **Step 2: Write the failing tests**

```ts
// tests/lib/analytics/format.test.ts
import { describe, expect, it } from 'vitest'
import {
  formatBucketLabel,
  formatDuration,
  formatNumber,
  formatPercent,
  formatSignedPercent,
  formatVital,
} from '@/app/(admin)/admin/analytics/_lib/format'

describe('analytics formatting', () => {
  it('compacts large numbers and formats rates', () => {
    expect(formatNumber(1284, 'en')).toBe('1,284')
    expect(formatNumber(12_900, 'en')).toBe('12.9K')
    expect(formatPercent(0.4567, 'en')).toBe('45.7%')
    expect(formatSignedPercent(0.123, 'en')).toBe('+12.3%')
    expect(formatSignedPercent(-0.05, 'en')).toBe('-5.0%')
    expect(formatSignedPercent(null, 'en')).toBeNull()
  })

  it('formats durations, buckets and vitals', () => {
    expect(formatDuration(42.4)).toBe('42s')
    expect(formatDuration(65)).toBe('1m 05s')
    expect(formatBucketLabel('2026-10-14', 'en')).toBe('Oct 14')
    expect(formatBucketLabel('2026-10-14T09', 'ko')).toBe('09시')
    expect(formatVital('LCP', 2345)).toBe('2.35 s')
    expect(formatVital('INP', 180)).toBe('180 ms')
    expect(formatVital('CLS', 0.0512)).toBe('0.05')
    expect(formatVital('LCP', null)).toBe('—')
  })
})
```

```tsx
// tests/components/analytics-charts.test.tsx
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import HeatmapGrid from '@/app/(admin)/admin/analytics/_components/heatmap-grid'
import MetricTile from '@/app/(admin)/admin/analytics/_components/metric-tile'
import RatingBar from '@/app/(admin)/admin/analytics/_components/rating-bar'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'

function withI18n(node: React.ReactNode) {
  return (
    <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
      {node}
    </AdminI18nProvider>
  )
}

describe('ChartFrame', () => {
  it('describes the chart and swaps to a table view', async () => {
    render(
      withI18n(
        <ChartFrame
          title={'Trend'}
          summary={'Sessions rose from 10 to 20'}
          table={{
            columns: ['Date', 'Sessions'],
            rows: [
              ['Oct 13', 10],
              ['Oct 14', 20],
            ],
          }}
        >
          <div data-testid={'chart'} />
        </ChartFrame>
      )
    )
    expect(
      screen.getByRole('figure', { name: 'Trend' })
    ).toHaveAccessibleDescription('Sessions rose from 10 to 20')
    await userEvent.click(screen.getByRole('button', { name: 'Show as table' }))
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(screen.queryByTestId('chart')).toBeNull()
  })
})

describe('BarList', () => {
  it('lists values as text with proportional bars', () => {
    render(
      <BarList
        items={[
          { label: 'Organic Search', value: 30 },
          { label: 'Direct', value: 15 },
        ]}
        valueLabel={'Sessions'}
        format={(value) => String(value)}
      />
    )
    const items = screen.getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Organic Search')
    expect(items[0]).toHaveTextContent('30')
    expect(items[1]!.querySelector('[data-bar]')).toHaveStyle({ width: '50%' })
  })
})

describe('MetricTile', () => {
  it('shows the delta direction with words, not color alone', () => {
    render(
      withI18n(
        <MetricTile
          label={'Bounce rate'}
          value={'40%'}
          delta={0.1}
          goodWhenUp={false}
          spark={[1, 2, 3]}
        />
      )
    )
    expect(screen.getByText('+10.0%')).toHaveAttribute('data-tone', 'bad')
    expect(screen.getByText('vs previous period')).toBeInTheDocument()
  })
})

describe('HeatmapGrid', () => {
  it('labels every cell for screen readers', () => {
    render(
      <HeatmapGrid
        rows={['Mon']}
        columns={['0', '1']}
        values={[[0, 4]]}
        format={(value) => `${value} sessions`}
      />
    )
    expect(
      screen.getByRole('cell', { name: 'Mon 1: 4 sessions' })
    ).toBeInTheDocument()
  })
})

describe('RatingBar', () => {
  it('prints each rating share with its label', () => {
    render(
      <RatingBar
        good={6}
        needsImprovement={3}
        poor={1}
        labels={{
          good: 'Good',
          needsImprovement: 'Needs improvement',
          poor: 'Poor',
        }}
      />
    )
    expect(screen.getByText('Good 60%')).toBeInTheDocument()
    expect(screen.getByText('Poor 10%')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test tests/lib/analytics/format.test.ts tests/components/analytics-charts.test.tsx`
Expected: FAIL — modules not found

- [ ] **Step 4: Write the implementation**

```ts
// app/(admin)/admin/analytics/_lib/format.ts
/** 분석 화면의 숫자·비율·시간 표시. 큰 값은 압축(12.9K)하고 표와 축은 같은 형식을 쓴다. */
import type { WebVitalName } from '@/lib/analytics/events'
import { WEB_VITAL_THRESHOLDS } from '@/lib/analytics/metrics'
import { toIntlLocale, type Locale } from '@/lib/i18n'

export function formatNumber(value: number, locale: Locale): string {
  const options: Intl.NumberFormatOptions =
    Math.abs(value) >= 10_000
      ? { notation: 'compact', maximumFractionDigits: 1 }
      : { maximumFractionDigits: 1 }
  return new Intl.NumberFormat(toIntlLocale(locale), options).format(value)
}

export function formatPercent(value: number, locale: Locale): string {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatSignedPercent(
  value: number | null,
  locale: Locale
): string | null {
  if (value === null) return null
  const formatted = formatPercent(Math.abs(value), locale)
  return `${value < 0 ? '-' : '+'}${formatted}`
}

export function formatDuration(seconds: number): string {
  const rounded = Math.round(seconds)
  if (rounded < 60) return `${rounded}s`
  return `${Math.floor(rounded / 60)}m ${String(rounded % 60).padStart(2, '0')}s`
}

/** 구간 키(YYYY-MM-DD 또는 YYYY-MM-DDTHH)를 축 라벨로. */
export function formatBucketLabel(bucket: string, locale: Locale): string {
  if (bucket.length === 13) {
    const hour = bucket.slice(11, 13)
    return locale === 'ko' ? `${hour}시` : `${hour}:00`
  }
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${bucket}T00:00:00Z`))
}

export function formatVital(
  metric: WebVitalName,
  value: number | null
): string {
  if (value === null) return '—'
  if (WEB_VITAL_THRESHOLDS[metric].unit === 'score') return value.toFixed(2)
  return value >= 1000
    ? `${(value / 1000).toFixed(2)} s`
    : `${Math.round(value)} ms`
}
```

```tsx
// app/(admin)/admin/analytics/_components/chart-frame.tsx
'use client'

/**
 * 모든 차트를 감싸는 카드. 요약 문장을 figure 설명으로 연결하고, 같은 데이터를 표로 바꿔 볼 수 있게 한다.
 * 라이트 테마의 일부 범주 색이 대비 3:1 미만이라 표 보기는 선택이 아니라 필수다.
 */
import { useId, useState, type ReactNode } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

export type ChartTable = {
  columns: string[]
  rows: Array<Array<string | number>>
}

export default function ChartFrame({
  title,
  description,
  summary,
  table,
  actions,
  children,
}: {
  title: string
  description?: string
  summary: string
  table: ChartTable
  actions?: ReactNode
  children: ReactNode
}) {
  const { t } = useAdminI18n()
  const [showTable, setShowTable] = useState(false)
  const titleId = useId()
  const summaryId = useId()

  return (
    <figure
      className={'admin-card flex min-w-0 flex-col gap-3'}
      aria-labelledby={titleId}
      aria-describedby={summaryId}
    >
      <div className={'flex flex-wrap items-start justify-between gap-2'}>
        <div className={'flex min-w-0 flex-col gap-0.5'}>
          <figcaption id={titleId} className={'type-title text-ink'}>
            {title}
          </figcaption>
          {description && (
            <p className={'type-caption text-ink-muted'}>{description}</p>
          )}
        </div>
        <div className={'flex flex-wrap items-center gap-2'}>
          {actions}
          <button
            type={'button'}
            className={'admin-btn-ghost'}
            onClick={() => setShowTable((value) => !value)}
          >
            {showTable ? t('analyticsShowChart') : t('analyticsShowTable')}
          </button>
        </div>
      </div>
      <p id={summaryId} className={'sr-only'}>
        {summary}
      </p>
      {showTable ? (
        <div className={'overflow-x-auto'}>
          <table className={'type-body-sm w-full border-collapse text-left'}>
            <thead>
              <tr className={'border-hairline text-ink-muted border-b'}>
                {table.columns.map((column) => (
                  <th
                    key={column}
                    scope={'col'}
                    className={'px-2 py-2 font-medium'}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={'border-hairline border-b last:border-b-0'}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={'text-ink px-2 py-2 tabular-nums'}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </figure>
  )
}
```

```tsx
// app/(admin)/admin/analytics/_components/time-series-chart.tsx
'use client'

/**
 * 시간 추이 선 차트. 시리즈 색은 넘긴 순서대로 --chart-1..8을 고정 배정한다(필터로 순서가 바뀌어도 같은 이름은
 * 호출부가 같은 순서로 넘긴다). 비교 기간은 점선 대신 회색 실선이다. 축은 하나만 쓴다.
 */
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useReducedMotion } from 'motion/react'
import { formatBucketLabel } from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

export type SeriesSpec = { key: string; label: string }

export default function TimeSeriesChart({
  data,
  series,
  xKey,
  valueFormat,
  compareKey,
  compareLabel,
  height = 280,
}: {
  data: Array<Record<string, string | number>>
  series: SeriesSpec[]
  xKey: string
  valueFormat: (value: number) => string
  compareKey?: string
  compareLabel?: string
  height?: number
}) {
  const { locale } = useAdminI18n()
  const reduceMotion = useReducedMotion() ?? false
  const showLegend = series.length + (compareKey ? 1 : 0) > 1

  return (
    <div style={{ height }} className={'w-full'}>
      <ResponsiveContainer width={'100%'} height={'100%'}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke={'var(--chart-grid)'} vertical={false} />
          <XAxis
            dataKey={xKey}
            tickFormatter={(value: string) => formatBucketLabel(value, locale)}
            tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--hairline)' }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(value: number) => valueFormat(value)}
            tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={56}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: 'var(--control-border)', strokeWidth: 1 }}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--hairline)',
              borderRadius: 8,
              color: 'var(--ink)',
            }}
            labelFormatter={(value) => formatBucketLabel(String(value), locale)}
            formatter={(value) => valueFormat(Number(value))}
          />
          {showLegend && (
            <Legend
              iconType={'plainline'}
              wrapperStyle={{ color: 'var(--ink-secondary)', fontSize: 12 }}
            />
          )}
          {compareKey && (
            <Line
              type={'monotone'}
              dataKey={compareKey}
              name={compareLabel}
              stroke={'var(--chart-compare)'}
              strokeWidth={2}
              dot={false}
              isAnimationActive={!reduceMotion}
            />
          )}
          {series.map((spec, index) => (
            <Line
              key={spec.key}
              type={'monotone'}
              dataKey={spec.key}
              name={spec.label}
              stroke={`var(--chart-${(index % 8) + 1})`}
              strokeWidth={2}
              strokeLinecap={'round'}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--surface)' }}
              isAnimationActive={!reduceMotion}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

```tsx
// app/(admin)/admin/analytics/_components/bar-list.tsx
/** 상위 N개 항목을 가로 막대와 숫자로 보여 준다. 값이 글자로 늘 보여 툴팁 없이도 읽힌다. 막대는 한 색(슬롯 1)이다. */
import Link from 'next/link'

export type BarListItem = {
  label: string
  value: number
  href?: string
  secondary?: string
}

export default function BarList({
  items,
  valueLabel,
  format,
}: {
  items: BarListItem[]
  valueLabel: string
  format: (value: number) => string
}) {
  const max = Math.max(0, ...items.map((item) => item.value))
  return (
    <ul className={'flex flex-col gap-1'} aria-label={valueLabel}>
      {items.map((item) => {
        const width = max > 0 ? `${(item.value / max) * 100}%` : '0%'
        const label = (
          <span className={'text-ink truncate'} title={item.label}>
            {item.label}
          </span>
        )
        return (
          <li
            key={item.label}
            className={
              'relative flex min-h-11 items-center gap-3 rounded-sm px-2'
            }
          >
            <span
              data-bar
              aria-hidden={'true'}
              className={
                'absolute inset-y-1.5 left-0 rounded-r-[4px] opacity-15'
              }
              style={{ width, background: 'var(--chart-1)' }}
            />
            <span
              className={'type-body-sm relative flex min-w-0 flex-1 flex-col'}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  className={'hover:underline focus-visible:underline'}
                >
                  {label}
                </Link>
              ) : (
                label
              )}
              {item.secondary && (
                <span className={'type-caption text-ink-muted truncate'}>
                  {item.secondary}
                </span>
              )}
            </span>
            <span className={'type-body-sm text-ink relative tabular-nums'}>
              {format(item.value)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
```

```tsx
// app/(admin)/admin/analytics/_components/metric-tile.tsx
'use client'

/** 지표 타일: 값, 직전 기간 대비 증감(화살표+부호+문구), 추이 스파크라인. 증감 색은 방향 × "올라가면 좋은 지표인지"로 정한다. */
import { ArrowDownRightIcon, ArrowUpRightIcon } from '@heroicons/react/20/solid'
import { formatSignedPercent } from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const points = values
    .map(
      (value, index) =>
        `${(index / (values.length - 1)) * 100},${28 - ((value - min) / span) * 24}`
    )
    .join(' ')
  return (
    <svg
      viewBox={'0 0 100 30'}
      preserveAspectRatio={'none'}
      className={'h-8 w-full'}
      aria-hidden={'true'}
    >
      <polyline
        points={points}
        fill={'none'}
        stroke={'var(--chart-1)'}
        strokeWidth={2}
        vectorEffect={'non-scaling-stroke'}
      />
    </svg>
  )
}

export default function MetricTile({
  label,
  value,
  delta,
  goodWhenUp,
  spark,
}: {
  label: string
  value: string
  delta: number | null
  goodWhenUp: boolean
  spark: number[]
}) {
  const { t, locale } = useAdminI18n()
  const signed = formatSignedPercent(delta, locale)
  const tone =
    delta === null || delta === 0
      ? 'neutral'
      : delta > 0 === goodWhenUp
        ? 'good'
        : 'bad'
  const Icon =
    delta !== null && delta < 0 ? ArrowDownRightIcon : ArrowUpRightIcon

  return (
    <div
      className={
        'border-hairline bg-surface flex min-w-0 flex-col gap-2 rounded-lg border p-4'
      }
    >
      <span className={'type-caption text-ink-muted'}>{label}</span>
      <span className={'type-heading-1 text-ink'}>{value}</span>
      {signed && (
        <span className={'type-caption flex flex-wrap items-center gap-1'}>
          <span
            data-tone={tone}
            className={
              tone === 'good'
                ? 'text-success'
                : tone === 'bad'
                  ? 'text-danger'
                  : 'text-ink-muted'
            }
          >
            <Icon className={'mr-0.5 inline size-4'} aria-hidden={'true'} />
            {signed}
          </span>
          <span className={'text-ink-muted'}>{t('analyticsVsPrevious')}</span>
        </span>
      )}
      <Sparkline values={spark} />
    </div>
  )
}
```

`MetricTile` 테스트는 `getByText('+10.0%')`로 찾으므로 아이콘과 숫자가 같은 `<span>` 안에 있어도 텍스트 일치는 숫자만으로 된다(아이콘은 텍스트가 없다).

```tsx
// app/(admin)/admin/analytics/_components/heatmap-grid.tsx
/** 요일×시간 같은 2차원 강도. 한 색상의 5단계 순차 색(--chart-seq-1..5)을 쓰고 칸마다 접근 가능한 이름을 둔다. */

function step(value: number, max: number) {
  if (max <= 0 || value <= 0) return 0
  return Math.min(5, Math.ceil((value / max) * 5))
}

export default function HeatmapGrid({
  rows,
  columns,
  values,
  format,
}: {
  rows: string[]
  columns: string[]
  values: number[][]
  format: (value: number) => string
}) {
  const max = Math.max(0, ...values.flat())
  return (
    <div className={'overflow-x-auto'}>
      <table className={'border-separate border-spacing-0.5'}>
        <thead>
          <tr>
            <td />
            {columns.map((column) => (
              <th
                key={column}
                scope={'col'}
                className={
                  'type-caption text-ink-muted px-0.5 font-normal tabular-nums'
                }
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row}>
              <th
                scope={'row'}
                className={
                  'type-caption text-ink-muted pr-2 text-left font-normal'
                }
              >
                {row}
              </th>
              {columns.map((column, columnIndex) => {
                const value = values[rowIndex]?.[columnIndex] ?? 0
                const level = step(value, max)
                return (
                  <td
                    key={column}
                    aria-label={`${row} ${column}: ${format(value)}`}
                    title={`${row} ${column}: ${format(value)}`}
                    className={'size-5 min-w-5 rounded-[3px]'}
                    style={{
                      background:
                        level === 0
                          ? 'var(--surface-sunken)'
                          : `var(--chart-seq-${level})`,
                    }}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

```tsx
// app/(admin)/admin/analytics/_components/rating-bar.tsx
/** Web Vitals 등급 분포 막대. 상태 색과 함께 아이콘·라벨·비율을 글자로 보여 색만으로 뜻을 전하지 않는다. */
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/20/solid'

export default function RatingBar({
  good,
  needsImprovement,
  poor,
  labels,
}: {
  good: number
  needsImprovement: number
  poor: number
  labels: { good: string; needsImprovement: string; poor: string }
}) {
  const total = good + needsImprovement + poor
  const parts = [
    {
      key: 'good',
      value: good,
      label: labels.good,
      color: 'var(--status-good)',
      Icon: CheckCircleIcon,
    },
    {
      key: 'ni',
      value: needsImprovement,
      label: labels.needsImprovement,
      color: 'var(--status-warning)',
      Icon: ExclamationTriangleIcon,
    },
    {
      key: 'poor',
      value: poor,
      label: labels.poor,
      color: 'var(--status-critical)',
      Icon: XCircleIcon,
    },
  ]
  const share = (value: number) =>
    total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div className={'flex flex-col gap-2'}>
      <div
        className={'flex h-3 w-full gap-0.5 overflow-hidden rounded-[4px]'}
        aria-hidden={'true'}
      >
        {parts.map((part) =>
          part.value > 0 ? (
            <span
              key={part.key}
              style={{ width: `${share(part.value)}%`, background: part.color }}
            />
          ) : null
        )}
      </div>
      <ul
        className={
          'type-caption text-ink-secondary flex flex-wrap gap-x-3 gap-y-1'
        }
      >
        {parts.map((part) => (
          <li key={part.key} className={'flex items-center gap-1'}>
            <part.Icon
              className={'size-4'}
              style={{ color: part.color }}
              aria-hidden={'true'}
            />
            <span>{`${part.label} ${share(part.value)}%`}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test tests/lib/analytics/format.test.ts tests/components/analytics-charts.test.tsx`
Expected: PASS. `formatNumber(12_900, 'en')`가 `12.9K`가 아니면 `toIntlLocale('en')` 값(`en-US`)을 확인한다.

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml app/admin.css "app/(admin)/admin/analytics" tests/lib/analytics/format.test.ts tests/components/analytics-charts.test.tsx
git commit -m "feat(analytics): add validated chart colors and accessible chart components"
```

---

### Task 9: 분석 레이아웃 — 권한, 필터 바, 탭

**Files:**

- Create: `app/(admin)/admin/analytics/layout.tsx`
- Create: `app/(admin)/admin/analytics/_components/filter-bar.tsx`
- Create: `app/(admin)/admin/analytics/_components/analytics-tabs.tsx`
- Create: `app/(admin)/admin/analytics/_components/report-states.tsx`
- Create: `app/(admin)/admin/analytics/_lib/read-filter.ts`
- Test: `tests/components/analytics-filter-bar.test.tsx`

**Interfaces:**

- Consumes: `parseAnalyticsFilter`, `analyticsFilterToSearchParams`, `RANGE_PRESETS`, `DEVICE_TYPES`, `CHANNELS`, `CONTENT_GROUPS`, `requirePermission`, `useAdminI18n`, `localizeAdminHref`
- Produces:
  - `readAnalyticsFilter(searchParams: Promise<SearchParamsRecord>): Promise<AnalyticsFilter>` (`_lib/read-filter.ts`, `connection()` 포함)
  - `ANALYTICS_TABS: Array<{ path: string; label: AdminMessageKey }>`
  - `ReportError({ message })`, `ReportEmpty({ collectingSince })` (`report-states.tsx`)
  - 기본 export `FilterBar`, `AnalyticsTabs`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/analytics-filter-bar.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  search: 'range=7d&device=mobile',
  pathname: '/ko/admin/analytics/acquisition',
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace }),
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}))

import FilterBar from '@/app/(admin)/admin/analytics/_components/filter-bar'
import AnalyticsTabs from '@/app/(admin)/admin/analytics/_components/analytics-tabs'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'

function renderWithI18n(node: React.ReactNode) {
  return render(
    <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
      {node}
    </AdminI18nProvider>
  )
}

beforeEach(() => {
  navigation.replace.mockClear()
  navigation.search = 'range=7d&device=mobile'
})

describe('FilterBar', () => {
  it('shows the current filter and writes changes to the URL', async () => {
    renderWithI18n(<FilterBar />)
    expect(screen.getByLabelText('Date range')).toHaveValue('7d')
    expect(screen.getByLabelText('Device')).toHaveValue('mobile')

    await userEvent.selectOptions(
      screen.getByLabelText('Channel'),
      'Organic Search'
    )
    expect(navigation.replace).toHaveBeenLastCalledWith(
      '/ko/admin/analytics/acquisition?range=7d&channel=Organic+Search&device=mobile',
      { scroll: false }
    )
  })

  it('reveals custom dates only for a custom range', async () => {
    renderWithI18n(<FilterBar />)
    expect(screen.queryByLabelText('From')).toBeNull()
    await userEvent.selectOptions(screen.getByLabelText('Date range'), 'custom')
    expect(navigation.replace).toHaveBeenLastCalledWith(
      '/ko/admin/analytics/acquisition?range=custom&device=mobile',
      {
        scroll: false,
      }
    )
  })

  it('resets every filter', async () => {
    renderWithI18n(<FilterBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(navigation.replace).toHaveBeenLastCalledWith(
      '/ko/admin/analytics/acquisition',
      { scroll: false }
    )
  })
})

describe('AnalyticsTabs', () => {
  it('keeps the filter query on every tab and marks the current one', () => {
    renderWithI18n(<AnalyticsTabs />)
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '/en/admin/analytics?range=7d&device=mobile'
    )
    expect(screen.getByRole('link', { name: 'Acquisition' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/components/analytics-filter-bar.test.tsx`
Expected: FAIL — modules not found

- [ ] **Step 3: Write the implementation**

```ts
// app/(admin)/admin/analytics/_lib/read-filter.ts
/** 분석 페이지의 searchParams를 필터로 읽는다. 관리자 화면은 요청마다 새로 그리므로 connection()으로 동적 렌더링을 명시한다. */
import 'server-only'

import { connection } from 'next/server'
import {
  parseAnalyticsFilter,
  type AnalyticsFilter,
  type SearchParamsRecord,
} from '@/lib/analytics/filters'

export async function readAnalyticsFilter(
  searchParams: Promise<SearchParamsRecord>
): Promise<AnalyticsFilter> {
  await connection()
  return parseAnalyticsFilter(await searchParams)
}
```

```tsx
// app/(admin)/admin/analytics/_components/report-states.tsx
'use client'

/** 보고서의 빈 상태와 오류 상태. 오류는 그 탭 안에만 보이고 필터 바·탭은 그대로 쓸 수 있다. */
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import AdminEmptyState from '@/app/components/admin/empty-state'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { formatAdminDate } from '@/lib/admin-i18n'
import { ANALYTICS_TIMEOUT_MESSAGE } from '@/lib/analytics/messages'
import { fillTemplate } from '@/lib/format/text'

export function ReportError({ message }: { message: string }) {
  const { t } = useAdminI18n()
  return (
    <div
      role={'alert'}
      className={'admin-card border-danger/40 flex items-start gap-3'}
    >
      <ExclamationTriangleIcon
        className={'text-danger size-5 shrink-0'}
        aria-hidden={'true'}
      />
      <p className={'type-body-sm text-ink'}>
        {message === ANALYTICS_TIMEOUT_MESSAGE
          ? t('analyticsTimeout')
          : message}
      </p>
    </div>
  )
}

export function ReportEmpty({
  collectingSince,
}: {
  collectingSince: string | null
}) {
  const { t, locale } = useAdminI18n()
  const hint = collectingSince
    ? fillTemplate(t('analyticsCollectingSince'), {
        date: formatAdminDate(collectingSince, locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'Asia/Seoul',
        }),
      })
    : t('analyticsNoDataHint')
  return <AdminEmptyState title={t('analyticsNoData')} description={hint} />
}
```

`fillTemplate`는 `lib/format/text.ts`의 기존 함수(`fillTemplate(template, values)`)다.

```tsx
// app/(admin)/admin/analytics/_components/analytics-tabs.tsx
'use client'

/** 보고서 탭. 탭을 옮겨도 필터 쿼리를 그대로 들고 간다. */
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { localizeAdminHref, type AdminMessageKey } from '@/lib/admin-i18n'
import { cn } from '@/lib/cn'

export const ANALYTICS_TABS: Array<{ path: string; label: AdminMessageKey }> = [
  { path: '/admin/analytics', label: 'analyticsTabOverview' },
  { path: '/admin/analytics/acquisition', label: 'analyticsTabAcquisition' },
  { path: '/admin/analytics/engagement', label: 'analyticsTabEngagement' },
  { path: '/admin/analytics/audience', label: 'analyticsTabAudience' },
  { path: '/admin/analytics/performance', label: 'analyticsTabPerformance' },
  { path: '/admin/analytics/search', label: 'analyticsTabSearch' },
  { path: '/admin/analytics/explore', label: 'analyticsTabExplore' },
]

function stripLocale(pathname: string) {
  return pathname.replace(/^\/(en|ko)(?=\/admin)/, '')
}

export default function AnalyticsTabs() {
  const { t, locale } = useAdminI18n()
  const pathname = stripLocale(usePathname())
  const query = useSearchParams().toString()

  return (
    <nav
      aria-label={t('analyticsTabsLabel')}
      className={'-mx-1 overflow-x-auto'}
    >
      <ul className={'flex min-w-max gap-1 px-1'}>
        {ANALYTICS_TABS.map((tab) => {
          const active =
            tab.path === '/admin/analytics'
              ? pathname === tab.path
              : pathname.startsWith(tab.path)
          return (
            <li key={tab.path}>
              <Link
                href={`${localizeAdminHref(tab.path, locale)}${query ? `?${query}` : ''}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'type-body-sm inline-flex min-h-11 items-center rounded-md px-3 font-medium transition-colors',
                  'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
                  active
                    ? 'bg-primary-soft text-primary'
                    : 'text-ink-muted hover:bg-canvas hover:text-ink'
                )}
              >
                {t(tab.label)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
```

```tsx
// app/(admin)/admin/analytics/_components/filter-bar.tsx
'use client'

/**
 * 모든 탭 위에 한 줄로 놓이는 필터. 값은 URL 쿼리에만 저장해 링크로 공유한다.
 * transition 안에서 replace하면 새 데이터가 올 때까지 이전 화면이 유지된다(로딩 화면으로 깜빡이지 않는다).
 */
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AdminMessageKey } from '@/lib/admin-i18n'
import { CHANNELS } from '@/lib/analytics/constants'
import { CONTENT_GROUPS } from '@/lib/analytics/content-groups'
import {
  DEFAULT_ANALYTICS_FILTER,
  DEVICE_TYPES,
  RANGE_PRESETS,
  analyticsFilterToSearchParams,
  parseAnalyticsFilter,
  type AnalyticsFilter,
} from '@/lib/analytics/filters'

const RANGE_LABELS: Record<(typeof RANGE_PRESETS)[number], AdminMessageKey> = {
  today: 'analyticsRangeToday',
  yesterday: 'analyticsRangeYesterday',
  '7d': 'analyticsRange7d',
  '28d': 'analyticsRange28d',
  '90d': 'analyticsRange90d',
  '12m': 'analyticsRange12m',
  custom: 'analyticsRangeCustom',
}

function Select({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <label htmlFor={id} className={'flex min-w-36 flex-col gap-1'}>
      <span className={'admin-field-label'}>{label}</span>
      <select
        id={id}
        className={'admin-input min-h-11'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function FilterBar() {
  const { t } = useAdminI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const filter = parseAnalyticsFilter(Object.fromEntries(searchParams))

  function update(next: AnalyticsFilter) {
    const query = analyticsFilterToSearchParams(next).toString()
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    })
  }

  const set = <K extends keyof AnalyticsFilter>(
    key: K,
    value: AnalyticsFilter[K]
  ) => update({ ...filter, [key]: value })
  const all = { value: '', label: t('analyticsAll') }

  return (
    <section
      aria-label={t('analyticsFiltersLabel')}
      className={'flex flex-wrap items-end gap-3'}
      aria-busy={pending}
    >
      <Select
        id={'analytics-range'}
        label={t('analyticsRange')}
        value={filter.range}
        options={RANGE_PRESETS.map((range) => ({
          value: range,
          label: t(RANGE_LABELS[range]),
        }))}
        onChange={(value) =>
          update({
            ...filter,
            range: value as AnalyticsFilter['range'],
            from: null,
            to: null,
          })
        }
      />
      {filter.range === 'custom' && (
        <>
          <label className={'flex flex-col gap-1'}>
            <span className={'admin-field-label'}>{t('analyticsFrom')}</span>
            <input
              type={'date'}
              className={'admin-input min-h-11'}
              value={filter.from ?? ''}
              onChange={(event) => set('from', event.target.value || null)}
            />
          </label>
          <label className={'flex flex-col gap-1'}>
            <span className={'admin-field-label'}>{t('analyticsTo')}</span>
            <input
              type={'date'}
              className={'admin-input min-h-11'}
              value={filter.to ?? ''}
              onChange={(event) => set('to', event.target.value || null)}
            />
          </label>
        </>
      )}
      <Select
        id={'analytics-channel'}
        label={t('analyticsChannel')}
        value={filter.channel ?? ''}
        options={[
          all,
          ...CHANNELS.map((channel) => ({ value: channel, label: channel })),
        ]}
        onChange={(value) =>
          set('channel', (value || null) as AnalyticsFilter['channel'])
        }
      />
      <Select
        id={'analytics-device'}
        label={t('analyticsDevice')}
        value={filter.device ?? ''}
        options={[
          all,
          ...DEVICE_TYPES.map((device) => ({ value: device, label: device })),
        ]}
        onChange={(value) =>
          set('device', (value || null) as AnalyticsFilter['device'])
        }
      />
      <Select
        id={'analytics-visitor'}
        label={t('analyticsVisitorType')}
        value={filter.visitor ?? ''}
        options={[
          all,
          { value: 'new', label: t('analyticsNewUsers') },
          { value: 'returning', label: t('analyticsReturningUsers') },
        ]}
        onChange={(value) =>
          set('visitor', (value || null) as AnalyticsFilter['visitor'])
        }
      />
      <Select
        id={'analytics-locale'}
        label={t('analyticsLocale')}
        value={filter.locale ?? ''}
        options={[
          all,
          { value: 'ko', label: '한국어' },
          { value: 'en', label: 'English' },
        ]}
        onChange={(value) =>
          set('locale', (value || null) as AnalyticsFilter['locale'])
        }
      />
      <Select
        id={'analytics-group'}
        label={t('analyticsContentGroup')}
        value={filter.contentGroup ?? ''}
        options={[
          all,
          ...CONTENT_GROUPS.map((group) => ({ value: group, label: group })),
        ]}
        onChange={(value) =>
          set(
            'contentGroup',
            (value || null) as AnalyticsFilter['contentGroup']
          )
        }
      />
      <label className={'flex min-w-48 flex-col gap-1'}>
        <span className={'admin-field-label'}>
          {t('analyticsPathContains')}
        </span>
        <input
          key={filter.path ?? ''}
          type={'search'}
          className={'admin-input min-h-11'}
          defaultValue={filter.path ?? ''}
          onKeyDown={(event) => {
            if (event.key === 'Enter')
              set('path', event.currentTarget.value.trim() || null)
          }}
          onBlur={(event) => {
            const value = event.currentTarget.value.trim() || null
            if (value !== filter.path) set('path', value)
          }}
        />
      </label>
      <label className={'flex min-h-11 items-center gap-2'}>
        <input
          type={'checkbox'}
          checked={filter.compare}
          onChange={(event) => set('compare', event.target.checked)}
        />
        <span className={'type-body-sm text-ink'}>{t('analyticsCompare')}</span>
      </label>
      <label className={'flex min-h-11 items-center gap-2'}>
        <input
          type={'checkbox'}
          checked={filter.includeInternal}
          onChange={(event) => set('includeInternal', event.target.checked)}
        />
        <span className={'type-body-sm text-ink'}>
          {t('analyticsIncludeInternal')}
        </span>
      </label>
      <button
        type={'button'}
        className={'admin-btn-ghost'}
        onClick={() => update(DEFAULT_ANALYTICS_FILTER)}
      >
        {t('analyticsResetFilters')}
      </button>
      {pending && (
        <span
          role={'status'}
          className={'type-caption text-ink-muted min-h-11 content-center'}
        >
          {t('analyticsUpdating')}
        </span>
      )}
    </section>
  )
}
```

국가 필터는 사용자 탭의 국가 목록에서 링크로 건다(Task 13). 필터 바에는 두지 않아 한 줄을 넘기지 않는다.

```tsx
// app/(admin)/admin/analytics/layout.tsx
/** 분석 영역의 권한 경계(get analyticsPage)와 공통 머리: 제목, 필터 바, 탭. 필터 바·탭은 searchParams를 읽어 Suspense가 필요하다. */
import { Suspense, type ReactNode } from 'react'
import FilterBar from '@/app/(admin)/admin/analytics/_components/filter-bar'
import AnalyticsTabs from '@/app/(admin)/admin/analytics/_components/analytics-tabs'
import AdminDefaultLayout from '@/app/components/admin/admin-default-layout'
import AdminPageHeader from '@/app/components/admin/page-header'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'
import { requirePermission } from '@/lib/server/permission/require-permission'

export default async function AnalyticsLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePermission('get', 'analyticsPage')
  const t = getAdminMessages(await getAdminLocale())

  return (
    <AdminDefaultLayout>
      <AdminPageHeader
        title={t.analytics}
        description={t.analyticsDescription}
      />
      <Suspense fallback={null}>
        <FilterBar />
        <AnalyticsTabs />
      </Suspense>
      {children}
    </AdminDefaultLayout>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/components/analytics-filter-bar.test.tsx && pnpm test:types`
Expected: PASS. 쿼리 순서는 `analyticsFilterToSearchParams`의 순서(range, from, to, compare, channel, device, …)다.

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/analytics" tests/components/analytics-filter-bar.test.tsx
git commit -m "feat(analytics): add the analytics layout with filters and tabs"
```

---

### Task 10: 개요 탭과 실시간 카드

**Files:**

- Create: `app/(admin)/admin/analytics/page.tsx`
- Create: `app/(admin)/admin/analytics/loading.tsx`
- Create: `app/(admin)/admin/analytics/_components/overview-view.tsx`
- Create: `app/(admin)/admin/analytics/_components/realtime-card.tsx`
- Create: `app/(admin)/admin/analytics/_lib/links.ts`
- Test: `tests/components/analytics-overview.test.tsx`

**Interfaces:**

- Consumes: `getAnalyticsOverview`, `getAnalyticsRealtime`, `AnalyticsOverview`, `RealtimeSnapshot`, `readAnalyticsFilter`, `getWebActor`, Task 8 컴포넌트, `ReportError`, `ReportEmpty`
- Produces: 기본 export `OverviewView({ data, filter })`, `RealtimeCard({ initial, includeInternal })`, `pageDetailHref(path: string, filter: AnalyticsFilter, locale: Locale): string` (`_lib/links.ts`)

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/analytics-overview.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>()
  // jsdom에는 레이아웃이 없어 ResponsiveContainer가 0px로 그린다. 고정 크기로 바꿔 렌더링만 확인한다.
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <div style={{ width: 600, height: 280 }}>{children}</div>
    ),
  }
})

import OverviewView from '@/app/(admin)/admin/analytics/_components/overview-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import {
  deriveSessionMetrics,
  EMPTY_SESSION_METRICS,
} from '@/lib/analytics/metrics'
import type { AnalyticsOverview } from '@/lib/server/services/admin/analytics'

const metrics = (sessions: number) =>
  deriveSessionMetrics({
    ...EMPTY_SESSION_METRICS,
    sessions,
    users: sessions,
    engagedSessions: sessions,
    views: sessions * 2,
  })

const data: AnalyticsOverview = {
  range: {
    start: new Date('2026-10-12T15:00:00Z'),
    end: new Date('2026-10-14T15:00:00Z'),
    previousStart: new Date('2026-10-10T15:00:00Z'),
    previousEnd: new Date('2026-10-12T15:00:00Z'),
    bucket: 'day',
    days: 2,
  },
  collectingSince: '2026-09-01T00:00:00.000Z',
  totals: metrics(20),
  previousTotals: metrics(10),
  series: [
    { bucket: '2026-10-13', ...metrics(8) },
    { bucket: '2026-10-14', ...metrics(12) },
  ],
  previousSeries: [
    { bucket: '2026-10-11', ...metrics(4) },
    { bucket: '2026-10-12', ...metrics(6) },
  ],
  channels: [{ name: 'Organic Search', ...metrics(15) }],
  devices: [{ name: 'mobile', ...metrics(20) }],
  topPages: [],
}

function renderView(view: AnalyticsOverview) {
  return render(
    <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
      <OverviewView data={view} filter={DEFAULT_ANALYTICS_FILTER} />
    </AdminI18nProvider>
  )
}

describe('OverviewView', () => {
  it('shows KPI tiles with deltas against the previous period', () => {
    renderView(data)
    // 사용자·세션 타일이 모두 20이다.
    expect(screen.getAllByText('20').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('+100.0%').length).toBeGreaterThan(0)
    expect(screen.getByRole('figure', { name: 'Trend' })).toBeInTheDocument()
    expect(screen.getByText('Organic Search')).toBeInTheDocument()
  })

  it('shows the empty state when nothing was collected in the range', () => {
    renderView({
      ...data,
      totals: metrics(0),
      series: [],
      channels: [],
      devices: [],
    })
    expect(screen.getByText('No data yet')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/components/analytics-overview.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```ts
// app/(admin)/admin/analytics/_lib/links.ts
/** 분석 화면 사이의 링크. 현재 필터를 그대로 들고 간다. */
import { localizeAdminHref } from '@/lib/admin-i18n'
import {
  analyticsFilterToSearchParams,
  type AnalyticsFilter,
} from '@/lib/analytics/filters'
import type { Locale } from '@/lib/i18n'

/** 페이지 경로에 슬래시가 있어 세그먼트 대신 `page` 쿼리로 넘긴다. */
export function pageDetailHref(
  path: string,
  filter: AnalyticsFilter,
  locale: Locale
): string {
  const params = analyticsFilterToSearchParams(filter)
  params.set('page', path)
  return `${localizeAdminHref('/admin/analytics/engagement/page-detail', locale)}?${params}`
}
```

```tsx
// app/(admin)/admin/analytics/_components/overview-view.tsx
'use client'

/** 개요 탭 본문: 지표 타일 6개, 지표를 고르는 추이 차트, 상위 채널·페이지·기기. 데이터는 서버에서 받은 직렬화 값이다. */
import { useState } from 'react'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import MetricTile from '@/app/(admin)/admin/analytics/_components/metric-tile'
import { ReportEmpty } from '@/app/(admin)/admin/analytics/_components/report-states'
import TimeSeriesChart from '@/app/(admin)/admin/analytics/_components/time-series-chart'
import {
  formatBucketLabel,
  formatDuration,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { pageDetailHref } from '@/app/(admin)/admin/analytics/_lib/links'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AdminMessageKey } from '@/lib/admin-i18n'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import {
  percentChange,
  type DerivedSessionMetrics,
} from '@/lib/analytics/metrics'
import type { AnalyticsOverview } from '@/lib/server/services/admin/analytics'

type TileKey =
  | 'users'
  | 'newUsers'
  | 'sessions'
  | 'engagementRate'
  | 'avgEngagementSeconds'
  | 'views'

const TILES: Array<{
  key: TileKey
  label: AdminMessageKey
  goodWhenUp: boolean
}> = [
  { key: 'users', label: 'analyticsUsers', goodWhenUp: true },
  { key: 'newUsers', label: 'analyticsNewUsers', goodWhenUp: true },
  { key: 'sessions', label: 'analyticsSessions', goodWhenUp: true },
  { key: 'engagementRate', label: 'analyticsEngagementRate', goodWhenUp: true },
  {
    key: 'avgEngagementSeconds',
    label: 'analyticsAvgEngagement',
    goodWhenUp: true,
  },
  { key: 'views', label: 'analyticsViews', goodWhenUp: true },
]

export default function OverviewView({
  data,
  filter,
}: {
  data: AnalyticsOverview
  filter: AnalyticsFilter
}) {
  const { t, locale } = useAdminI18n()
  const [metric, setMetric] = useState<TileKey>('users')

  if (data.totals.sessions === 0)
    return <ReportEmpty collectingSince={data.collectingSince} />

  const format = (key: TileKey, value: number) =>
    key === 'engagementRate'
      ? formatPercent(value, locale)
      : key === 'avgEngagementSeconds'
        ? formatDuration(value)
        : formatNumber(value, locale)

  const chartData = data.series.map((point, index) => ({
    bucket: point.bucket,
    current: point[metric],
    ...(data.previousSeries
      ? { previous: data.previousSeries[index]?.[metric] ?? 0 }
      : {}),
  }))
  const metricLabel = t(TILES.find((tile) => tile.key === metric)!.label)
  const first = data.series[0]
  const last = data.series.at(-1)

  return (
    <div className={'flex flex-col gap-4'}>
      <div className={'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6'}>
        {TILES.map((tile) => (
          <MetricTile
            key={tile.key}
            label={t(tile.label)}
            value={format(tile.key, data.totals[tile.key])}
            delta={
              data.previousTotals
                ? percentChange(
                    data.totals[tile.key],
                    data.previousTotals[tile.key]
                  )
                : null
            }
            goodWhenUp={tile.goodWhenUp}
            spark={data.series.map((point) => point[tile.key])}
          />
        ))}
      </div>

      <ChartFrame
        title={t('analyticsTrend')}
        summary={`${metricLabel}: ${first ? format(metric, first[metric]) : 0} → ${last ? format(metric, last[metric]) : 0}`}
        table={{
          columns: [
            t('analyticsDimDate'),
            metricLabel,
            ...(data.previousSeries ? [t('analyticsPreviousPeriod')] : []),
          ],
          rows: chartData.map((row) => [
            formatBucketLabel(row.bucket, locale),
            format(metric, row.current),
            ...('previous' in row ? [format(metric, row.previous)] : []),
          ]),
        }}
        actions={
          <select
            aria-label={t('analyticsMetric')}
            className={'admin-input min-h-11 w-auto'}
            value={metric}
            onChange={(event) => setMetric(event.target.value as TileKey)}
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
          data={chartData}
          xKey={'bucket'}
          series={[{ key: 'current', label: metricLabel }]}
          compareKey={data.previousSeries ? 'previous' : undefined}
          compareLabel={t('analyticsPreviousPeriod')}
          valueFormat={(value) => format(metric, value)}
        />
      </ChartFrame>

      <div className={'grid gap-4 lg:grid-cols-3'}>
        <TopList
          title={t('analyticsTopChannels')}
          rows={data.channels}
          valueLabel={t('analyticsSessions')}
        />
        <section className={'admin-card flex flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsTopPages')}</h2>
          <BarList
            valueLabel={t('analyticsViews')}
            format={(value) => formatNumber(value, locale)}
            items={data.topPages.map((page) => ({
              label: page.title ?? page.path,
              secondary: page.path,
              value: page.views,
              href: pageDetailHref(page.path, filter, locale),
            }))}
          />
        </section>
        <TopList
          title={t('analyticsDevices')}
          rows={data.devices}
          valueLabel={t('analyticsSessions')}
        />
      </div>
    </div>
  )
}

function TopList({
  title,
  rows,
  valueLabel,
}: {
  title: string
  rows: Array<{ name: string } & DerivedSessionMetrics>
  valueLabel: string
}) {
  const { locale } = useAdminI18n()
  return (
    <section className={'admin-card flex flex-col gap-3'}>
      <h2 className={'type-title text-ink'}>{title}</h2>
      <BarList
        valueLabel={valueLabel}
        format={(value) => formatNumber(value, locale)}
        items={rows.map((row) => ({ label: row.name, value: row.sessions }))}
      />
    </section>
  )
}
```

```tsx
// app/(admin)/admin/analytics/_components/realtime-card.tsx
'use client'

/** 최근 5분 활성 방문자와 30분 분당 조회. 30초마다 실시간 API를 다시 부르고, 실패하면 마지막 값을 유지한다. */
import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import { formatNumber } from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { RealtimeSnapshot } from '@/lib/server/analytics/queries/realtime'

const REFRESH_MS = 30_000

export default function RealtimeCard({
  initial,
  includeInternal,
}: {
  initial: RealtimeSnapshot
  includeInternal: boolean
}) {
  const { t, locale } = useAdminI18n()
  const [snapshot, setSnapshot] = useState(initial)

  useEffect(() => {
    const timer = window.setInterval(() => {
      fetch(
        `/api/admin/analytics/realtime${includeInternal ? '?internal=1' : ''}`,
        { cache: 'no-store' }
      )
        .then((response) =>
          response.ok ? (response.json() as Promise<RealtimeSnapshot>) : null
        )
        .then((next) => {
          if (next) setSnapshot(next)
        })
        .catch(() => {})
    }, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [includeInternal])

  return (
    <section
      className={'admin-card flex flex-col gap-3'}
      aria-labelledby={'analytics-realtime-title'}
    >
      <div className={'flex items-baseline justify-between gap-2'}>
        <h2 id={'analytics-realtime-title'} className={'type-title text-ink'}>
          {t('analyticsRealtime')}
        </h2>
        <span className={'type-caption text-ink-muted'}>
          {t('analyticsActiveVisitors')}
        </span>
      </div>
      <p className={'text-ink text-5xl font-semibold'} aria-live={'polite'}>
        {formatNumber(snapshot.activeVisitors, locale)}
      </p>
      <div
        className={'h-20 w-full'}
        role={'img'}
        aria-label={t('analyticsViewsPerMinute')}
      >
        <ResponsiveContainer width={'100%'} height={'100%'}>
          <BarChart data={snapshot.perMinute} barCategoryGap={2}>
            <XAxis dataKey={'minutesAgo'} hide reversed />
            <Tooltip
              cursor={{ fill: 'var(--surface-sunken)' }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--hairline)',
                borderRadius: 8,
                color: 'var(--ink)',
              }}
              labelFormatter={(value) => `-${String(value)}m`}
            />
            <Bar
              dataKey={'views'}
              fill={'var(--chart-1)'}
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <h3 className={'type-caption text-ink-muted'}>
        {t('analyticsActivePages')}
      </h3>
      <BarList
        valueLabel={t('analyticsActivePages')}
        format={(value) => formatNumber(value, locale)}
        items={snapshot.activePages.map((page) => ({
          label: page.path,
          value: page.visitors,
        }))}
      />
    </section>
  )
}
```

```tsx
// app/(admin)/admin/analytics/page.tsx
/** 분석 개요 탭. 개요 묶음과 실시간 첫 값을 서버에서 읽고, 실시간은 이후 클라이언트가 갱신한다. */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import OverviewView from '@/app/(admin)/admin/analytics/_components/overview-view'
import RealtimeCard from '@/app/(admin)/admin/analytics/_components/realtime-card'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import {
  getAnalyticsOverview,
  getAnalyticsRealtime,
} from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Analytics' }

export default async function AnalyticsOverviewPage({
  searchParams,
}: PageProps<'/admin/analytics'>) {
  const [filter, actor] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
  ])
  if (!actor) forbidden()

  const [overview, realtime] = await Promise.all([
    getAnalyticsOverview(actor, filter),
    getAnalyticsRealtime(actor, filter.includeInternal),
  ])

  return (
    <div className={'grid gap-4 xl:grid-cols-[1fr_320px]'}>
      <div className={'min-w-0'}>
        {overview.ok ? (
          <OverviewView data={overview.data} filter={filter} />
        ) : (
          <ReportError message={overview.message} />
        )}
      </div>
      {realtime.ok && (
        <RealtimeCard
          initial={realtime.data}
          includeInternal={filter.includeInternal}
        />
      )}
    </div>
  )
}
```

서버 컴포넌트에서 클라이언트 컴포넌트로 `Date`를 넘기면 직렬화된다(React 19는 Date를 지원한다). `OverviewView`는 `range`를 쓰지 않으므로 문제없다.

```tsx
// app/(admin)/admin/analytics/loading.tsx
/** 탭 사이 첫 이동 때의 자리 표시. 필터를 바꿀 때는 transition이 이전 화면을 유지하므로 보이지 않는다. */
import { AdminCardSkeleton } from '@/app/components/admin/skeleton'

export default function AnalyticsLoading() {
  return (
    <div className={'grid gap-3 md:grid-cols-3'}>
      <AdminCardSkeleton />
      <AdminCardSkeleton />
      <AdminCardSkeleton />
    </div>
  )
}
```

`AdminCardSkeleton`의 이름·props는 `app/components/admin/skeleton.tsx`에서 확인한다(대시보드가 이미 쓴다).

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/components/analytics-overview.test.tsx && pnpm test:types`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/analytics" tests/components/analytics-overview.test.tsx
git commit -m "feat(analytics): add the overview tab with KPI tiles, trend and realtime"
```

---

### Task 11: 유입 탭

**Files:**

- Create: `app/(admin)/admin/analytics/acquisition/page.tsx`
- Create: `app/(admin)/admin/analytics/_components/acquisition-view.tsx`
- Create: `app/(admin)/admin/analytics/_components/csv-link.tsx`
- Create: `app/(admin)/admin/analytics/_components/metric-table.tsx`
- Test: `tests/components/analytics-acquisition.test.tsx`

**Interfaces:**

- Consumes: `getAnalyticsAcquisition`, `AnalyticsAcquisition`, `AnalyticsTableReport`, Task 8·9 컴포넌트
- Produces:
  - `CsvLink({ report, filter, extra? })` — `/api/admin/analytics/export?report=…&<필터>` 링크
  - `MetricTable<T>({ caption, columns, rows, rowKey })` — `columns: Array<{ key: string; label: string; render: (row: T) => ReactNode; numeric?: boolean }>`
  - 기본 export `AcquisitionView({ data, filter })`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/analytics-acquisition.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
    <div style={{ width: 600, height: 280 }}>{children}</div>
  ),
}))

import AcquisitionView from '@/app/(admin)/admin/analytics/_components/acquisition-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import {
  deriveSessionMetrics,
  EMPTY_SESSION_METRICS,
} from '@/lib/analytics/metrics'

const m = (sessions: number) =>
  deriveSessionMetrics({
    ...EMPTY_SESSION_METRICS,
    sessions,
    users: sessions,
    engagedSessions: sessions,
  })

describe('AcquisitionView', () => {
  it('renders channels, search and AI sources, and CSV links that keep the filter', () => {
    render(
      <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
        <AcquisitionView
          filter={{ ...DEFAULT_ANALYTICS_FILTER, range: '7d' }}
          data={{
            channels: [
              { name: 'Organic Search', ...m(10) },
              { name: 'AI Assistants', ...m(3) },
            ],
            channelSeries: [
              {
                bucket: '2026-10-14',
                'Organic Search': 10,
                'AI Assistants': 3,
              },
            ],
            channelOrder: ['Organic Search', 'AI Assistants'],
            sources: [
              {
                source: 'google.com',
                medium: 'organic',
                channel: 'Organic Search',
                ...m(10),
              },
              {
                source: 'chatgpt.com',
                medium: 'referral',
                channel: 'AI Assistants',
                ...m(3),
              },
              {
                source: 'velog.io',
                medium: 'referral',
                channel: 'Referral',
                ...m(2),
              },
            ],
            referrers: [{ name: 'velog.io', ...m(2) }],
            campaigns: [],
            landingPages: [{ name: '/ko', ...m(12) }],
          }}
        />
      </AdminI18nProvider>
    )
    expect(
      screen.getByRole('figure', { name: 'Sessions by channel' })
    ).toBeInTheDocument()
    const searchAndAi = screen.getByRole('region', {
      name: 'Search engines and AI assistants',
    })
    expect(searchAndAi).toHaveTextContent('chatgpt.com')
    expect(searchAndAi).not.toHaveTextContent('velog.io')
    expect(
      screen.getAllByRole('link', { name: 'Download CSV' })[0]
    ).toHaveAttribute(
      'href',
      '/api/admin/analytics/export?report=channels&range=7d'
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/components/analytics-acquisition.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```tsx
// app/(admin)/admin/analytics/_components/csv-link.tsx
/** 현재 필터를 그대로 붙인 CSV 내려받기 링크. 내려받기라 클라이언트 라우터를 쓰지 않는 일반 <a>다. */
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import {
  analyticsFilterToSearchParams,
  type AnalyticsFilter,
} from '@/lib/analytics/filters'
import type { AnalyticsTableReport } from '@/lib/server/services/admin/analytics'

export default function CsvLink({
  report,
  filter,
  label,
  extra,
}: {
  report: AnalyticsTableReport
  filter: AnalyticsFilter
  label: string
  extra?: Record<string, string>
}) {
  const params = new URLSearchParams({ report })
  analyticsFilterToSearchParams(filter).forEach((value, key) =>
    params.set(key, value)
  )
  for (const [key, value] of Object.entries(extra ?? {})) params.set(key, value)
  return (
    <a
      href={`/api/admin/analytics/export?${params}`}
      className={'admin-btn-ghost'}
      download
    >
      <ArrowDownTrayIcon className={'size-4'} aria-hidden={'true'} />
      {label}
    </a>
  )
}
```

`csv-link.tsx`는 서버 전용 모듈을 런타임에 가져오지 않는다(`AnalyticsTableReport`는 타입 import). 클라이언트 컴포넌트에서 쓰여도 된다.

```tsx
// app/(admin)/admin/analytics/_components/metric-table.tsx
/** 보고서 표. 숫자 열은 오른쪽 정렬·고정폭 숫자, 첫 열은 행 머리다. 좁은 화면에서는 가로로 스크롤한다. */
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type MetricColumn<T> = {
  key: string
  label: string
  render: (row: T) => ReactNode
  numeric?: boolean
}

export default function MetricTable<T>({
  caption,
  columns,
  rows,
  rowKey,
}: {
  caption: string
  columns: Array<MetricColumn<T>>
  rows: T[]
  rowKey: (row: T) => string
}) {
  return (
    <div className={'overflow-x-auto'}>
      <table className={'type-body-sm w-full border-collapse'}>
        <caption className={'sr-only'}>{caption}</caption>
        <thead>
          <tr className={'border-hairline text-ink-muted border-b'}>
            {columns.map((column) => (
              <th
                key={column.key}
                scope={'col'}
                className={cn(
                  'px-2 py-2 font-medium whitespace-nowrap',
                  column.numeric ? 'text-right' : 'text-left'
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={'border-hairline border-b last:border-b-0'}
            >
              {columns.map((column, index) => {
                const Cell = index === 0 ? 'th' : 'td'
                return (
                  <Cell
                    key={column.key}
                    scope={index === 0 ? 'row' : undefined}
                    className={cn(
                      'text-ink px-2 py-2.5',
                      column.numeric
                        ? 'text-right tabular-nums'
                        : 'max-w-80 truncate text-left font-normal'
                    )}
                  >
                    {column.render(row)}
                  </Cell>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

```tsx
// app/(admin)/admin/analytics/_components/acquisition-view.tsx
'use client'

/** 유입 탭: 채널별 세션 추이, 채널 표, 검색 엔진·AI 어시스턴트, 소스/매체, 참조 사이트, 캠페인, 방문 시작 페이지. */
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import CsvLink from '@/app/(admin)/admin/analytics/_components/csv-link'
import MetricTable, {
  type MetricColumn,
} from '@/app/(admin)/admin/analytics/_components/metric-table'
import TimeSeriesChart from '@/app/(admin)/admin/analytics/_components/time-series-chart'
import {
  formatBucketLabel,
  formatDuration,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import type { DerivedSessionMetrics } from '@/lib/analytics/metrics'
import type {
  AnalyticsAcquisition,
  AnalyticsTableReport,
} from '@/lib/server/services/admin/analytics'

function Section({
  title,
  report,
  filter,
  children,
}: {
  title: string
  report: AnalyticsTableReport
  filter: AnalyticsFilter
  children: React.ReactNode
}) {
  const { t } = useAdminI18n()
  const id = `analytics-section-${report}`
  return (
    <section
      className={'admin-card flex min-w-0 flex-col gap-3'}
      aria-labelledby={id}
    >
      <div className={'flex flex-wrap items-center justify-between gap-2'}>
        <h2 id={id} className={'type-title text-ink'}>
          {title}
        </h2>
        <CsvLink
          report={report}
          filter={filter}
          label={t('analyticsDownloadCsv')}
        />
      </div>
      {children}
    </section>
  )
}

export default function AcquisitionView({
  data,
  filter,
}: {
  data: AnalyticsAcquisition
  filter: AnalyticsFilter
}) {
  const { t, locale } = useAdminI18n()

  function metricColumns<T extends DerivedSessionMetrics>(): Array<
    MetricColumn<T>
  > {
    return [
      {
        key: 'users',
        label: t('analyticsUsers'),
        numeric: true,
        render: (row) => formatNumber(row.users, locale),
      },
      {
        key: 'sessions',
        label: t('analyticsSessions'),
        numeric: true,
        render: (row) => formatNumber(row.sessions, locale),
      },
      {
        key: 'engagementRate',
        label: t('analyticsEngagementRate'),
        numeric: true,
        render: (row) => formatPercent(row.engagementRate, locale),
      },
      {
        key: 'avg',
        label: t('analyticsAvgEngagement'),
        numeric: true,
        render: (row) => formatDuration(row.avgEngagementSeconds),
      },
      {
        key: 'keyEvents',
        label: t('analyticsKeyEvents'),
        numeric: true,
        render: (row) => formatNumber(row.keyEvents, locale),
      },
    ]
  }

  const searchAndAi = data.sources.filter(
    (row) => row.channel === 'Organic Search' || row.channel === 'AI Assistants'
  )

  return (
    <div className={'flex flex-col gap-4'}>
      <ChartFrame
        title={t('analyticsChannelsOverTime')}
        summary={data.channels
          .map((row) => `${row.name} ${row.sessions}`)
          .join(', ')}
        table={{
          columns: [t('analyticsDimDate'), ...data.channelOrder],
          rows: data.channelSeries.map((point) => [
            formatBucketLabel(String(point.bucket), locale),
            ...data.channelOrder.map((name) => Number(point[name] ?? 0)),
          ]),
        }}
      >
        <TimeSeriesChart
          data={data.channelSeries}
          xKey={'bucket'}
          series={data.channelOrder.map((name) => ({ key: name, label: name }))}
          valueFormat={(value) => formatNumber(value, locale)}
        />
      </ChartFrame>

      <Section
        title={t('analyticsChannel')}
        report={'channels'}
        filter={filter}
      >
        <MetricTable
          caption={t('analyticsChannel')}
          rows={data.channels}
          rowKey={(row) => row.name}
          columns={[
            {
              key: 'name',
              label: t('analyticsChannel'),
              render: (row) => row.name,
            },
            ...metricColumns(),
          ]}
        />
      </Section>

      <div className={'grid gap-4 xl:grid-cols-2'}>
        <section
          className={'admin-card flex min-w-0 flex-col gap-3'}
          aria-label={t('analyticsSearchAndAi')}
        >
          <h2 className={'type-title text-ink'}>{t('analyticsSearchAndAi')}</h2>
          <MetricTable
            caption={t('analyticsSearchAndAi')}
            rows={searchAndAi}
            rowKey={(row) => `${row.source}/${row.medium}`}
            columns={[
              {
                key: 'source',
                label: t('analyticsDimSource'),
                render: (row) => row.source,
              },
              {
                key: 'channel',
                label: t('analyticsChannel'),
                render: (row) => row.channel,
              },
              ...metricColumns<(typeof searchAndAi)[number]>().slice(1, 3),
            ]}
          />
        </section>
        <Section
          title={t('analyticsReferrers')}
          report={'referrers'}
          filter={filter}
        >
          <MetricTable
            caption={t('analyticsReferrers')}
            rows={data.referrers}
            rowKey={(row) => row.name}
            columns={[
              {
                key: 'name',
                label: t('analyticsDimReferrer'),
                render: (row) => row.name,
              },
              ...metricColumns().slice(1, 3),
            ]}
          />
        </Section>
      </div>

      <Section
        title={t('analyticsSourceMedium')}
        report={'sources'}
        filter={filter}
      >
        <MetricTable
          caption={t('analyticsSourceMedium')}
          rows={data.sources}
          rowKey={(row) => `${row.source}/${row.medium}/${row.channel}`}
          columns={[
            {
              key: 'sm',
              label: t('analyticsSourceMedium'),
              render: (row) => `${row.source} / ${row.medium}`,
            },
            ...metricColumns<(typeof data.sources)[number]>(),
          ]}
        />
      </Section>

      <div className={'grid gap-4 xl:grid-cols-2'}>
        <Section
          title={t('analyticsCampaigns')}
          report={'campaigns'}
          filter={filter}
        >
          <MetricTable
            caption={t('analyticsCampaigns')}
            rows={data.campaigns}
            rowKey={(row) => `${row.campaign}/${row.source}/${row.medium}`}
            columns={[
              {
                key: 'campaign',
                label: t('analyticsDimCampaign'),
                render: (row) =>
                  `${row.campaign} (${row.source} / ${row.medium})`,
              },
              ...metricColumns<(typeof data.campaigns)[number]>().slice(1, 3),
            ]}
          />
        </Section>
        <Section
          title={t('analyticsLandingPages')}
          report={'landing_pages'}
          filter={filter}
        >
          <MetricTable
            caption={t('analyticsLandingPages')}
            rows={data.landingPages}
            rowKey={(row) => row.name}
            columns={[
              {
                key: 'path',
                label: t('analyticsDimLandingPath'),
                render: (row) => row.name,
              },
              ...metricColumns().slice(1, 4),
            ]}
          />
        </Section>
      </div>
    </div>
  )
}
```

```tsx
// app/(admin)/admin/analytics/acquisition/page.tsx
/** 유입 탭. */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import AcquisitionView from '@/app/(admin)/admin/analytics/_components/acquisition-view'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import { getAnalyticsAcquisition } from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Acquisition' }

export default async function AcquisitionPage({
  searchParams,
}: PageProps<'/admin/analytics/acquisition'>) {
  const [filter, actor] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
  ])
  if (!actor) forbidden()
  const result = await getAnalyticsAcquisition(actor, filter)
  return result.ok ? (
    <AcquisitionView data={result.data} filter={filter} />
  ) : (
    <ReportError message={result.message} />
  )
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/components/analytics-acquisition.test.tsx && pnpm test:types`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/analytics" tests/components/analytics-acquisition.test.tsx
git commit -m "feat(analytics): add the acquisition tab"
```

---

### Task 12: 참여 탭과 페이지 상세

**Files:**

- Create: `app/(admin)/admin/analytics/engagement/page.tsx`
- Create: `app/(admin)/admin/analytics/engagement/page-detail/page.tsx`
- Create: `app/(admin)/admin/analytics/_components/engagement-view.tsx`
- Create: `app/(admin)/admin/analytics/_components/page-detail-view.tsx`
- Test: `tests/components/analytics-engagement.test.tsx`

**Interfaces:**

- Consumes: `getAnalyticsEngagement`, `getAnalyticsPageDetail`, `AnalyticsEngagement`, `PageDetail`, `ENTRANCE_MARKER`/`EXIT_MARKER`(값만 복사해 문자열 비교. 서버 모듈을 클라이언트에서 import하지 않는다), Task 8·9·11 컴포넌트
- Produces: 기본 export `EngagementView({ data, filter })`, `PageDetailView({ data, path })`
- Consumes 추가: `pageDetailHref` (Task 10 `_lib/links.ts`)

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/analytics-engagement.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
    <div style={{ width: 600, height: 280 }}>{children}</div>
  ),
}))

import EngagementView from '@/app/(admin)/admin/analytics/_components/engagement-view'
import PageDetailView from '@/app/(admin)/admin/analytics/_components/page-detail-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'

function withI18n(node: React.ReactNode) {
  return (
    <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
      {node}
    </AdminI18nProvider>
  )
}

describe('EngagementView', () => {
  it('links each page to its detail with the current filter', () => {
    render(
      withI18n(
        <EngagementView
          filter={{ ...DEFAULT_ANALYTICS_FILTER, device: 'mobile' }}
          data={{
            pages: [
              {
                path: '/ko/session/25-26',
                title: 'Sessions',
                contentGroup: 'session-list',
                views: 12,
                users: 9,
                avgEngagementSeconds: 41,
                scroll75Rate: 0.5,
                entrances: 4,
                exits: 3,
                exitRate: 0.25,
              },
            ],
            events: [
              { name: 'cta', label: 'join_instagram', count: 5, sessions: 4 },
            ],
            notFound: [{ path: '/ko/old', views: 2, referrer: 'velog.io' }],
          }}
        />
      )
    )
    expect(screen.getByRole('link', { name: 'Sessions' })).toHaveAttribute(
      'href',
      '/en/admin/analytics/engagement/page-detail?device=mobile&page=%2Fko%2Fsession%2F25-26'
    )
    expect(screen.getByText('41s')).toBeInTheDocument()
    expect(screen.getByText('join_instagram')).toBeInTheDocument()
    expect(screen.getByText('/ko/old')).toBeInTheDocument()
  })
})

describe('PageDetailView', () => {
  it('translates entrance and exit markers', () => {
    render(
      withI18n(
        <PageDetailView
          path={'/ko'}
          data={{
            totals: {
              views: 2,
              users: 2,
              avgEngagementSeconds: 15,
              scroll75Rate: 1,
              entrances: 1,
              exits: 1,
              exitRate: 0.5,
            },
            series: [{ bucket: '2026-10-14', views: 2 }],
            scrollDepth: [25, 50, 75, 90, 100].map((threshold) => ({
              threshold,
              rate: 0.5,
            })),
            previousPages: [{ path: '(entrance)', views: 1 }],
            nextPages: [{ path: '(exit)', views: 1 }],
            channels: [{ channel: 'Direct', views: 2 }],
          }}
        />
      )
    )
    expect(screen.getByText('Session start')).toBeInTheDocument()
    expect(screen.getByText('Left the site')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/components/analytics-engagement.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```tsx
// app/(admin)/admin/analytics/_components/engagement-view.tsx
'use client'

/** 참여 탭: 페이지 표(상세로 이동), 이벤트 표, 깨진 링크(404). */
import Link from 'next/link'
import CsvLink from '@/app/(admin)/admin/analytics/_components/csv-link'
import MetricTable from '@/app/(admin)/admin/analytics/_components/metric-table'
import {
  formatDuration,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { pageDetailHref } from '@/app/(admin)/admin/analytics/_lib/links'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import type { AnalyticsEngagement } from '@/lib/server/services/admin/analytics'

export default function EngagementView({
  data,
  filter,
}: {
  data: AnalyticsEngagement
  filter: AnalyticsFilter
}) {
  const { t, locale } = useAdminI18n()
  const csv = (report: 'pages' | 'events' | 'not_found') => (
    <CsvLink
      report={report}
      filter={filter}
      label={t('analyticsDownloadCsv')}
    />
  )

  return (
    <div className={'flex flex-col gap-4'}>
      <section
        className={'admin-card flex min-w-0 flex-col gap-3'}
        aria-labelledby={'analytics-pages'}
      >
        <div className={'flex flex-wrap items-center justify-between gap-2'}>
          <h2 id={'analytics-pages'} className={'type-title text-ink'}>
            {t('analyticsPages')}
          </h2>
          {csv('pages')}
        </div>
        <MetricTable
          caption={t('analyticsPages')}
          rows={data.pages}
          rowKey={(row) => row.path}
          columns={[
            {
              key: 'page',
              label: t('analyticsPage'),
              render: (row) => (
                <span className={'flex flex-col'}>
                  <Link
                    href={pageDetailHref(row.path, filter, locale)}
                    className={'text-primary hover:underline'}
                  >
                    {row.title ?? row.path}
                  </Link>
                  <span className={'type-caption text-ink-muted'}>
                    {row.path}
                  </span>
                </span>
              ),
            },
            {
              key: 'views',
              label: t('analyticsViews'),
              numeric: true,
              render: (row) => formatNumber(row.views, locale),
            },
            {
              key: 'users',
              label: t('analyticsUsers'),
              numeric: true,
              render: (row) => formatNumber(row.users, locale),
            },
            {
              key: 'time',
              label: t('analyticsAvgTimeOnPage'),
              numeric: true,
              render: (row) => formatDuration(row.avgEngagementSeconds),
            },
            {
              key: 'scroll',
              label: t('analyticsScroll75'),
              numeric: true,
              render: (row) => formatPercent(row.scroll75Rate, locale),
            },
            {
              key: 'entrances',
              label: t('analyticsEntrances'),
              numeric: true,
              render: (row) => formatNumber(row.entrances, locale),
            },
            {
              key: 'exit',
              label: t('analyticsExitRate'),
              numeric: true,
              render: (row) => formatPercent(row.exitRate, locale),
            },
          ]}
        />
      </section>

      <div className={'grid gap-4 xl:grid-cols-2'}>
        <section
          className={'admin-card flex min-w-0 flex-col gap-3'}
          aria-labelledby={'analytics-events'}
        >
          <div className={'flex flex-wrap items-center justify-between gap-2'}>
            <h2 id={'analytics-events'} className={'type-title text-ink'}>
              {t('analyticsEvents')}
            </h2>
            {csv('events')}
          </div>
          <MetricTable
            caption={t('analyticsEvents')}
            rows={data.events}
            rowKey={(row) => `${row.name}/${row.label}`}
            columns={[
              {
                key: 'name',
                label: t('analyticsEventName'),
                render: (row) => row.name,
              },
              {
                key: 'label',
                label: t('analyticsEventLabel'),
                render: (row) => row.label,
              },
              {
                key: 'count',
                label: t('analyticsCount'),
                numeric: true,
                render: (row) => formatNumber(row.count, locale),
              },
              {
                key: 'sessions',
                label: t('analyticsSessions'),
                numeric: true,
                render: (row) => formatNumber(row.sessions, locale),
              },
            ]}
          />
        </section>
        <section
          className={'admin-card flex min-w-0 flex-col gap-3'}
          aria-labelledby={'analytics-404'}
        >
          <div className={'flex flex-wrap items-center justify-between gap-2'}>
            <h2 id={'analytics-404'} className={'type-title text-ink'}>
              {t('analyticsNotFound')}
            </h2>
            {csv('not_found')}
          </div>
          <MetricTable
            caption={t('analyticsNotFound')}
            rows={data.notFound}
            rowKey={(row) => `${row.path}/${row.referrer}`}
            columns={[
              {
                key: 'path',
                label: t('analyticsPage'),
                render: (row) => row.path,
              },
              {
                key: 'referrer',
                label: t('analyticsReferrer'),
                render: (row) => row.referrer,
              },
              {
                key: 'views',
                label: t('analyticsViews'),
                numeric: true,
                render: (row) => formatNumber(row.views, locale),
              },
            ]}
          />
        </section>
      </div>
    </div>
  )
}
```

```tsx
// app/(admin)/admin/analytics/_components/page-detail-view.tsx
'use client'

/** 페이지 상세: 지표, 조회 추이, 스크롤 깊이, 이전·다음 페이지, 유입 채널. */
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import MetricTile from '@/app/(admin)/admin/analytics/_components/metric-tile'
import TimeSeriesChart from '@/app/(admin)/admin/analytics/_components/time-series-chart'
import {
  formatBucketLabel,
  formatDuration,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { PageDetail } from '@/lib/server/analytics/queries/pages'

// lib/server/analytics/queries/pages.ts의 ENTRANCE_MARKER·EXIT_MARKER와 같은 값이다.
const ENTRANCE = '(entrance)'
const EXIT = '(exit)'

export default function PageDetailView({
  data,
  path,
}: {
  data: PageDetail
  path: string
}) {
  const { t, locale } = useAdminI18n()
  const flowLabel = (value: string) =>
    value === ENTRANCE
      ? t('analyticsEntranceSource')
      : value === EXIT
        ? t('analyticsExitTarget')
        : value

  return (
    <div className={'flex flex-col gap-4'}>
      <h2 className={'type-heading-2 text-ink break-all'}>{path}</h2>
      <div className={'grid grid-cols-2 gap-3 md:grid-cols-4'}>
        <MetricTile
          label={t('analyticsViews')}
          value={formatNumber(data.totals.views, locale)}
          delta={null}
          goodWhenUp
          spark={[]}
        />
        <MetricTile
          label={t('analyticsUsers')}
          value={formatNumber(data.totals.users, locale)}
          delta={null}
          goodWhenUp
          spark={[]}
        />
        <MetricTile
          label={t('analyticsAvgTimeOnPage')}
          value={formatDuration(data.totals.avgEngagementSeconds)}
          delta={null}
          goodWhenUp
          spark={[]}
        />
        <MetricTile
          label={t('analyticsExitRate')}
          value={formatPercent(data.totals.exitRate, locale)}
          delta={null}
          goodWhenUp={false}
          spark={[]}
        />
      </div>
      <ChartFrame
        title={t('analyticsTrend')}
        summary={`${t('analyticsViews')} ${data.totals.views}`}
        table={{
          columns: [t('analyticsDimDate'), t('analyticsViews')],
          rows: data.series.map((point) => [
            formatBucketLabel(point.bucket, locale),
            point.views,
          ]),
        }}
      >
        <TimeSeriesChart
          data={data.series}
          xKey={'bucket'}
          series={[{ key: 'views', label: t('analyticsViews') }]}
          valueFormat={(value) => formatNumber(value, locale)}
        />
      </ChartFrame>
      <div className={'grid gap-4 lg:grid-cols-2 xl:grid-cols-4'}>
        <section className={'admin-card flex flex-col gap-3'}>
          <h3 className={'type-title text-ink'}>{t('analyticsScrollDepth')}</h3>
          <BarList
            valueLabel={t('analyticsScrollDepth')}
            format={(value) => formatPercent(value, locale)}
            items={data.scrollDepth.map((step) => ({
              label: `${step.threshold}%`,
              value: step.rate,
            }))}
          />
        </section>
        <section className={'admin-card flex flex-col gap-3'}>
          <h3 className={'type-title text-ink'}>
            {t('analyticsPreviousPages')}
          </h3>
          <BarList
            valueLabel={t('analyticsPreviousPages')}
            format={(value) => formatNumber(value, locale)}
            items={data.previousPages.map((row) => ({
              label: flowLabel(row.path),
              value: row.views,
            }))}
          />
        </section>
        <section className={'admin-card flex flex-col gap-3'}>
          <h3 className={'type-title text-ink'}>{t('analyticsNextPages')}</h3>
          <BarList
            valueLabel={t('analyticsNextPages')}
            format={(value) => formatNumber(value, locale)}
            items={data.nextPages.map((row) => ({
              label: flowLabel(row.path),
              value: row.views,
            }))}
          />
        </section>
        <section className={'admin-card flex flex-col gap-3'}>
          <h3 className={'type-title text-ink'}>{t('analyticsChannel')}</h3>
          <BarList
            valueLabel={t('analyticsChannel')}
            format={(value) => formatNumber(value, locale)}
            items={data.channels.map((row) => ({
              label: row.channel,
              value: row.views,
            }))}
          />
        </section>
      </div>
    </div>
  )
}
```

```tsx
// app/(admin)/admin/analytics/engagement/page.tsx
/** 참여 탭. */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import EngagementView from '@/app/(admin)/admin/analytics/_components/engagement-view'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import { getAnalyticsEngagement } from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Engagement' }

export default async function EngagementPage({
  searchParams,
}: PageProps<'/admin/analytics/engagement'>) {
  const [filter, actor] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
  ])
  if (!actor) forbidden()
  const result = await getAnalyticsEngagement(actor, filter)
  return result.ok ? (
    <EngagementView data={result.data} filter={filter} />
  ) : (
    <ReportError message={result.message} />
  )
}
```

```tsx
// app/(admin)/admin/analytics/engagement/page-detail/page.tsx
/** 페이지 상세. 경로는 `page` 쿼리로 받는다(경로에 슬래시가 있어 세그먼트로 넣지 않는다). */
import type { Metadata } from 'next'
import { forbidden, notFound } from 'next/navigation'
import PageDetailView from '@/app/(admin)/admin/analytics/_components/page-detail-view'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import { getAnalyticsPageDetail } from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Page detail' }

export default async function PageDetailPage({
  searchParams,
}: PageProps<'/admin/analytics/engagement/page-detail'>) {
  const [filter, actor, params] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
    searchParams,
  ])
  if (!actor) forbidden()
  const path =
    typeof params.page === 'string' && params.page.startsWith('/')
      ? params.page.slice(0, 512)
      : null
  if (!path) notFound()
  const result = await getAnalyticsPageDetail(actor, filter, path)
  return result.ok ? (
    <PageDetailView data={result.data} path={path} />
  ) : (
    <ReportError message={result.message} />
  )
}
```

`filter`는 `page` 키를 모르므로 탭 링크·필터 변경 때 `page`가 빠질 수 있다. 필터 바는 `analyticsFilterToSearchParams`로 쿼리를 다시 만들기 때문에 상세 화면에서 필터를 바꾸면 `page`가 사라져 404가 된다. 이를 막기 위해 `filter-bar.tsx`의 `update`에서 현재 쿼리의 `page` 값을 보존한다:

```ts
function update(next: AnalyticsFilter) {
  const params = analyticsFilterToSearchParams(next)
  const page = searchParams.get('page')
  if (page) params.set('page', page)
  const query = params.toString()
  startTransition(() => {
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  })
}
```

그리고 Task 9의 필터 바 테스트에 다음 케이스를 추가한다:

```tsx
it('keeps the page detail path when a filter changes', async () => {
  navigation.search = 'page=%2Fko'
  renderWithI18n(<FilterBar />)
  await userEvent.selectOptions(screen.getByLabelText('Device'), 'desktop')
  expect(navigation.replace).toHaveBeenLastCalledWith(
    '/ko/admin/analytics/acquisition?device=desktop&page=%2Fko',
    {
      scroll: false,
    }
  )
})
```

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/components/analytics-engagement.test.tsx tests/components/analytics-filter-bar.test.tsx && pnpm test:types`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/analytics" tests/components
git commit -m "feat(analytics): add the engagement tab and page detail"
```

---

### Task 13: 사용자 탭

**Files:**

- Create: `app/(admin)/admin/analytics/audience/page.tsx`
- Create: `app/(admin)/admin/analytics/_components/audience-view.tsx`
- Test: `tests/components/analytics-audience.test.tsx`

**Interfaces:**

- Consumes: `getAnalyticsAudience`, `AnalyticsAudience`, Task 8·9·11 컴포넌트, `analyticsFilterToSearchParams`
- Produces: 기본 export `AudienceView({ data, filter })`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/analytics-audience.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
    <div style={{ width: 600, height: 280 }}>{children}</div>
  ),
}))
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/admin/analytics/audience',
}))

import AudienceView from '@/app/(admin)/admin/analytics/_components/audience-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'
import {
  deriveSessionMetrics,
  EMPTY_SESSION_METRICS,
} from '@/lib/analytics/metrics'

const m = (sessions: number) =>
  deriveSessionMetrics({ ...EMPTY_SESSION_METRICS, sessions, users: sessions })

describe('AudienceView', () => {
  it('renders the retention grid, the weekday heatmap and country filter links', () => {
    render(
      <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
        <AudienceView
          filter={DEFAULT_ANALYTICS_FILTER}
          data={{
            newVsReturning: [
              { bucket: '2026-10-14', newUsers: 3, returningUsers: 1 },
            ],
            retention: [{ cohort: '2026-09-28', size: 10, rates: [1, 0.3] }],
            devices: [{ name: 'mobile', ...m(4) }],
            browsers: [{ name: 'KakaoTalk', ...m(2) }],
            operatingSystems: [{ name: 'iOS', ...m(3) }],
            screens: [{ name: '390x844', ...m(2) }],
            languages: [{ name: 'ko', ...m(4) }],
            countries: [{ name: 'KR', ...m(4) }],
            hourWeekday: [{ weekday: 0, hour: 21, sessions: 3 }],
          }}
        />
      </AdminI18nProvider>
    )
    expect(
      screen.getByRole('cell', { name: '2026-09-28 Week 1: 30.0%' })
    ).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Mon 21: 3' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'KR' })).toHaveAttribute(
      'href',
      '/en/admin/analytics/audience?country=KR'
    )
    expect(screen.getByText('KakaoTalk')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/components/analytics-audience.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```tsx
// app/(admin)/admin/analytics/_components/audience-view.tsx
'use client'

/** 사용자 탭: 신규·재방문 추이, 주간 리텐션, 요일×시간 히트맵, 기기·브라우저·OS·화면·언어·국가. 국가는 눌러서 필터로 건다. */
import { usePathname } from 'next/navigation'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import HeatmapGrid from '@/app/(admin)/admin/analytics/_components/heatmap-grid'
import TimeSeriesChart from '@/app/(admin)/admin/analytics/_components/time-series-chart'
import {
  formatBucketLabel,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  analyticsFilterToSearchParams,
  type AnalyticsFilter,
} from '@/lib/analytics/filters'
import type { DerivedSessionMetrics } from '@/lib/analytics/metrics'
import { fillTemplate } from '@/lib/format/text'
import type { AnalyticsAudience } from '@/lib/server/services/admin/analytics'

type Named = { name: string } & DerivedSessionMetrics

export default function AudienceView({
  data,
  filter,
}: {
  data: AnalyticsAudience
  filter: AnalyticsFilter
}) {
  const { t, locale } = useAdminI18n()
  const pathname = usePathname()
  const weekdays = t('analyticsWeekdays').split(',')
  const hours = Array.from({ length: 24 }, (_, hour) => String(hour))
  const heat = weekdays.map((_, weekday) =>
    hours.map(
      (_, hour) =>
        data.hourWeekday.find(
          (cell) => cell.weekday === weekday && cell.hour === hour
        )?.sessions ?? 0
    )
  )
  const maxWeeks = Math.max(1, ...data.retention.map((row) => row.rates.length))
  const weekLabels = Array.from({ length: maxWeeks }, (_, week) =>
    fillTemplate(t('analyticsWeekN'), { n: week })
  )
  const countryHref = (country: string) =>
    `${pathname}?${analyticsFilterToSearchParams({ ...filter, country }).toString()}`

  const list = (
    title: string,
    rows: Named[],
    href?: (name: string) => string
  ) => (
    <section className={'admin-card flex min-w-0 flex-col gap-3'}>
      <h2 className={'type-title text-ink'}>{title}</h2>
      <BarList
        valueLabel={t('analyticsUsers')}
        format={(value) => formatNumber(value, locale)}
        items={rows.map((row) => ({
          label: row.name,
          value: row.users,
          href: href?.(row.name),
        }))}
      />
    </section>
  )

  return (
    <div className={'flex flex-col gap-4'}>
      <ChartFrame
        title={t('analyticsNewVsReturning')}
        summary={`${t('analyticsNewUsers')} ${data.newVsReturning.reduce((sum, row) => sum + row.newUsers, 0)}, ${t('analyticsReturningUsers')} ${data.newVsReturning.reduce((sum, row) => sum + row.returningUsers, 0)}`}
        table={{
          columns: [
            t('analyticsDimDate'),
            t('analyticsNewUsers'),
            t('analyticsReturningUsers'),
          ],
          rows: data.newVsReturning.map((row) => [
            formatBucketLabel(row.bucket, locale),
            row.newUsers,
            row.returningUsers,
          ]),
        }}
      >
        <TimeSeriesChart
          data={data.newVsReturning}
          xKey={'bucket'}
          series={[
            { key: 'newUsers', label: t('analyticsNewUsers') },
            { key: 'returningUsers', label: t('analyticsReturningUsers') },
          ]}
          valueFormat={(value) => formatNumber(value, locale)}
        />
      </ChartFrame>

      <div className={'grid gap-4 xl:grid-cols-2'}>
        <section className={'admin-card flex min-w-0 flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsRetention')}</h2>
          <div className={'overflow-x-auto'}>
            <table
              className={'type-caption border-separate border-spacing-0.5'}
            >
              <thead>
                <tr>
                  <th
                    scope={'col'}
                    className={'text-ink-muted pr-2 text-left font-normal'}
                  >
                    {t('analyticsCohort')}
                  </th>
                  <th
                    scope={'col'}
                    className={'text-ink-muted px-1 font-normal'}
                  >
                    {t('analyticsUsers')}
                  </th>
                  {weekLabels.map((label) => (
                    <th
                      key={label}
                      scope={'col'}
                      className={
                        'text-ink-muted px-1 font-normal whitespace-nowrap'
                      }
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.retention.map((row) => (
                  <tr key={row.cohort}>
                    <th
                      scope={'row'}
                      className={
                        'text-ink pr-2 text-left font-normal tabular-nums'
                      }
                    >
                      {row.cohort}
                    </th>
                    <td className={'text-ink px-1 text-right tabular-nums'}>
                      {row.size}
                    </td>
                    {weekLabels.map((label, week) => {
                      const rate = row.rates[week]
                      const level =
                        rate === undefined
                          ? 0
                          : Math.max(1, Math.ceil(rate * 5))
                      return (
                        <td
                          key={label}
                          aria-label={
                            rate === undefined
                              ? undefined
                              : `${row.cohort} ${label}: ${formatPercent(rate, locale)}`
                          }
                          className={
                            'min-w-12 rounded-[3px] px-1 py-1 text-center tabular-nums'
                          }
                          style={{
                            background:
                              rate === undefined
                                ? 'transparent'
                                : `var(--chart-seq-${level})`,
                            color: level >= 4 ? 'var(--surface)' : 'var(--ink)',
                          }}
                        >
                          {rate === undefined
                            ? ''
                            : formatPercent(rate, locale)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className={'admin-card flex min-w-0 flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>
            {t('analyticsTrafficByHour')}
          </h2>
          <HeatmapGrid
            rows={weekdays}
            columns={hours}
            values={heat}
            format={(value) => formatNumber(value, locale)}
          />
        </section>
      </div>

      <div className={'grid gap-4 md:grid-cols-2 xl:grid-cols-3'}>
        {list(t('analyticsDevices'), data.devices)}
        {list(t('analyticsBrowsers'), data.browsers)}
        {list(t('analyticsOperatingSystems'), data.operatingSystems)}
        {list(t('analyticsScreens'), data.screens)}
        {list(t('analyticsLanguages'), data.languages)}
        {list(t('analyticsCountries'), data.countries, countryHref)}
      </div>
    </div>
  )
}
```

리텐션 칸 글자색: 순차 4·5단계는 진한 파랑이라 흰 글자(`--surface`), 그 아래는 잉크색이다(dataviz: 채움 안 라벨은 채움 밝기로 고른다). 다크 테마에서 단계 4·5는 밝은 파랑이므로 `--surface`(어두운 면)가 글자색이 되어 같은 규칙으로 대비가 맞는다.

```tsx
// app/(admin)/admin/analytics/audience/page.tsx
/** 사용자 탭. */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import AudienceView from '@/app/(admin)/admin/analytics/_components/audience-view'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import { getAnalyticsAudience } from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Audience' }

export default async function AudiencePage({
  searchParams,
}: PageProps<'/admin/analytics/audience'>) {
  const [filter, actor] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
  ])
  if (!actor) forbidden()
  const result = await getAnalyticsAudience(actor, filter)
  return result.ok ? (
    <AudienceView data={result.data} filter={filter} />
  ) : (
    <ReportError message={result.message} />
  )
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/components/analytics-audience.test.tsx && pnpm test:types`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/analytics" tests/components/analytics-audience.test.tsx
git commit -m "feat(analytics): add the audience tab with retention and weekday heatmap"
```

---

### Task 14: 성능 탭과 검색 탭 자리

**Files:**

- Create: `app/(admin)/admin/analytics/performance/page.tsx`
- Create: `app/(admin)/admin/analytics/_components/performance-view.tsx`
- Create: `app/(admin)/admin/analytics/search/page.tsx` (계획 C가 채운다)
- Test: `tests/components/analytics-performance.test.tsx`

**Interfaces:**

- Consumes: `getAnalyticsWebVitals`, `WebVitalsReport`, `rateWebVital`, `RatingBar`, `formatVital`, `MetricTable`, `CsvLink`
- Produces: 기본 export `PerformanceView({ data, filter })`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/analytics-performance.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('recharts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('recharts')>()),
  ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
    <div style={{ width: 600, height: 280 }}>{children}</div>
  ),
}))

import PerformanceView from '@/app/(admin)/admin/analytics/_components/performance-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'

describe('PerformanceView', () => {
  it('shows p75 values with their rating in words', () => {
    render(
      <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
        <PerformanceView
          filter={DEFAULT_ANALYTICS_FILTER}
          data={{
            summary: [
              {
                metric: 'LCP',
                p75: 3100,
                good: 5,
                needsImprovement: 4,
                poor: 1,
                samples: 10,
              },
              {
                metric: 'INP',
                p75: null,
                good: 0,
                needsImprovement: 0,
                poor: 0,
                samples: 0,
              },
              {
                metric: 'CLS',
                p75: 0.02,
                good: 10,
                needsImprovement: 0,
                poor: 0,
                samples: 10,
              },
              {
                metric: 'FCP',
                p75: 1200,
                good: 10,
                needsImprovement: 0,
                poor: 0,
                samples: 10,
              },
              {
                metric: 'TTFB',
                p75: 400,
                good: 10,
                needsImprovement: 0,
                poor: 0,
                samples: 10,
              },
            ],
            series: [],
            byDevice: [],
            slowestPages: [
              { path: '/ko/project', metric: 'LCP', p75: 4200, samples: 6 },
            ],
          }}
        />
      </AdminI18nProvider>
    )
    const lcp = screen.getByRole('region', { name: 'LCP' })
    expect(lcp).toHaveTextContent('3.10 s')
    expect(lcp).toHaveTextContent('Needs improvement')
    expect(screen.getByRole('region', { name: 'INP' })).toHaveTextContent('—')
    expect(screen.getByText('/ko/project')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/components/analytics-performance.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```tsx
// app/(admin)/admin/analytics/_components/performance-view.tsx
'use client'

/** 성능 탭: Web Vitals 지표별 p75와 등급 분포, LCP·INP·CLS 추이(지표마다 따로 그려 단위를 섞지 않는다), 기기별, 느린 페이지. */
import ChartFrame from '@/app/(admin)/admin/analytics/_components/chart-frame'
import CsvLink from '@/app/(admin)/admin/analytics/_components/csv-link'
import MetricTable from '@/app/(admin)/admin/analytics/_components/metric-table'
import RatingBar from '@/app/(admin)/admin/analytics/_components/rating-bar'
import TimeSeriesChart from '@/app/(admin)/admin/analytics/_components/time-series-chart'
import {
  formatBucketLabel,
  formatNumber,
  formatVital,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AdminMessageKey } from '@/lib/admin-i18n'
import type { WebVitalName, WebVitalRating } from '@/lib/analytics/events'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import { rateWebVital } from '@/lib/analytics/metrics'
import type { WebVitalsReport } from '@/lib/server/analytics/queries/vitals'

const RATING_LABEL: Record<WebVitalRating, AdminMessageKey> = {
  good: 'analyticsRatingGood',
  'needs-improvement': 'analyticsRatingNeedsImprovement',
  poor: 'analyticsRatingPoor',
}

const TREND_METRICS: WebVitalName[] = ['LCP', 'INP', 'CLS']

export default function PerformanceView({
  data,
  filter,
}: {
  data: WebVitalsReport
  filter: AnalyticsFilter
}) {
  const { t, locale } = useAdminI18n()
  const labels = {
    good: t('analyticsRatingGood'),
    needsImprovement: t('analyticsRatingNeedsImprovement'),
    poor: t('analyticsRatingPoor'),
  }

  return (
    <div className={'flex flex-col gap-4'}>
      <div className={'flex items-center justify-between gap-2'}>
        <h2 className={'type-title text-ink'}>{t('analyticsWebVitals')}</h2>
        <CsvLink
          report={'web_vitals'}
          filter={filter}
          label={t('analyticsDownloadCsv')}
        />
      </div>
      <div className={'grid gap-3 md:grid-cols-2 xl:grid-cols-5'}>
        {data.summary.map((row) => (
          <section
            key={row.metric}
            aria-label={row.metric}
            className={'admin-card flex flex-col gap-2'}
          >
            <span className={'type-caption text-ink-muted'}>{row.metric}</span>
            <span className={'type-heading-1 text-ink'}>
              {formatVital(row.metric, row.p75)}
            </span>
            {row.p75 !== null && (
              <span className={'type-caption text-ink-secondary'}>
                {t(RATING_LABEL[rateWebVital(row.metric, row.p75)])}
              </span>
            )}
            <RatingBar
              good={row.good}
              needsImprovement={row.needsImprovement}
              poor={row.poor}
              labels={labels}
            />
            <span className={'type-caption text-ink-muted'}>
              {t('analyticsSamples')} {formatNumber(row.samples, locale)}
            </span>
          </section>
        ))}
      </div>

      <div className={'grid gap-4 xl:grid-cols-3'}>
        {TREND_METRICS.map((metric) => {
          const points = data.series.filter((point) => point.metric === metric)
          return (
            <ChartFrame
              key={metric}
              title={`${metric} ${t('analyticsTrend')}`}
              summary={`${metric} p75 ${points.map((point) => formatVital(metric, point.p75)).join(', ')}`}
              table={{
                columns: [t('analyticsDimDate'), `${metric} p75`],
                rows: points.map((point) => [
                  formatBucketLabel(point.bucket, locale),
                  formatVital(metric, point.p75),
                ]),
              }}
            >
              <TimeSeriesChart
                data={points.map((point) => ({
                  bucket: point.bucket,
                  p75: point.p75,
                }))}
                xKey={'bucket'}
                series={[{ key: 'p75', label: `${metric} p75` }]}
                valueFormat={(value) => formatVital(metric, value)}
                height={200}
              />
            </ChartFrame>
          )
        })}
      </div>

      <div className={'grid gap-4 xl:grid-cols-2'}>
        <section className={'admin-card flex min-w-0 flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>{t('analyticsByDevice')}</h2>
          <MetricTable
            caption={t('analyticsByDevice')}
            rows={data.byDevice}
            rowKey={(row) => `${row.deviceType}/${row.metric}`}
            columns={[
              {
                key: 'device',
                label: t('analyticsDevice'),
                render: (row) => row.deviceType,
              },
              {
                key: 'metric',
                label: t('analyticsMetric'),
                render: (row) => row.metric,
              },
              {
                key: 'p75',
                label: 'p75',
                numeric: true,
                render: (row) => formatVital(row.metric, row.p75),
              },
              {
                key: 'samples',
                label: t('analyticsSamples'),
                numeric: true,
                render: (row) => formatNumber(row.samples, locale),
              },
            ]}
          />
        </section>
        <section className={'admin-card flex min-w-0 flex-col gap-3'}>
          <h2 className={'type-title text-ink'}>
            {t('analyticsSlowestPages')}
          </h2>
          <MetricTable
            caption={t('analyticsSlowestPages')}
            rows={data.slowestPages}
            rowKey={(row) => `${row.path}/${row.metric}`}
            columns={[
              {
                key: 'path',
                label: t('analyticsPage'),
                render: (row) => row.path,
              },
              {
                key: 'metric',
                label: t('analyticsMetric'),
                render: (row) => row.metric,
              },
              {
                key: 'p75',
                label: 'p75',
                numeric: true,
                render: (row) => formatVital(row.metric, row.p75),
              },
              {
                key: 'samples',
                label: t('analyticsSamples'),
                numeric: true,
                render: (row) => formatNumber(row.samples, locale),
              },
            ]}
          />
        </section>
      </div>
    </div>
  )
}
```

```tsx
// app/(admin)/admin/analytics/performance/page.tsx
/** 성능 탭. */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import PerformanceView from '@/app/(admin)/admin/analytics/_components/performance-view'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import { getAnalyticsWebVitals } from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Performance' }

export default async function PerformancePage({
  searchParams,
}: PageProps<'/admin/analytics/performance'>) {
  const [filter, actor] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
  ])
  if (!actor) forbidden()
  const result = await getAnalyticsWebVitals(actor, filter)
  return result.ok ? (
    <PerformanceView data={result.data} filter={filter} />
  ) : (
    <ReportError message={result.message} />
  )
}
```

```tsx
// app/(admin)/admin/analytics/search/page.tsx
/** 검색 탭. Search Console 연동은 계획 C가 이 화면을 채운다. 그 전까지 탭 링크가 404가 되지 않게 안내만 보여 준다. */
import type { Metadata } from 'next'
import AdminEmptyState from '@/app/components/admin/empty-state'
import { getAdminLocale, getAdminMessages } from '@/lib/admin-i18n/server'

export const metadata: Metadata = { title: 'Search' }

export default async function SearchPage() {
  const t = getAdminMessages(await getAdminLocale())
  return (
    <AdminEmptyState
      title={t.analyticsTabSearch}
      description={t.analyticsSearchConsoleSoon}
    />
  )
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/components/analytics-performance.test.tsx && pnpm test:types`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/analytics" tests/components/analytics-performance.test.tsx
git commit -m "feat(analytics): add the performance tab and the search tab placeholder"
```

---

### Task 15: 탐색 탭

**Files:**

- Create: `app/(admin)/admin/analytics/explore/page.tsx`
- Create: `app/(admin)/admin/analytics/_components/explore-view.tsx`
- Test: `tests/components/analytics-explore.test.tsx`

**Interfaces:**

- Consumes: `getAnalyticsTable(actor, 'explore', filter, explore)`, `parseExploreInput`, `ExploreInput`, `AnalyticsTable`, `SESSION_DIMENSIONS`(값 목록은 클라이언트에 상수로 복사하지 않고 서버 페이지가 props로 넘긴다), `SESSION_METRIC_KEYS`
- Produces: 기본 export `ExploreView({ table, explore, filter, dimensionOptions, metricOptions })`

- [ ] **Step 1: Write the failing test**

```tsx
// tests/components/analytics-explore.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const navigation = vi.hoisted(() => ({ replace: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: navigation.replace }),
  usePathname: () => '/en/admin/analytics/explore',
  useSearchParams: () => new URLSearchParams('range=7d'),
}))

import ExploreView from '@/app/(admin)/admin/analytics/_components/explore-view'
import AdminI18nProvider from '@/app/components/admin/admin-i18n-provider'
import { getAdminMessages } from '@/lib/admin-i18n'
import { DEFAULT_ANALYTICS_FILTER } from '@/lib/analytics/filters'

describe('ExploreView', () => {
  it('renders the table and applies a new breakdown through the URL', async () => {
    render(
      <AdminI18nProvider locale={'en'} messages={getAdminMessages('en')}>
        <ExploreView
          filter={{ ...DEFAULT_ANALYTICS_FILTER, range: '7d' }}
          explore={{
            dimensions: ['channel'],
            metrics: ['sessions'],
            limit: 100,
          }}
          table={{
            columns: ['channel', 'sessions'],
            rows: [{ channel: 'Direct', sessions: 4 }],
          }}
          dimensionOptions={['channel', 'deviceType']}
          metricOptions={['sessions', 'users']}
        />
      </AdminI18nProvider>
    )
    expect(screen.getByRole('cell', { name: '4' })).toBeInTheDocument()
    await userEvent.selectOptions(
      screen.getByLabelText('Break down by'),
      'deviceType'
    )
    await userEvent.click(screen.getByRole('checkbox', { name: 'Users' }))
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(navigation.replace).toHaveBeenCalledWith(
      '/en/admin/analytics/explore?range=7d&dims=deviceType&metrics=sessions%2Cusers',
      { scroll: false }
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/components/analytics-explore.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Write the implementation**

```tsx
// app/(admin)/admin/analytics/_components/explore-view.tsx
'use client'

/**
 * 탐색: 차원 1~2개 × 지표 여러 개를 골라 표로 본다(GA4 자유 형식 탐색 대응). 고른 값은 URL(dims, metrics)에 저장한다.
 * 첫 지표는 막대 목록으로도 보여 준다. 모든 데이터는 표와 CSV로 볼 수 있다.
 */
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import BarList from '@/app/(admin)/admin/analytics/_components/bar-list'
import CsvLink from '@/app/(admin)/admin/analytics/_components/csv-link'
import MetricTable from '@/app/(admin)/admin/analytics/_components/metric-table'
import {
  formatDuration,
  formatNumber,
  formatPercent,
} from '@/app/(admin)/admin/analytics/_lib/format'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { AdminMessageKey } from '@/lib/admin-i18n'
import type { AnalyticsFilter } from '@/lib/analytics/filters'
import type { SessionMetricKey } from '@/lib/analytics/metrics'
import type {
  AnalyticsTable,
  ExploreInput,
} from '@/lib/server/services/admin/analytics'

const DIMENSION_LABELS: Record<string, AdminMessageKey> = {
  date: 'analyticsDimDate',
  channel: 'analyticsChannel',
  source: 'analyticsDimSource',
  medium: 'analyticsDimMedium',
  campaign: 'analyticsDimCampaign',
  referrer: 'analyticsDimReferrer',
  landingPath: 'analyticsDimLandingPath',
  landingGroup: 'analyticsDimLandingGroup',
  deviceType: 'analyticsDevice',
  browser: 'analyticsDimBrowser',
  os: 'analyticsDimOs',
  screen: 'analyticsDimScreen',
  country: 'analyticsCountry',
  language: 'analyticsDimLanguage',
  visitorType: 'analyticsVisitorType',
  weekday: 'analyticsDimWeekday',
  hour: 'analyticsDimHour',
}

const METRIC_LABELS: Record<SessionMetricKey, AdminMessageKey> = {
  users: 'analyticsUsers',
  newUsers: 'analyticsNewUsers',
  sessions: 'analyticsSessions',
  engagedSessions: 'analyticsEngagedSessions',
  engagementRate: 'analyticsEngagementRate',
  bounceRate: 'analyticsBounceRate',
  views: 'analyticsViews',
  viewsPerSession: 'analyticsViewsPerSession',
  avgEngagementSeconds: 'analyticsAvgEngagement',
  keyEvents: 'analyticsKeyEvents',
}

export default function ExploreView({
  table,
  explore,
  filter,
  dimensionOptions,
  metricOptions,
}: {
  table: AnalyticsTable
  explore: ExploreInput
  filter: AnalyticsFilter
  dimensionOptions: readonly string[]
  metricOptions: readonly SessionMetricKey[]
}) {
  const { t, locale } = useAdminI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [first, setFirst] = useState<string>(explore.dimensions[0] ?? 'channel')
  const [second, setSecond] = useState<string>(explore.dimensions[1] ?? '')
  const [metrics, setMetrics] = useState<SessionMetricKey[]>(explore.metrics)

  function apply() {
    const params = new URLSearchParams(searchParams)
    params.set('dims', [first, second].filter(Boolean).join(','))
    params.set('metrics', metrics.join(','))
    startTransition(() =>
      router.replace(`${pathname}?${params}`, { scroll: false })
    )
  }

  const formatMetric = (metric: string, value: number) =>
    metric === 'engagementRate' || metric === 'bounceRate'
      ? formatPercent(value, locale)
      : metric === 'avgEngagementSeconds'
        ? formatDuration(value)
        : formatNumber(value, locale)
  const label = (column: string) =>
    t(
      DIMENSION_LABELS[column] ??
        METRIC_LABELS[column as SessionMetricKey] ??
        'analyticsMetric'
    )
  const firstMetric = explore.metrics[0]!

  return (
    <div className={'flex flex-col gap-4'}>
      <section
        className={'admin-card flex flex-wrap items-end gap-3'}
        aria-busy={pending}
      >
        <label className={'flex min-w-44 flex-col gap-1'}>
          <span className={'admin-field-label'}>
            {t('analyticsExploreDimensions')}
          </span>
          <select
            className={'admin-input min-h-11'}
            value={first}
            onChange={(event) => setFirst(event.target.value)}
          >
            {dimensionOptions.map((dimension) => (
              <option key={dimension} value={dimension}>
                {label(dimension)}
              </option>
            ))}
          </select>
        </label>
        <label className={'flex min-w-44 flex-col gap-1'}>
          <span className={'admin-field-label'}>
            {t('analyticsExploreSecondDimension')}
          </span>
          <select
            className={'admin-input min-h-11'}
            value={second}
            onChange={(event) => setSecond(event.target.value)}
          >
            <option value={''}>{t('analyticsNone')}</option>
            {dimensionOptions
              .filter((dimension) => dimension !== first)
              .map((dimension) => (
                <option key={dimension} value={dimension}>
                  {label(dimension)}
                </option>
              ))}
          </select>
        </label>
        <fieldset className={'flex flex-wrap gap-x-4 gap-y-1'}>
          <legend className={'admin-field-label mb-1'}>
            {t('analyticsExploreMetrics')}
          </legend>
          {metricOptions.map((metric) => (
            <label
              key={metric}
              className={
                'type-body-sm text-ink flex min-h-11 items-center gap-2'
              }
            >
              <input
                type={'checkbox'}
                checked={metrics.includes(metric)}
                onChange={(event) =>
                  setMetrics((current) =>
                    event.target.checked
                      ? [...current, metric]
                      : current.filter((item) => item !== metric)
                  )
                }
              />
              {t(METRIC_LABELS[metric])}
            </label>
          ))}
        </fieldset>
        <button
          type={'button'}
          className={'admin-btn-primary'}
          onClick={apply}
          disabled={metrics.length === 0}
        >
          {t('analyticsExploreApply')}
        </button>
      </section>

      <section className={'admin-card flex min-w-0 flex-col gap-3'}>
        <div className={'flex flex-wrap items-center justify-between gap-2'}>
          <h2 className={'type-title text-ink'}>
            {t(METRIC_LABELS[firstMetric])}
          </h2>
          <CsvLink
            report={'explore'}
            filter={filter}
            label={t('analyticsDownloadCsv')}
            extra={{
              dims: explore.dimensions.join(','),
              metrics: explore.metrics.join(','),
            }}
          />
        </div>
        <BarList
          valueLabel={t(METRIC_LABELS[firstMetric])}
          format={(value) => formatMetric(firstMetric, value)}
          items={table.rows.slice(0, 15).map((row) => ({
            label: explore.dimensions
              .map((dimension) => String(row[dimension] ?? ''))
              .join(' · '),
            value: Number(row[firstMetric] ?? 0),
          }))}
        />
        <MetricTable
          caption={t('analyticsTabExplore')}
          rows={table.rows}
          rowKey={(row) =>
            explore.dimensions
              .map((dimension) => String(row[dimension]))
              .join('/')
          }
          columns={table.columns.map((column) => {
            const isMetric = (explore.metrics as string[]).includes(column)
            return {
              key: column,
              label: label(column),
              numeric: isMetric,
              render: (row: AnalyticsTable['rows'][number]) =>
                isMetric
                  ? formatMetric(column, Number(row[column] ?? 0))
                  : String(row[column] ?? ''),
            }
          })}
        />
      </section>
    </div>
  )
}
```

```tsx
// app/(admin)/admin/analytics/explore/page.tsx
/** 탐색 탭. 고를 수 있는 차원·지표 목록은 서버가 넘긴다(서버 전용 모듈을 클라이언트가 import하지 않게). */
import type { Metadata } from 'next'
import { forbidden } from 'next/navigation'
import ExploreView from '@/app/(admin)/admin/analytics/_components/explore-view'
import { ReportError } from '@/app/(admin)/admin/analytics/_components/report-states'
import { readAnalyticsFilter } from '@/app/(admin)/admin/analytics/_lib/read-filter'
import { SESSION_METRIC_KEYS } from '@/lib/analytics/metrics'
import { SESSION_DIMENSIONS } from '@/lib/server/analytics/queries/sessions'
import {
  getAnalyticsTable,
  parseExploreInput,
} from '@/lib/server/services/admin/analytics'
import { getWebActor } from '@/lib/server/services/admin/web-actor'

export const metadata: Metadata = { title: 'Explore' }

export default async function ExplorePage({
  searchParams,
}: PageProps<'/admin/analytics/explore'>) {
  const [filter, actor, params] = await Promise.all([
    readAnalyticsFilter(searchParams),
    getWebActor(),
    searchParams,
  ])
  if (!actor) forbidden()
  const explore = parseExploreInput(params)
  const result = await getAnalyticsTable(actor, 'explore', filter, explore)
  if (!result.ok) return <ReportError message={result.message} />
  return (
    <ExploreView
      table={result.data}
      explore={explore}
      filter={filter}
      dimensionOptions={SESSION_DIMENSIONS}
      metricOptions={SESSION_METRIC_KEYS}
    />
  )
}
```

`explore-view.tsx`는 `@/lib/server/services/admin/analytics`에서 **타입만** import한다(`import type`). 빌드가 서버 모듈을 클라이언트 번들에 넣으려 하면 import가 `import type`인지 확인한다.

- [ ] **Step 4: Run tests**

Run: `pnpm test tests/components/analytics-explore.test.tsx && pnpm test:types`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/(admin)/admin/analytics" tests/components/analytics-explore.test.tsx
git commit -m "feat(analytics): add the explore tab with free-form breakdowns"
```

---

### Task 16: 개발용 시드 데이터

**Files:**

- Create: `scripts/seed/analytics.ts`
- Modify: `scripts/seed-dev.ts`
- Test: `tests/scripts/seed-analytics.test.ts`

**Interfaces:**

- Consumes: 계획 A 테이블, `CHANNELS`
- Produces: `SEED_VISITOR_PREFIX = 'de5eed00'`, `buildAnalyticsSeed(options: { now: Date; days: number; seed: number; paths: string[] }): { sessions: Array<typeof analyticsSessions.$inferInsert>; pageViews: Array<typeof analyticsPageViews.$inferInsert>; events: Array<Omit<typeof analyticsEvents.$inferInsert, 'id'>> }`

- [ ] **Step 1: Write the failing test**

```ts
// tests/scripts/seed-analytics.test.ts
import { describe, expect, it } from 'vitest'
import {
  SEED_VISITOR_PREFIX,
  buildAnalyticsSeed,
} from '@/scripts/seed/analytics'

const options = {
  now: new Date('2026-10-14T05:00:00.000Z'),
  days: 30,
  seed: 7,
  paths: ['/ko', '/ko/session/25-26', '/en/project/25-26', '/ko/calendar'],
}

describe('buildAnalyticsSeed', () => {
  it('is deterministic for the same seed', () => {
    expect(buildAnalyticsSeed(options)).toEqual(buildAnalyticsSeed(options))
  })

  it('builds consistent rows inside the date range', () => {
    const { sessions, pageViews, events } = buildAnalyticsSeed(options)
    const sessionIds = new Set(sessions.map((session) => session.id))
    const viewIds = new Set(pageViews.map((view) => view.id))
    const earliest = options.now.getTime() - 30 * 24 * 3600 * 1000

    expect(sessions.length).toBeGreaterThan(100)
    expect(
      sessions.every((session) =>
        session.visitorId.startsWith(SEED_VISITOR_PREFIX)
      )
    ).toBe(true)
    expect(
      sessions.every(
        (session) =>
          session.startedAt.getTime() >= earliest &&
          session.startedAt <= options.now
      )
    ).toBe(true)
    expect(pageViews.every((view) => sessionIds.has(view.sessionId))).toBe(true)
    expect(
      events.every(
        (event) =>
          viewIds.has(event.pageViewId) && sessionIds.has(event.sessionId)
      )
    ).toBe(true)
    expect(pageViews.filter((view) => view.sequence === 1)).toHaveLength(
      sessions.length
    )
    expect(events.some((event) => event.name === 'web_vital')).toBe(true)
    expect(events.some((event) => event.name === 'cta')).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/scripts/seed-analytics.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the generator**

```ts
// scripts/seed/analytics.ts
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
```

`scripts/seed-dev.ts`: import를 추가한다.

```ts
import {
  analyticsEvents,
  analyticsPageViews,
  analyticsSessions,
} from '../db/schema/analytics'
import { SEED_VISITOR_PREFIX, buildAnalyticsSeed } from './seed/analytics'
```

기존 시드 행 삭제 단계가 끝나는 곳에 이전 분석 시드 삭제를, 세션·프로젝트 시드를 넣은 뒤(파일의 마지막 insert 다음)에 분석 시드 삽입을 추가한다. `like`와 `sql`은 `drizzle-orm`에서 import한다(이미 `like`는 import되어 있다).

```ts
// 분석 시드는 방문자 ID 접두사로 구분한다. 세션을 지우면 조회·이벤트가 함께 지워진다.
await db
  .delete(analyticsSessions)
  .where(
    like(sql`${analyticsSessions.visitorId}::text`, `${SEED_VISITOR_PREFIX}%`)
  )
```

```ts
const analyticsSeed = buildAnalyticsSeed({
  now: new Date(),
  days: 90,
  seed: 2026,
  paths: [
    '/ko',
    '/en',
    `/ko/session/${SEED_GENERATION_NAME}`,
    `/ko/project/${SEED_GENERATION_NAME}`,
    `/ko/member/${SEED_GENERATION_NAME}`,
    '/ko/calendar',
    '/en/session',
  ],
})
// 한 번에 너무 많은 파라미터를 보내지 않게 나눠 넣는다.
for (let index = 0; index < analyticsSeed.sessions.length; index += 500) {
  await db
    .insert(analyticsSessions)
    .values(analyticsSeed.sessions.slice(index, index + 500))
}
for (let index = 0; index < analyticsSeed.pageViews.length; index += 500) {
  await db
    .insert(analyticsPageViews)
    .values(analyticsSeed.pageViews.slice(index, index + 500))
}
for (let index = 0; index < analyticsSeed.events.length; index += 500) {
  await db
    .insert(analyticsEvents)
    .values(analyticsSeed.events.slice(index, index + 500))
}
console.log(
  `analytics seed: ${analyticsSeed.sessions.length} sessions, ${analyticsSeed.pageViews.length} views`
)
```

`console.log` 형식은 seed-dev.ts의 다른 출력에 맞춘다.

- [ ] **Step 4: Run tests and the seed locally**

Run: `pnpm test tests/scripts/seed-analytics.test.ts`
Expected: PASS

Run: `AUTH_DRIZZLE_URL=postgres://gdgoc:gdgoc@127.0.0.1:5432/gdgoc_dev pnpm db:seed`
Expected: `analytics seed: …` 출력. 다시 실행해도 행 수가 두 배가 되지 않는다(삭제 후 삽입).

- [ ] **Step 5: Commit**

```bash
git add scripts/seed/analytics.ts scripts/seed-dev.ts tests/scripts/seed-analytics.test.ts
git commit -m "chore(seed): generate 90 days of sample analytics data"
```

---

### Task 17: e2e, 브라우저 확인, 문서

**Files:**

- Create: `tests/e2e/admin-analytics.spec.ts`
- Modify: `docs/architecture/analytics.md` (대시보드 절)

- [ ] **Step 1: Write the e2e spec**

```ts
// tests/e2e/admin-analytics.spec.ts
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
```

MEMBER 계정의 관리자 언어가 영어가 아니면(세션 시드의 쿠키 확인) 기대 문구를 해당 언어로 바꾼다.

- [ ] **Step 2: Run e2e against the local DB**

Run: `AUTH_DRIZZLE_URL=postgres://gdgoc:gdgoc@127.0.0.1:5432/gdgoc_dev pnpm test:e2e:prod tests/e2e/admin-analytics.spec.ts`
Expected: PASS

- [ ] **Step 3: Verify in a real browser**

`agent-browser` 스킬로(또는 Playwright MCP) 로컬 운영 빌드(`pnpm build && pnpm exec next start --port 3100`, 시드한 로컬 DB)에서 확인한다:

1. `/ko/admin/analytics`의 7개 탭을 **라이트·다크**, **1440px·390px** 폭에서 열어 스크린샷을 남긴다.
2. 차트 라벨 겹침, 표 가로 넘침, 모바일에서 필터 바 줄바꿈, 44px 터치 영역을 눈으로 확인한다(dataviz 7단계: 검증기는 레이아웃을 보지 않는다).
3. 필터를 바꿀 때 이전 화면이 유지되고 "갱신 중…"이 보이는지, 공유 링크(복사한 URL)를 새 탭에서 열면 같은 화면인지 확인한다.
4. 기간을 12개월로 바꿔 응답 시간을 확인한다. 10초에 가까우면 위험 메모로 남긴다.
5. 운영체제의 "동작 줄이기"를 켠 상태에서 차트 애니메이션이 없는지 확인한다.

문제가 있으면 해당 Task 파일을 고치고 그 Task의 테스트를 다시 돌린다.

- [ ] **Step 4: Document the dashboard**

`docs/architecture/analytics.md` 끝에 추가:

```markdown
## 대시보드

`/admin/analytics`(권한 `get analyticsPage`, 승인된 모든 역할). 탭: 개요·유입·참여·사용자·성능·검색·탐색.

- 필터는 URL 쿼리(`range`, `from`, `to`, `compare`, `channel`, `device`, `country`, `locale`, `visitor`, `group`, `path`, `internal`)에만 있다. `lib/analytics/filters.ts`.
- 기간은 서울 날짜 경계다(`lib/analytics/date-range.ts`). 저장된 timestamp는 UTC이고 SQL은 `+ interval '9 hours'`로 서울 구간을 만든다.
- 세션 지표는 `aggregateSessions`(`lib/server/analytics/queries/sessions.ts`) 하나가 차원만 바꿔 만든다. 새 차원은 `SESSION_DIMENSIONS`와 `dimensionSql`에 추가한다.
- 지표 정의·임계값: `lib/analytics/metrics.ts`. 참여 세션 = 10초 이상 또는 2회 이상 조회 또는 CTA.
- 분석 쿼리는 10초 제한 트랜잭션에서 돈다. 넘으면 화면에 "기간을 줄여 보세요"가 뜬다. 자주 넘으면 일 단위 롤업 테이블을 추가한다.
- CSV: `GET /api/admin/analytics/export?report=…`(`ANALYTICS_TABLE_REPORTS`). 실시간: `GET /api/admin/analytics/realtime`.
- 차트 색은 `app/admin.css`의 `--chart-*`(dataviz 스킬로 검증). 범주 색은 고정 순서, 8개를 넘으면 "Other"로 접는다.
- 개발 데이터: `pnpm db:seed`가 90일치 가상 방문을 넣는다(방문자 ID 접두사 `de5eed00`).
```

- [ ] **Step 5: Final checks and commit**

Run: `pnpm test:types && pnpm lint --max-warnings=0 && pnpm test`
Expected: 모두 통과

```bash
git add tests/e2e/admin-analytics.spec.ts docs/architecture/analytics.md
git commit -m "test(analytics): cover the dashboard end to end and document it"
```
