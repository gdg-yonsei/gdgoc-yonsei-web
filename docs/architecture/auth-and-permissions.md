# 인증과 권한

## 1. 로그인 (Better Auth)

설정 파일: [`auth.ts`](../../auth.ts), 라우트: `app/api/auth/[...all]/route.ts`

| 방식                       | 비고                                                     |
| -------------------------- | -------------------------------------------------------- |
| GitHub, Google 소셜 로그인 | 같은 이메일이면 계정을 연결한다                          |
| 패스키(WebAuthn)           | 소셜 로그인 후 프로필 화면에서 기기를 먼저 등록해야 한다 |

- 로그인 세션은 DB(`session` 테이블, Drizzle `authSessions`) + 쿠키. 동아리 "세션"(`sessions` 테이블)과 헷갈리지 않도록 코드에서는 `authSessions`로 부른다. 서버 코드는 `getAuthSession()`(React `cache()`로 요청당 한 번)으로 읽는다.
- DB 테이블 이름은 Auth.js 시절 이름을 유지한다. 그래서 `drizzleAdapter`의 `schema`에서 Better Auth 모델과 Drizzle 테이블을 직접 연결한다.
- 로그인 화면: `/auth/sign-in`. 관리자 페이지에 로그인 없이 오면 여기로 보낸다.
- `pnpm build`는 `next build` 전에 `pnpm auth:prepare`(`scripts/prepare-auth.ts`)로 Better Auth를 한 번 초기화한다.
  MCP 리소스 행을 여러 빌드 워커가 동시에 넣으려다 unique 제약에 걸리는 문제를 막기 위해서다.

## 2. 역할

새로 가입한 사용자는 `UNVERIFIED`이며, 관리자가 가입 승인 화면(`/admin/members/accept`)에서 역할을 준다.

| 역할         | 할 수 있는 일(요약)                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------- |
| `LEAD`       | 모든 작업. 모든 기수 접근. 역할 변경, 기수 관리                                                     |
| `CORE`       | 멤버·파트·세션·프로젝트 운영(생성·수정), 세션·프로젝트 삭제, 공개 캐시 새로고침. 자신이 속한 기수만 |
| `MEMBER`     | 세션·프로젝트 조회, 프로젝트 생성, 본인 프로젝트·프로필 수정, 세션 참가 신청                        |
| `ALUMNUS`    | 조회, 본인 프로필 수정, 세션 참가 신청                                                              |
| `UNVERIFIED` | 아무것도 못 한다. 관리자 화면은 403, MCP 연결 불가                                                  |

역할은 `users.role` 컬럼에 있고 요청마다 DB에서 읽는다(`getUserRole`, 요청 단위 캐시). 역할을 바꾸거나 계정을
지우면 웹과 MCP 모두 바로 반영된다.

## 3. 권한 표 (`lib/server/permission/policy.ts`)

모든 권한 판단의 기준은 **역할 × 작업(get/post/put/delete) × 리소스** 표 하나다.

- 규칙 값: `true`(허용) 또는 `'own'`(본인 데이터일 때만 허용). 표에 없는 조합은 거부.
- 리소스 종류
  - 데이터: `members`, `membersRole`, `projects`, `sessions`, `generations`, `parts`, `publicCache`
  - 화면: `adminPage`, `membersPage`, `profilePage`, `projectsPage`, `sessionsPage`, `generationsPage`, `partsPage`
- 표를 쓰는 곳
  - `hasPermission(userId, action, resource, ownerId?)` — 버튼·메뉴 노출
  - `requirePermission(...)` / `requireOwnPermission(...)` — 레이아웃·페이지 가드(없으면 `forbidden()`)
  - `authorize(actor, action, resource, ownerId?)` — 서비스(웹 Server Action과 MCP 공통)
  - `getAdminNavigationItems` — 메뉴 목록(화면 리소스 `get`)

### 표로 표현하지 않는 규칙 (`lib/server/services/admin/authorize.ts`)

| 규칙                                                                       | 함수                                                    |
| -------------------------------------------------------------------------- | ------------------------------------------------------- |
| LEAD가 아니면 자신이 속한 파트의 기수만 다룰 수 있다                       | `canAccessGeneration`, `loadAccessibleGenerations`      |
| CORE는 MEMBER·ALUMNUS·UNVERIFIED만, 그리고 같은 기수 멤버만 수정할 수 있다 | `canEditMember` + `authorizeMemberEdit`(members 서비스) |
| 다른 사람의 이메일은 LEAD만 바꾼다(이메일로 계정을 연결하므로)             | `canChangeMemberEmail`                                  |
| 연락처(이메일·전화·학번)는 본인, LEAD, 같은 기수 멤버에게만 보인다         | `sharesGenerationWith`                                  |

## 4. 행위자(Actor)와 서비스 결과

서비스는 쿠키·헤더를 읽지 않고, 호출하는 쪽이 만든 `Actor`를 받는다(`lib/server/services/admin/types.ts`).

```ts
type Actor = {
  userId: string
  role: Role
  scopes: Scope[] | 'session' // 웹 세션은 스코프 제한 없음
  via: 'web' | 'mcp'
  clientId?: string // MCP OAuth 클라이언트
}
```

- 웹: `getWebActor()`가 로그인 세션과 역할로 만든다(`runAdminFormAction`이 호출).
- MCP: `actorFromClaims()`가 JWT 클레임과 DB 역할로 만든다.

`authorize`는 두 가지를 모두 본다.

1. **스코프**: `requiredScopeFor(action, resource)` — 조회는 `gyms:read`, 쓰기는 `gyms:write`, 삭제·역할 변경은 `gyms:admin`. 웹 세션은 통과.
2. **역할**: 위 권한 표.

서비스는 `ServiceResult<T>`(`{ ok: true, data }` 또는 `{ ok: false, code, message, fieldErrors? }`)를 돌려준다.
실패 코드는 `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL`이다.

## 5. 기수 범위 (generation scope)

관리자 화면은 "지금 어느 기수를 보고 있는지"를 쿠키(`admin-generation-scope`)로 기억한다.

- LEAD만 "전체 기수(`all`)"를 고를 수 있다. 그 외는 자신이 속한 기수 중 하나.
- 쿠키 값이 없거나 권한 밖이면 접근 가능한 가장 최근 기수로 대신한다.
- 이 규칙은 `resolveScopeFromOptions`(`lib/server/admin-generation-scope.ts`) 하나에 있고, 웹(쿠키)과 MCP(도구 인자)가 함께 쓴다.
- 목록 화면은 범위로 걸러서 보여 주고, 생성 화면은 특정 기수를 골라야 열린다(`requireCreationScope`).
- 상세·수정 화면에서 항목의 기수와 선택한 범위가 다르면 경고(`AdminGenerationScopeMismatchNotice`)를 띄운다.

## 6. 화면별 가드 구성

```text
app/(admin)/admin/layout.tsx       로그인 확인(없으면 /auth/sign-in), UNVERIFIED면 403
app/(admin)/admin/<리소스>/layout.tsx         화면 리소스 get (예: membersPage)
app/(admin)/admin/<리소스>/create/layout.tsx  데이터 리소스 post
app/(admin)/admin/<리소스>/[id]/edit/layout.tsx 데이터 리소스 put (소유자 규칙이 있으면 소유자 id 전달)
page.tsx                           세밀한 규칙(기수 접근, 대상 역할)
서비스                              같은 판단을 다시 한다 (화면 가드는 노출 제어일 뿐)
```

화면 가드는 사용자 경험을 위한 것이고, **최종 권한 검사는 항상 서비스가 한다**. 버튼을 숨겼다고 안전한 것이 아니다.

## 7. MCP OAuth

Better Auth의 `jwt()` + `@better-auth/mcp` + `@better-auth/cimd` 플러그인으로 OAuth 2.1 인가 서버가 된다.

- 액세스 토큰: JWT, `/api/mcp`에만 쓸 수 있게 audience가 묶여 있다. 수명 1시간(`gyms:admin` 포함 시 15분).
- 리프레시 토큰: 30일.
- 클라이언트 등록: 동적 등록(DCR) 또는 CIMD(클라이언트 id가 메타데이터 URL).
- 동의 화면: `/auth/mcp-consent` — 역할로 실제 쓸 수 있는 스코프만 체크박스로 보여 준다.

자세한 흐름과 도구 목록은 [`mcp.md`](./mcp.md).
