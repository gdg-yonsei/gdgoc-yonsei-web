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
