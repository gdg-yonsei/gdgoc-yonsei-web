# GYMS 웹 분석(Analytics) 설계

- 날짜: 2026-10-14
- 상태: 초안 (사용자 검토 대기)
- 브랜치: `feat/gyms-analytics`

## 1. 목적과 범위

공개 사이트 방문자의 행동 데이터를 직접 수집하고, GYMS에서 그래프와 표로 분석한다. 목표는 세 가지다.

1. **SEO 개선**: 어떤 검색어·검색 엔진·AI 어시스턴트로 들어오는지, 검색 노출 대비 클릭이 낮은 페이지가 무엇인지 안다.
2. **조회수 증가**: 어떤 채널과 콘텐츠가 방문을 만드는지 안다.
3. **체류 시간 증가**: 어느 페이지에서 오래 머물고, 어디까지 스크롤하고, 어디서 떠나는지 안다.

### 성공 기준

- 공개 사이트의 페이지 조회, 참여 시간, 스크롤 깊이, 링크·CTA 클릭, Web Vitals가 Postgres에 쌓인다.
- 승인된 모든 멤버가 GYMS `분석` 메뉴에서 7개 보고서(개요·유입·참여·사용자·성능·검색·탐색)를 날짜 범위와 필터로 조회한다.
- Search Console 자격 증명을 넣으면 검색어·노출·CTR·순위가 같은 화면에 보이고, 없으면 설정 안내가 보인다.
- MCP 클라이언트가 같은 데이터를 읽기 도구로 조회한다.
- 공개 사이트의 JS 성능 예산(`pnpm perf:budget`)이 계속 통과한다.
- 개인정보처리방침(한·영)이 수집 항목과 거부 방법을 안내하고, 거부 버튼과 GPC가 실제로 수집을 멈춘다.
- GA4가 사이트에서 제거된다.

### 포함

자체 수집 스크립트와 수집 API, 분석 테이블 3개, GYMS 분석 화면 7개, CSV 내보내기, Search Console 연동,
MCP 분석 도구, 개인정보처리방침 갱신과 수집 거부 버튼, GA4 제거, 개발용 시드 데이터.

### 제외 (필요해지면 별도 설계)

광고·전환 기여(attribution) 모델, 오디언스·리마케팅, BigQuery식 원시 데이터 내보내기, 세션 녹화·히트맵,
도시 단위 위치(GeoIP), JS 오류 수집, 일 단위 롤업 테이블, 정기 리포트 메일, GA4 과거 데이터 가져오기.

## 2. 결정 기록

| 결정        | 선택                                                | 이유                                                                                                    |
| ----------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 데이터 출처 | 자체 수집                                           | 사이트 데이터(세션·프로젝트)와 바로 연결, 스크롤·참여 시간·Web Vitals를 원하는 정의로 수집, 샘플링 없음 |
| 방문자 식별 | localStorage의 익명 무작위 ID                       | 신규/재방문, 리텐션 코호트가 가능하다. IP는 저장하지 않는다                                             |
| 저장 방식   | Postgres 원시 이벤트를 SQL로 바로 집계(롤업 없음)   | 동아리 사이트 규모에서 충분히 빠르다. 느려지면 수집 형식을 바꾸지 않고 롤업을 추가할 수 있다            |
| 차트        | Recharts, 분석 라우트에서만 로드                    | React 19 호환, 기수마다 바뀌는 개발자가 유지하기 쉽다. 공개 사이트 번들에는 들어가지 않는다             |
| 조회 권한   | 승인된 모든 역할(MEMBER·CORE·LEAD·ALUMNUS)          | 데이터가 익명이라 위험이 낮고, 멤버가 자기 콘텐츠 성과를 볼 수 있다                                     |
| 위치        | 브라우저 시간대·언어로 국가 추정                    | 사이트가 Cloudflare 뒤에 있지 않아 국가 헤더가 없다. GeoIP는 라이선스와 갱신 부담이 있다                |
| 내부 트래픽 | GYMS 로그인 쿠키가 있는 세션을 `isInternal`로 표시  | 운영진 방문이 지표를 왜곡하지 않게 기본 필터에서 뺀다                                                   |
| 수집 거부   | GPC 신호 존중 + 개인정보처리방침 페이지의 거부 버튼 | 처리방침에 거부 방법을 안내해야 하고, 실제로 동작해야 한다                                              |
| 보관 기간   | 원시 데이터 26개월                                  | 전년 동기 비교가 가능하다. 스케줄러가 없으므로 수집 API가 하루 한 번 정리한다                           |
| GA4         | 제거                                                | 자체 수집으로 대체. GA 속성의 과거 데이터는 Google Analytics 화면에서 보관 기간 동안 계속 볼 수 있다    |

## 3. 아키텍처

```text
공개 페이지 (app/(home)/[lang]/layout.tsx)
  └─ <AnalyticsTracker/>  ('use client', 3KB 이하)
       │ navigator.sendBeacon (배치, JSON)
       ▼
POST /api/pulse ── 출처·크기·zod 검증 → 봇·속도 제한 → 보강(UA, 채널, 국가, 내부 여부)
       │                                                       │
       ▼                                                       ▼ after(): 하루 한 번 26개월 지난 행 삭제
Postgres: analytics_sessions · analytics_page_views · analytics_events
       ▲
       │ SQL 집계 (statement_timeout 10s)
lib/server/analytics/queries/*  ◄── lib/server/services/admin/analytics.ts (authorize get analyticsPage)
       ▲                                   ▲                         ▲
GYMS /admin/analytics/* (RSC + Recharts)   MCP 분석 도구             GET /api/admin/analytics/export (CSV)

Search Console API ◄── lib/server/analytics/search-console/* ('use cache: remote', 6시간)
```

수집 엔드포인트 경로는 일반적인 광고 차단 목록이 막는 단어(`analytics`, `collect`, `track`)를 피해 `/api/pulse`로 둔다.
수집 거부는 GPC와 처리방침의 거부 버튼으로 보장한다.

### 파일 배치

```text
app/components/site/analytics-tracker.tsx      수집 스크립트(클라이언트)
app/components/site/analytics-opt-out.tsx      처리방침의 거부 토글(클라이언트)
app/api/pulse/route.ts                         수집 API(얇은 어댑터)
app/api/admin/analytics/export/route.ts        CSV 내보내기
app/(admin)/admin/analytics/                   분석 화면(layout, 탭별 page, _components/charts)
lib/analytics/                                 순수 함수(클라이언트·서버 공용): 이벤트 타입, 세션 규칙, 지표 임계값
lib/server/analytics/collect/                  수집 검증·보강·저장(UA 파서, 채널 분류, 시간대→국가, 봇 판정, 속도 제한)
lib/server/analytics/queries/                  보고서별 SQL 집계
lib/server/analytics/search-console/           Google 토큰 발급과 Search Analytics 조회
lib/server/services/admin/analytics.ts         권한 확인 후 queries 호출(웹·MCP 공유)
lib/mcp/tools/analytics.ts                     MCP 도구
db/schema/analytics.ts                         테이블 3개
```

## 4. 수집 스크립트

### 4-1. 식별자

| 식별자       | 저장                                         | 규칙                                                                            |
| ------------ | -------------------------------------------- | ------------------------------------------------------------------------------- |
| `visitorId`  | localStorage `gyms_vid`                      | 처음 방문 때 `crypto.randomUUID()`. 없었으면 이번 세션을 신규 방문자로 표시한다 |
| `sessionId`  | localStorage `gyms_sid` (+ 마지막 활동 시각) | 마지막 활동 후 **30분**이 지나면 새 세션(GA4와 같은 기준). 탭끼리 공유한다      |
| `pageViewId` | 메모리                                       | 페이지 조회마다 새 UUID. 참여 시간·스크롤·이벤트를 이 조회에 묶는다             |

localStorage를 쓸 수 없으면 페이지 로드마다 임시 ID를 쓰고 신규 방문자로 표시하지 않는다.

### 4-2. 수집하지 않는 경우

`navigator.globalPrivacyControl === true`, localStorage `gyms_optout === '1'`, `navigator.webdriver === true`.
이 경우 스크립트는 아무것도 보내지 않고 식별자도 만들지 않는다.

### 4-3. 이벤트

| 이벤트       | 보내는 때                                     | 내용                                                                                                                                                            |
| ------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page_view`  | 첫 로드, `usePathname`이 바뀐 soft navigation | 경로(쿼리 제외), 언어, 제목, 리퍼러(세션 첫 조회만 `document.referrer`), UTM 5종, 화면·뷰포트 크기, 브라우저 언어, 시간대, 신규 방문자·세션 시작 여부, 404 여부 |
| `engagement` | 탭 숨김·`pagehide`·다음 페이지로 이동할 때    | 해당 조회의 **누적** 참여 시간(ms)과 최대 스크롤 비율(%). 서버는 기존 값과 큰 값을 취하므로 여러 번 와도 안전하다                                               |
| `click`      | 문서에 위임한 클릭 리스너                     | 외부 링크(`outbound`), 파일 다운로드(`download`: pdf·zip·pptx 등), `mailto:`/`tel:`(`contact`), `data-analytics="라벨"`이 붙은 요소(`cta`, 핵심 이벤트)         |
| `web_vital`  | `next/web-vitals`의 `useReportWebVitals`      | LCP·INP·CLS·FCP·TTFB 값, 등급, 내비게이션 유형                                                                                                                  |

- **참여 시간**은 탭이 보이고 포커스가 있는 시간만 센다(GA4 `user_engagement`와 같은 의미).
- **404**: `[lang]/not-found.tsx`가 `data-analytics-not-found` 표지를 렌더링하고, 트래커가 조회를 보낼 때 이를 확인한다.
  `app/global-not-found.tsx`는 공개 레이아웃 밖이라 같은 트래커를 직접 렌더링한다.
- **전송**: 이벤트를 큐에 모아 `page_view`는 즉시, 나머지는 10개가 되거나 탭이 숨겨질 때 `sendBeacon`으로 보낸다.
  `sendBeacon`이 없으면 `fetch(..., { keepalive: true })`. 각 이벤트에 "발생 후 경과 ms"를 붙여 서버가 시각을 계산한다.
- **CTA 태깅**: 가입·지원·문의·캘린더 구독 같은 핵심 링크에 `data-analytics` 라벨을 붙인다. 정확한 목록은 구현 계획에서 정한다.

### 4-4. 번들 예산

홈은 상한 200,000B 중 195,911B를 쓰고 있다(`scripts/check-performance-budget.mjs`). 트래커와 Web Vitals 코드를 합쳐
**압축 3KB 이하**를 목표로 하고, GA4 제거 전후로 `pnpm perf:measure` + `pnpm perf:budget`을 돌려 확인한다.
`next/web-vitals`가 예산을 넘기면 `PerformanceObserver`로 LCP·CLS·INP를 직접 측정하는 코드로 바꾼다.

## 5. 수집 API (`POST /api/pulse`)

처리 순서. 거부한 요청은 이유를 드러내지 않고 `204`로 끝낸다(트래커가 재시도하지 않게).

1. **출처**: `Origin`이 `NEXT_PUBLIC_SITE_URL`과 같거나 `Sec-Fetch-Site: same-origin`이어야 한다.
2. **크기**: 본문 16KB 이하, 배치당 이벤트 20개 이하. zod 스키마로 검증한다(문자열 길이 상한 포함: 경로 512, 제목 300, URL 1024).
3. **봇**: UA 정규식(bot·crawl·spider·headless·lighthouse·preview·facebookexternalhit 등)이면 버린다.
4. **속도 제한**: IP당 분당 120 이벤트. `REDIS_URL`이 있으면 Redis `INCR`+TTL, 없으면 인스턴스 메모리. IP는 이 판정에만 쓰고 저장하지 않는다.
5. **보강** (세션 첫 이벤트에서 한 번):
   - UA → 기기 유형(mobile·tablet·desktop), 브라우저(Chrome·Safari·Edge·Firefox·Samsung Internet·Whale·KakaoTalk 인앱·Instagram 인앱·기타), OS. 한국 인앱 브라우저를 구분해야 하므로 작은 자체 파서를 둔다(단위 테스트 필수).
   - 채널 분류(GA4 기본 채널 그룹을 단순화): 아래 표.
   - 시간대 → 국가 코드(주요 시간대 표, 없으면 `ZZ`).
   - 내부 여부: 요청에 승인된 GYMS 세션 쿠키가 있으면 `isInternal = true` (`hasApprovedSession` 재사용).
6. **시각**: `occurredAt = 서버 수신 시각 − 경과 ms`, 경과 ms는 0~5분으로 자른다.
7. **저장**: 한 트랜잭션에서 세션 upsert(`lastSeenAt` 갱신) → 조회 insert → `engagement`는 `GREATEST`로 update → 이벤트 insert.
   세션이 없는데 조회가 아닌 이벤트만 오면 버린다.
8. **정리**: `after()`에서 마지막 정리 후 24시간이 지났으면(Redis 키 또는 Postgres advisory lock) 26개월 지난 행을 1만 행씩 삭제한다.

### 채널 분류 규칙 (위에서부터 먼저 맞는 것)

| 채널           | 조건                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| Paid Search    | `utm_medium`이 cpc·ppc·paid·paidsearch이고 출처가 검색 엔진                                               |
| Paid Social    | `utm_medium`이 유료 값이고 출처가 소셜                                                                    |
| Email          | `utm_medium`/`utm_source`에 email·e-mail·newsletter                                                       |
| AI Assistants  | 리퍼러가 chatgpt.com·perplexity.ai·claude.ai·gemini.google.com·copilot.microsoft.com 등                   |
| Organic Search | 리퍼러가 google·naver·daum·bing·yahoo·duckduckgo·ecosia·baidu·yandex 계열                                 |
| Organic Social | 리퍼러나 `utm_source`가 instagram·facebook·x/t.co·threads·linkedin·youtube·kakao·everytime·discord·reddit |
| Referral       | 그 밖의 외부 리퍼러(같은 사이트 리퍼러 제외)                                                              |
| Campaign       | UTM은 있지만 위에 해당하지 않음                                                                           |
| Direct         | 리퍼러와 UTM 모두 없음                                                                                    |

## 6. 데이터 모델 (`db/schema/analytics.ts`)

저장소 관례대로 `timestamp`(시간대 없음, 실제 UTC 시각)를 쓴다. 보고서의 일·시간 구간은 서울 기준으로 자른다
(`(col AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Seoul'`).

### `analytics_sessions`

| 컬럼                                                             | 타입               | 비고                            |
| ---------------------------------------------------------------- | ------------------ | ------------------------------- |
| `id`                                                             | uuid PK            | 클라이언트가 만든 `sessionId`   |
| `visitorId`                                                      | uuid not null      |                                 |
| `startedAt`, `lastSeenAt`                                        | timestamp not null |                                 |
| `isNewVisitor`, `isInternal`                                     | boolean not null   |                                 |
| `landingPath`                                                    | text not null      |                                 |
| `referrerHost`, `referrerPath`                                   | text null          | 리퍼러의 쿼리는 저장하지 않는다 |
| `utmSource`, `utmMedium`, `utmCampaign`, `utmTerm`, `utmContent` | text null          |                                 |
| `channel`                                                        | text not null      | 5장의 분류값                    |
| `deviceType`, `browser`, `os`                                    | text not null      |                                 |
| `screenWidth`, `screenHeight`                                    | smallint null      |                                 |
| `language`, `timezone`                                           | text null          |                                 |
| `country`                                                        | char(2) not null   | 추정값, 모르면 `ZZ`             |

인덱스: `(startedAt)`, `(visitorId, startedAt)`.

### `analytics_page_views`

| 컬럼               | 타입                           | 비고                                        |
| ------------------ | ------------------------------ | ------------------------------------------- |
| `id`               | uuid PK                        | 클라이언트가 만든 `pageViewId`              |
| `sessionId`        | uuid FK → sessions, cascade    |                                             |
| `visitorId`        | uuid not null                  | 사용자 수 집계용 중복 저장                  |
| `occurredAt`       | timestamp not null             |                                             |
| `sequence`         | smallint not null              | 세션 안에서 몇 번째 조회인지(1 = 방문 시작) |
| `path`, `locale`   | text not null                  |                                             |
| `title`            | text null                      |                                             |
| `isNotFound`       | boolean not null default false |                                             |
| `engagementMs`     | integer not null default 0     |                                             |
| `maxScrollPercent` | smallint not null default 0    |                                             |

인덱스: `(occurredAt)`, `(path, occurredAt)`, `(sessionId, sequence)`.

### `analytics_events`

| 컬럼                 | 타입                          | 비고                                                  |
| -------------------- | ----------------------------- | ----------------------------------------------------- |
| `id`                 | bigint identity PK            |                                                       |
| `sessionId`          | uuid FK → sessions, cascade   |                                                       |
| `pageViewId`         | uuid FK → page_views, cascade |                                                       |
| `occurredAt`         | timestamp not null            |                                                       |
| `name`               | text not null                 | `outbound`·`download`·`contact`·`cta`·`web_vital`     |
| `path`               | text not null                 |                                                       |
| `label`, `targetUrl` | text null                     | 클릭 이벤트                                           |
| `metric`, `rating`   | text null                     | Web Vitals(`LCP`…, `good`·`needs-improvement`·`poor`) |
| `value`              | double precision null         | Web Vitals 값                                         |

인덱스: `(name, occurredAt)`, `(pageViewId)`.

마이그레이션은 새 테이블 3개 생성뿐이라 `check-migrations.mjs`의 파괴적 변경 규칙에 걸리지 않는다.

## 7. 지표 정의 (GA4 호환)

| 지표                      | 정의                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| 사용자(Users)             | 기간 안 세션이 있는 고유 `visitorId`                                                     |
| 신규 사용자               | `isNewVisitor` 세션의 고유 `visitorId`                                                   |
| 세션                      | 기간 안에 시작한 세션 수                                                                 |
| 참여 세션                 | 참여 시간 합 ≥ **10초**, 또는 조회 ≥ **2회**, 또는 `cta` 이벤트가 있는 세션              |
| 참여율 / 이탈률           | 참여 세션 ÷ 세션 / 1 − 참여율 (GA4 정의)                                                 |
| 조회수, 세션당 조회수     | 페이지 조회 수, 조회 ÷ 세션                                                              |
| 평균 참여 시간            | 세션당: 참여 시간 합 ÷ 세션. 페이지 보고서는 조회당 평균                                 |
| 방문 시작 / 종료 / 종료율 | `sequence = 1`인 조회 / 세션의 마지막 조회 / 종료 ÷ 조회                                 |
| 스크롤 도달률             | 조회 중 `maxScrollPercent`가 25·50·75·90% 이상인 비율                                    |
| 핵심 이벤트               | `cta` 이벤트 수와 핵심 이벤트가 있는 세션 비율                                           |
| Web Vitals                | 지표별 p75. 등급 기준 LCP 2.5/4s, INP 200/500ms, CLS 0.1/0.25, FCP 1.8/3s, TTFB 0.8/1.8s |
| 기간 비교                 | 같은 길이의 직전 기간 대비 증감률                                                        |

임계값과 정의는 `lib/analytics/metrics.ts` 한 곳에 두고 화면·MCP·테스트가 같이 쓴다.

**콘텐츠 그룹**: 경로를 홈·세션 목록·세션 상세·프로젝트 목록·프로젝트 상세·멤버·캘린더·약관·404로 분류한다.
세션·프로젝트 상세는 ID로 DB 제목을 붙여, 표에 UUID 대신 제목이 보이게 한다.

## 8. 조회 계층

- **필터 모델** `AnalyticsFilter` (zod, `lib/analytics/filters.ts`): 기간(오늘·어제·7일·28일·90일·12개월·직접 지정, 최대 26개월),
  비교 여부, 채널, 기기, 국가, 언어, 신규/재방문, 콘텐츠 그룹, 경로 포함 문자열, 내부 트래픽 포함 여부(기본 제외).
  화면에서는 URL `searchParams`로 직렬화해 링크로 공유할 수 있게 한다.
- `lib/server/analytics/queries/*`는 보고서별 함수(`getOverview`, `getAcquisition`, `getPages`, `getPageDetail`, `getAudience`,
  `getRetention`, `getWebVitals`, `getRealtime`, `runExplore`)를 둔다. 모두 같은 필터 → WHERE 변환 함수를 쓴다.
- 분석 쿼리는 트랜잭션 안에서 `SET LOCAL statement_timeout = '10s'`로 실행해 무거운 쿼리가 DB를 붙잡지 않게 한다.
- `lib/server/services/admin/analytics.ts`가 `authorize(actor, 'get', 'analyticsPage')` 후 쿼리를 부르고 `ServiceResult`로 돌려준다.
  웹 화면·CSV·MCP가 모두 이 서비스를 쓴다.
- 관리자 조회 관례대로 요청 간 캐시는 하지 않고, 같은 요청 안 중복은 React `cache()`로 막는다. Search Console만 예외(10장).

## 9. GYMS 화면 (`/admin/analytics`)

공통 레이아웃: 페이지 헤더 아래에 **필터 바**(기간 선택, 비교 토글, 필터 칩, 내부 트래픽 토글)와 **탭**
(개요·유입·참여·사용자·성능·검색·탐색). 탭은 각자 라우트(`/admin/analytics/acquisition` 등)이고 필터 쿼리를 유지한다.
데이터는 서버 컴포넌트가 읽고, 차트는 직렬화된 행만 받는 클라이언트 컴포넌트다. 느린 카드마다 `<Suspense>`와 스켈레톤.

| 탭     | 내용                                                                                                                                                                                                                                                                        |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 개요   | 지표 타일(사용자·신규·세션·조회·참여율·평균 참여 시간, 증감률+스파크라인). 지표를 고르는 메인 추이 차트(비교 기간은 점선). 실시간 카드(최근 5분 활성 방문자, 30분 분당 조회 막대, 지금 보는 페이지, 30초마다 갱신). 상위 채널·페이지·기기                                   |
| 유입   | 채널별 표 + 시간에 따른 누적 영역 차트. 소스/매체, 리퍼러, UTM 캠페인, 방문 시작 페이지(참여율 포함). 검색 엔진·AI 어시스턴트별 분해                                                                                                                                        |
| 참여   | 페이지 표(조회·사용자·평균 참여 시간·75% 스크롤 도달률·방문 시작·종료율, 정렬·콘텐츠 그룹). 페이지 상세(`?path=`): 추이, 스크롤 깊이 막대, 이전/다음 페이지 상위 10, 유입 채널, 해당 페이지 Web Vitals. 이벤트 표(CTA·외부 링크·다운로드·연락처). 404 보고서(경로·리퍼러별) |
| 사용자 | 신규 vs 재방문 추이, 주간 리텐션 코호트 히트맵(12주), 기기·브라우저·OS·화면 해상도, 언어·국가, 요일×시간(서울) 트래픽 히트맵                                                                                                                                                |
| 성능   | Web Vitals 지표별 p75와 등급 분포 막대, 추이, 기기별, 나쁜 페이지 순위                                                                                                                                                                                                      |
| 검색   | 10장                                                                                                                                                                                                                                                                        |
| 탐색   | 차원 1~2개 × 지표 여러 개를 고르고 필터를 걸어 표와 차트로 본다(GA4 탐색 분석의 자유 형식 대응). CSV 내보내기                                                                                                                                                               |

- **차트 디자인**: 구현 시 `dataviz` 스킬의 방법을 따르고, 색은 `app/admin.css`의 토큰에서 만든 CSS 변수로 라이트·다크 모두 맞춘다.
  히트맵(리텐션, 요일×시간)은 CSS 그리드로 그린다.
- **접근성**: 모든 차트에 요약 `aria-label`과 "표로 보기" 대체 표를 둔다. `prefers-reduced-motion`이면 차트 애니메이션을 끈다.
  `app/(admin)/DESIGN.md`의 44px 터치 영역, 로딩·빈·오류 상태 규칙을 따른다.
- **CSV**: `GET /api/admin/analytics/export?report=…&<필터>`. 세션 쿠키로 `getWebActor()` → 같은 서비스. UTF-8 BOM을 붙여 엑셀에서 한글이 깨지지 않게 한다.
- **메뉴**: `navigation-list.ts`에 `analytics` 키를 추가하고, 관리자 사전(en/ko)에 문구를 넣는다.
- **빈 데이터**: 수집 시작 전이나 필터 결과가 없으면 "아직 데이터가 없습니다" 상태와 수집 시작 시각을 보여 준다.

## 10. Search Console 연동

- **인증**: 서비스 계정 JWT bearer 흐름을 `node:crypto`의 RS256 서명으로 직접 구현한다(새 의존성 없음).
  범위 `https://www.googleapis.com/auth/webmasters.readonly`. 액세스 토큰은 만료 전까지 메모리에 둔다.
- **환경 변수** (`env-core.ts`에 기능별 스키마 `getSearchConsoleEnv()` 추가, 없으면 `null`):
  `GSC_CLIENT_EMAIL`, `GSC_PRIVATE_KEY`(줄바꿈 `\n` 허용), `GSC_SITE_URL`(예: `sc-domain:gdgoc.yonsei.ac.kr`).
- **조회**: `searchAnalytics.query`로 날짜·검색어·페이지·기기·국가 차원. `'use cache: remote'` + 6시간 수명 + 태그 `search-console`.
  Search Console 데이터는 2~3일 늦게 들어오므로 종료일을 그에 맞게 자르고 화면에 표시한다. 보관은 Google 쪽 16개월.
- **검색 탭**: 클릭·노출·CTR·평균 순위 추이, 검색어 표, 페이지 표, 기기·국가. **개선 기회** 세 목록:
  1. 노출은 많은데 CTR이 순위 대비 낮은 검색어·페이지 → 제목·설명 개선 후보
  2. 평균 순위 8~20위 검색어 → 조금만 올리면 첫 페이지
  3. 자연 검색으로 들어온 방문 시작 페이지 중 참여율이 낮은 페이지(우리 수집 데이터와 경로로 결합)
- **설정 전 상태**: 자격 증명이 없으면 설정 절차(GCP에서 Search Console API 사용 설정 → 서비스 계정 키 발급 → Search Console 속성에
  서비스 계정 이메일을 "제한됨" 사용자로 추가 → 환경 변수 3개 등록)를 보여 준다. `docs/architecture/analytics.md`에도 같은 내용을 둔다.
- API 오류(권한 없음, 할당량)는 탭 안 오류 카드로 보여 주고 다른 탭에는 영향이 없다.

## 11. MCP 도구 (`lib/mcp/tools/analytics.ts`)

모두 스코프 `gyms:read`, 게이트 `get analyticsPage`, `readOnlyHint: true`. 입력의 필터는 8장의 `AnalyticsFilter`를 그대로 쓴다.

| 도구                    | 입력                                                                                                                                                     | 결과                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `analytics_overview`    | 기간, 비교, 필터                                                                                                                                         | 지표 타일 값과 일별 추이                |
| `analytics_report`      | `report`(pages·channels·sources·landing_pages·campaigns·devices·browsers·countries·events·not_found·web_vitals·retention), 기간, 필터, 정렬, limit(≤100) | 표 행                                   |
| `analytics_page_detail` | 경로, 기간                                                                                                                                               | 페이지 상세(추이·스크롤·이전/다음·유입) |
| `search_console_report` | 차원(query·page·device·country·date), 기간, 필터, limit                                                                                                  | Search Console 행(미설정이면 오류 안내) |
| `seo_opportunities`     | 기간                                                                                                                                                     | 10장의 개선 기회 세 목록                |

읽기 도구라 감사 로그 대상이 아니다(현행 규칙: 쓰기·관리 호출만 기록). `docs/architecture/mcp.md`와 GYMS MCP 안내 페이지의 도구 목록을 갱신한다.

## 12. 개인정보처리방침과 수집 거부

- 처리방침(한·영)에 **"자동 수집 장치의 설치·운영 및 거부"** 절을 추가한다.
  - 수집 항목: 무작위 방문자 ID(브라우저 저장소), 본 페이지와 시각, 참여 시간, 스크롤 깊이, 리퍼러, UTM, 기기·브라우저·OS, 화면 크기, 언어, 시간대, 성능 지표
  - IP는 남용 방지 판정에만 순간적으로 쓰고 저장하지 않는다
  - 목적: 서비스 개선, 검색 노출 개선, 콘텐츠 기획
  - 보관: 26개월 후 삭제
  - 거부 방법: 이 페이지의 거부 버튼, 브라우저 GPC 설정, 브라우저 저장소 삭제
- 시행일자를 배포일로 갱신한다.
- **거부 버튼** `AnalyticsOptOut`(클라이언트): 현재 상태를 보여 주고, 거부하면 `gyms_optout = '1'`을 저장하고 `gyms_vid`·`gyms_sid`를 지운다. 다시 허용할 수 있다.
- 처리방침 문구는 일반적인 안내 수준으로 작성한다. 법적 검토가 필요하면 배포 전에 운영진이 확인한다.

## 13. GA4 제거

- `app/(home)/[lang]/layout.tsx`에서 `GoogleAnalytics`와 `GA_MEASUREMENT_ID`를 지운다.
- 다른 사용처가 없으므로 `@next/third-parties`를 `package.json`에서 빼고, `pnpm-workspace.yaml` 목록의 `@next/third-parties@16.3.6` 항목도 정리한다.
- `docs/handoff.md` 외부 서비스 표의 Google Analytics 행을 Search Console 행으로 바꾼다.
- Google Analytics 속성 자체는 건드리지 않는다. 과거 데이터는 GA 화면에서 보관 기간 동안 볼 수 있다.

## 14. 권한

- `policy.ts`의 `ResourceType`에 `analyticsPage`를 추가하고 `BASE_PAGES`에 넣는다 → MEMBER·CORE·LEAD·ALUMNUS 조회 가능, UNVERIFIED 불가.
- 쓰기 권한은 없다(분석 데이터는 수집 API만 쓴다).
- `/admin/analytics/*`는 기존 관리자 레이아웃의 로그인·승인 확인을 그대로 받는다. CSV 라우트는 서비스 권한 확인으로 막는다.

## 15. 오류 처리

| 상황                            | 동작                                                                       |
| ------------------------------- | -------------------------------------------------------------------------- |
| 수집 API 검증 실패·봇·제한 초과 | `204`, 저장 안 함. 사용자 화면에 영향 없음                                 |
| 수집 중 DB 오류                 | 서버 로그에 남기고 `204`. 트래커는 재시도하지 않는다(중복보다 손실을 택함) |
| 분석 쿼리 시간 초과             | 해당 카드만 오류 상태 + "기간을 줄여 보세요" 안내                          |
| Search Console 미설정·오류      | 검색 탭에 설정 안내 또는 오류 카드                                         |
| 권한 없음                       | 기존 관리자 규칙대로 메뉴 숨김, 직접 접근 시 403/리다이렉트                |

## 16. 테스트

- **단위(Vitest)**: UA 파서(인앱 브라우저 포함), 채널 분류, 시간대→국가, 수집 zod 스키마, 세션 30분 규칙, 지표 계산 헬퍼, 필터 직렬화.
- **트래커(jsdom)**: 세션 갱신, 신규 방문자 판정, GPC·거부·webdriver 시 미전송, 참여 시간(가짜 타이머, 숨김 시간 제외), 배치·플러시, soft navigation.
- **수집 API**: 출처 거부, 크기·개수 초과, 봇 UA, 속도 제한, `engagement`의 `GREATEST` 갱신, 세션 없는 이벤트 버림, 내부 트래픽 표시.
- **쿼리**: 시드한 이벤트로 일회용 Postgres에서 지표 정의(참여 세션, 종료율, 리텐션, p75)를 검증한다. 기존 테스트 DB 관례를 따른다.
- **Search Console**: JWT 서명 형식과 응답 매핑을 `fetch` 모의로 검증한다.
- **MCP**: 도구 노출(역할·스코프), 입력 검증, 결과 모양.
- **E2E(Playwright)**: 공개 페이지 방문 → 행 생성 → GYMS 분석 화면에 반영, 거부 후 미수집, UNVERIFIED 접근 불가.
- **성능**: `pnpm perf:measure` + `pnpm perf:budget` 통과. 브라우저로 분석 화면 7개를 라이트·다크, 데스크톱·모바일에서 확인한다.
- **시드**: `pnpm db:seed`가 90일치 가상 분석 데이터를 만들어 개발 중 대시보드를 볼 수 있게 한다.

## 17. 위험

- **번들 예산 여유가 4KB뿐이다.** 4-4장의 측정과 대체 경로로 대응한다.
- **공개 엔드포인트 남용.** 출처·크기·속도 제한으로 막지만, Redis가 없으면 속도 제한이 인스턴스별이다.
- **데이터가 배포일부터 쌓인다.** GA4를 제거하면 같은 화면에서 이전 기간과 비교할 수 없다.
- **규모가 커지면 쿼리가 느려진다.** 연 수백만 조회를 넘기면 일 단위 롤업을 추가한다(수집 형식은 그대로).
- **국가 추정은 부정확하다.** 시간대 기반이라 VPN·해외 거주 한국인 등을 구분하지 못한다. 화면에 "추정"이라고 표시한다.

## 18. 구현 순서

하나의 명세를 세 개의 구현 계획으로 나눈다. 각 계획이 끝날 때마다 테스트·린트·타입·성능 예산을 통과시킨다.

1. **계획 A — 수집**: 스키마·마이그레이션, 수집 API와 보강 모듈, 트래커, CTA 태깅, GA4 제거, 처리방침과 거부 버튼, 권한 키, 시드.
2. **계획 B — 대시보드**: 필터 모델, 쿼리 계층, 서비스, 분석 화면 6개(개요·유입·참여·사용자·성능·탐색), CSV, 메뉴.
3. **계획 C — 검색과 MCP**: Search Console 클라이언트, 검색 탭과 개선 기회, MCP 도구 5개, 문서(`docs/architecture/analytics.md`, mcp.md, handoff.md).
