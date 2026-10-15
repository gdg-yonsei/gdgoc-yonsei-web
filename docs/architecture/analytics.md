# 방문 분석

공개 사이트 방문 행동을 자체 수집해 `analytics_*` 테이블에 저장한다. 설계: `docs/superpowers/specs/2026-10-14-gyms-analytics-design.md`.

## 수집 흐름

1. `app/(home)/[lang]/layout.tsx`와 `app/global-not-found.tsx`가 `AnalyticsTracker`를 렌더링한다.
2. 트래커(`lib/analytics/tracker/*`)는 조회·참여 시간·스크롤·클릭·Web Vitals를 큐에 모아 `sendBeacon`으로 `POST /api/pulse`에 보낸다.
3. `lib/server/analytics/collect/handle-collect.ts`가 출처 → 크기(16KB) → 스키마(배치 20개) → 봇 → 속도 제한(IP당 분당 120) 순으로 거른다. 거부해도 204다.
4. `store.ts`가 한 트랜잭션으로 세션 upsert → 조회 insert → 참여 시간 `GREATEST` → 이벤트 insert를 한다.
5. 응답 뒤 하루 한 번(인스턴스별) 26개월 지난 세션을 지운다(`retention.ts`).

Web Vitals(LCP·INP·CLS·FCP·TTFB)는 `next/web-vitals`(약 3KB) 대신 `lib/analytics/tracker/web-vitals.ts`가 PerformanceObserver로 직접 잰다. 공개 사이트 홈 JS 예산(200,000B) 때문이다. 수집기 전체가 페이지당 약 3KB(gzip)다.

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
