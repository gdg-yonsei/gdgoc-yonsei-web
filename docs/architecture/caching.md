# 캐시 아키텍처

## 목표

- 공개 `/ko`, `/en` 페이지를 명시적이고 검토 가능한 캐시 규칙으로 빠르게 유지한다.
- 관리자가 쓴 내용은 바로 보이게 한다(read-your-own-writes).
- 관리자 조회는 정확성과 권한 안전을 위해 캐시하지 않는다.
- `REDIS_URL`이 있으면 Redis 공유 캐시로 바꿔 여러 인스턴스 배포를 지원한다.

## Next.js 16 캐시 모델

[`next.config.ts`](../../next.config.ts)에서 `cacheComponents: true`를 쓴다.

- 공개 조회 모델은 `'use cache: remote'`로 Cache Components를 쓴다.
- `cacheLife` 프로필은 [`policy.ts`](../../lib/server/cache/policy.ts)에 한 번만 정의하고 `next.config.ts`가 등록한다.
- `cacheTag` 사용은 [`index.ts`](../../lib/server/cache/index.ts)의 `cacheQuery`/`tagQuery` 뒤로 모은다.
- 관리자 쓰기 직후 즉시 반영에는 `updateTag`를 쓴다.
  `updateTag`는 Server Action 안에서만 동작한다. MCP 라우트는 서비스를 `runWithRouteHandlerInvalidation` 안에서
  실행하고, 그 안에서는 `updateCacheTags`가 `revalidateTag(tag, { expire: 0 })`로 바뀐다
  ([`invalidation-context.ts`](../../lib/server/cache/invalidation-context.ts)).
- 넓은 범위의 백그라운드 재검증에는 `revalidateTag(..., 'max')`를 쓴다.
- `revalidatePath`는 언어별 공개 경로와 `sitemap.xml`을 보충할 때만 쓴다.

## 태그 이름

태그 빌더는 [`tags.ts`](../../lib/server/cache/tags.ts)에 있다.

- 언어는 항상 마지막 세그먼트: `<resource>[:scope][:id]:<locale>`
- 목록 태그는 고정 범위: `project:list:ko`
- 상세 태그는 고정 식별자: `project:item:<projectId>:en`
- 기수 태그는 기수 이름 포함: `session:generation:25-26:ko`
- 두 언어를 함께 담는 공개 조회 모델은 언어와 무관한 캐시 키 하나를 쓰고, 기존 언어별 무효화 계약을 지키기 위해
  두 언어 태그를 모두 붙인다.

주요 태그:

- `home:<locale>`
- `generation:list:<locale>`, `generation:latest:<locale>`
- `member:list:<locale>`, `member:generation:<generation>:<locale>`, `member:item:<memberId>:<locale>`
- `project:list:<locale>`, `project:generation:<generation>:<locale>`, `project:item:<projectId>:<locale>`
- `session:list:<locale>`, `session:generation:<generation>:<locale>`, `session:item:<sessionId>:<locale>`
- `sitemap:<locale>`

## 수명(TTL) 정책

값은 [`policy.ts`](../../lib/server/cache/policy.ts)에 한 번만 정의한다.

| 프로필            | stale | revalidate | expire |
| ----------------- | ----- | ---------- | ------ |
| `home`            | 15분  | 1시간      | 1일    |
| `generationIndex` | 1시간 | 6시간      | 7일    |
| `memberDirectory` | 1시간 | 6시간      | 7일    |
| `projectList`     | 1시간 | 6시간      | 7일    |
| `projectDetail`   | 6시간 | 1일        | 30일   |
| `sessionList`     | 15분  | 1시간      | 2시간  |
| `sessionDetail`   | 15분  | 1시간      | 2시간  |
| `sitemap`         | 1시간 | 6시간      | 7일    |

세션 조회는 캐시 키에 **한 시간 단위 공개 기준 버킷**을 넣는다. 시간이 지나 공개되는 세션이 한 시간보다 오래
숨어 있지 않게 하기 위해서다. 지난 버킷은 다시 쓰이지 않으므로 세션 항목은 7일이 아니라 2시간 뒤 만료된다.

Redis에 저장하는 항목에는 위 `expire`를 Redis TTL(`EX`)로 함께 건다(`redis-shared.cjs`의 `expireToSetOptions`).
그래서 다시 쓰이지 않는 키가 Redis에 계속 쌓이지 않는다.

## 공개 조회 규칙

공개 조회는 [`lib/server/queries/public`](../../lib/server/queries/public)에 있다.

- 조회 모듈이 DB 읽기와 캐시 지시어를 함께 소유한다.
- 캐시 범위 안에서는 `cookies()`, `headers()`, 세션 API를 부르지 않는다. 필요한 값은 함수 인자로 받는다.
- 라우트와 컴포넌트는 캐시된 조회 함수를 조합할 뿐, 직접 DB를 읽지 않는다.
- 결과가 두 언어를 모두 담고 언어와 무관할 때만 캐시 키에서 언어를 뺀다. 언어별 렌더링 결과는 공유 캐시 밖에 둔다.
- 한 렌더링 안의 메타데이터·페이지 중복 호출은 React `cache()`가 없애고, 요청·인스턴스 간 공유는 remote 캐시가 맡는다.
- 형식이 틀린 UUID는 캐시 함수에 들어가기 전에 거부한다. 공격자가 캐시 키를 무한히 늘리지 못하게 하기 위해서다.
- `proxy.ts`는 공개 기수·상세 페이지에 대한 HTML 직접 요청에서 최소한의 존재 확인 쿼리를 한다(상세는 기본 키 조회).
  Cache Components 스트리밍에서도 진짜 HTTP 404를 돌려주기 위해서다. RSC·prefetch 요청은 건너뛰고, 페이지도 렌더링
  전에 따로 검증한다.
- 세션·프로젝트 페이지는 두 개의 공용 조회 모델을 쓴다.
  - `getSessionArchive(bucket)`: 공개된 모든 세션
  - `getProjectShowcase()`: 태그·참가자를 포함한 모든 프로젝트

  허브, 기수 페이지, 사이트맵, 홈 카운터가 모두 이 둘에서 파생된다.

- 기수 페이지도 이 공용 항목을 읽으므로, 각 조회 모델은 쿼리 뒤에 `tagQuery()`로 `generation:list:*`와 결과에
  나온 기수마다 `session|project:generation:<name>:*` 태그를 붙인다. 그래서 `invalidation.ts`의 즉시 무효화가
  기수 페이지까지 갱신한다.

## 관리자 규칙

관리자 조회는 캐시하지 않는다.

- 관리자 조회(`lib/server/fetcher/admin`)에는 캐시 지시어가 없다. 인증 레이아웃이 요청 시점 API를 쓰므로 모든 관리자
  요청이 최신 데이터를 읽는다.
- 개인화되거나 권한에 민감한 관리자 API는 `privateJson(...)`으로 private `Cache-Control`을 붙여 응답한다.

관리자 쓰기는 [`invalidation.ts`](../../lib/server/cache/invalidation.ts)로 무효화한다.

- `invalidateGenerationPublicCache`
- `invalidatePartPublicCache`
- `invalidateMemberPublicCache`
- `invalidateProjectPublicCache`
- `invalidateSessionPublicCache`
- `invalidateAllPublicCache` (사이드바의 전체 새로고침 버튼, CORE·LEAD)

쓰기의 기본 순서:

1. DB를 고친다(필요하면 트랜잭션).
2. 직접 영향받는 조회 모델은 무효화 헬퍼로 `updateTag`.
3. 넓게 의존하는 화면은 `revalidateTag(..., 'max')`.
4. 라우트 HTML을 바로 갱신해야 할 때만 언어별 경로를 재검증.
5. 관련 관리자 화면으로 redirect해 바로 최신 데이터를 그린다.

## 라우트 핸들러

GET 라우트 핸들러는 기본적으로 캐시되지 않는다.

- 개인화·관리자 핸들러는 캐시하지 않는다.
- 공개 캐시는 라우트 핸들러의 암묵적 동작이 아니라 조회 계층에서 처리한다.

## 여러 인스턴스 배포

공유 캐시는 [`next.config.ts`](../../next.config.ts)에서 연결한다.

- `REDIS_URL`이 있으면 `cacheHandler`가 ISR·데이터 캐시 저장소를 Redis로 바꾼다.
- `REDIS_URL`이 있으면 `cacheHandlers.remote`가 `'use cache: remote'`를 Redis로 처리한다.
- 공유 캐시 모드에서는 `cacheMaxMemorySize: 0`으로 인스턴스 메모리 중복을 끈다.
- `REDIS_URL`이 없으면(로컬 개발) Next 기본값과 메모리 캐시를 쓴다.

Redis 핸들러:

- [`incremental-redis-cache-handler.cjs`](../../lib/server/cache/handlers/incremental-redis-cache-handler.cjs)
- [`remote-cache-handler.cjs`](../../lib/server/cache/handlers/remote-cache-handler.cjs)
- [`redis-shared.cjs`](../../lib/server/cache/handlers/redis-shared.cjs) — 연결, 태그 상태, TTL 계산 공용

핸들러는 Next가 TypeScript 변환 없이 직접 불러오므로 CommonJS(`.cjs`)로 둔다.

## 환경 변수 검증

서버 환경 변수는 [`env-core.ts`](../../lib/server/env-core.ts)의 기능별 함수(`getDatabaseEnv()`, `getAuthEnv()`,
`getR2ClientEnv()` …)로 읽는다. 앱 코드는 `server-only`가 붙은 [`env.ts`](../../lib/server/env.ts)를 통해 쓴다.

- 기능별 함수는 그 기능에 필요한 값만 검사한다. 그래서 R2 설정이 없어도 공개 페이지는 뜬다.
- `REDIS_URL`은 선택이며, 있으면 `redis://` 또는 `rediss://`로 시작해야 한다. 캐시 핸들러(.cjs)는 `process.env`에서 직접 읽는다.
- 필요한 값이 없으면 처음 쓰는 시점에 어떤 변수가 빠졌는지 알려 주며 실패한다.

## 검증

- 태그 빌더와 무효화 헬퍼 단위 테스트
- 생성·수정·삭제 뒤 태그 무효화를 확인하는 관리자 액션 테스트
- Redis TTL 계산 테스트
- 관리자 수정 흐름과 공개 캐시 무효화를 확인하는 Playwright 시나리오
