# GYMS MCP 설계

- 날짜: 2026-09-27
- 상태: 승인됨 (섹션별 대화 승인 완료)
- 브랜치: `feat/gyms-mcp`

## 1. 목적과 범위

관리자 페이지(GYMS, `/admin`)에서 할 수 있는 작업을 MCP(Model Context Protocol) 클라이언트에서
그대로 수행할 수 있게 한다. 사용자는 OAuth 로 로그인해 자신의 권한 범위 안에서만 도구를 쓴다.

### 대상 클라이언트

Claude.ai / Claude Desktop 커넥터, Claude Code, Cursor·ChatGPT 등 표준 MCP 클라이언트 전반.
따라서 다음을 모두 지원해야 한다.

- Streamable HTTP 트랜스포트
- OAuth 2.1 + PKCE(S256)
- Dynamic Client Registration (RFC 7591)
- Protected Resource Metadata (RFC 9728), Authorization Server Metadata (RFC 8414)
- Resource Indicators (RFC 8707)

### 포함

세션·프로젝트·파트·기수·멤버 CRUD, 멤버 승인/역할 변경, 세션 참가 신청/취소/참가자 제거,
내 프로필 조회·수정, 이미지 업로드(최대 200MB, Cloudflare R2), MCP 쓰기 호출 감사 로그.

### 제외

장소 예약(booking), UI 테마, 기수 스코프 쿠키(인자로 대체), 캐시 새로고침 버튼,
연결된 클라이언트 목록/회수 UI, 감사 로그 조회 UI, 웹 관리자 업로드의 200MB 제한 적용,
웹 Server Action 의 감사 로그 기록, 업로드 이미지 자동 리사이즈.

## 2. 아키텍처

```
MCP 클라이언트
   │ ① POST /api/mcp (토큰 없음) → 401 + WWW-Authenticate: resource_metadata=…
   │ ② GET /.well-known/oauth-protected-resource
   │ ③ GET /.well-known/oauth-authorization-server
   │ ④ CIMD(client_id = HTTPS 메타데이터 URL) 또는 POST /api/auth/oauth2/register (DCR)
   │ ⑤ 브라우저: /api/auth/oauth2/authorize → /auth/sign-in → /auth/mcp-consent
   │ ⑥ POST /api/auth/oauth2/token (PKCE)
   ▼
app/api/mcp/route.ts               requireMcpAuth + createMcpHandler (2026-07-28 + 2025 stateless 폴백)
   │ 토큰 검증 → Actor { userId, role(DB 최신), scopes, clientId }
   ▼
lib/mcp/tools/*.ts                 얇은 어댑터: zod 입력 → 서비스 → JSON 결과
   ▼
lib/server/services/admin/*.ts     공용 비즈니스 로직 (권한·검증·DB·캐시 무효화·R2·이메일)
   ▲
app/(admin)/**/actions.ts          기존 Server Action: FormData → Actor → 서비스 → redirect
```

원칙:

- 서비스 계층은 Next 요청 컨텍스트(`headers()`, `cookies()`, `redirect()`, `forbidden()`)를 모른다.
  `Actor` 를 명시적으로 받고 `ServiceResult<T>` 를 돌려준다.
- 역할은 토큰에 넣지 않고 매 요청 DB 에서 읽는다. 강등이 즉시 반영된다.
- 기수 스코프는 웹에서는 쿠키 값, MCP 에서는 `generationId` 인자로 서비스에 전달된다.
- 배포 구조는 그대로다(같은 Dokploy 앱). DB 마이그레이션이 하나 추가된다.

### 파일 구성

| 경로 | 역할 |
|---|---|
| `auth.ts` | `oauthProvider` 플러그인 추가 |
| `db/schema/oauth.ts` | 플러그인 테이블 (`auth@1.7.6 generate` 로 생성: oauth client/refresh token/consent/resource, jwks 등) |
| `db/schema/mcp-audit-log.ts` | 감사 로그 테이블 |
| `app/.well-known/oauth-protected-resource/route.ts` | RFC 9728 |
| `app/.well-known/oauth-authorization-server/route.ts` | RFC 8414 |
| `app/api/mcp/route.ts` | MCP 엔드포인트 (`@modelcontextprotocol/server` v2 `createMcpHandler`, 요청마다 Actor 별 서버 생성) |
| `app/(admin)/auth/mcp-consent/page.tsx` | 동의 화면 |
| `lib/mcp/server.ts` | MCP 서버 팩토리, 도구 등록 |
| `lib/mcp/auth.ts` | 검증된 JWT 클레임 → Actor (DB 역할 조회) |
| `lib/mcp/registry.ts` | 도구 정의 타입, 스코프/역할 필터, `withAudit` 래퍼 |
| `lib/mcp/tools/{context,generations,parts,members,profile,projects,sessions,images}.ts` | 도구 |
| `lib/server/services/admin/{types,authorize,generation-scope}.ts` | 공용 타입·권한·기수 스코프 |
| `lib/server/services/admin/{sessions,projects,parts,generations,members,profile,images}.ts` | 도메인 서비스 |
| `lib/server/uploads/{remote-fetch,image-signature}.ts` | SSRF 방어 fetch, 매직 바이트 검사 |

## 3. OAuth 정책

`@better-auth/mcp@1.7.6`(내부적으로 `@better-auth/oauth-provider`)과 `jwt()`, `@better-auth/cimd` 를
`auth.ts` 에 추가한다(현재 better-auth 1.7.6 과 버전 일치).

- **클라이언트 등록**
  - **CIMD** (MCP 2026-07-28 기본): `cimd({ fetchClientMetadataResource, metadataProfile: 'mcp-2026-07-28' })`.
  - **DCR 공개 등록** (2025 세대 클라이언트 호환): `allowDynamicClientRegistration: true`,
    `allowUnauthenticatedClientRegistration: true`. 등록만으로는 아무 권한이 없고, 사용자 로그인 +
    동의 후에만 토큰이 발급된다. 등록은 기본 레이트리밋(분당 5회).
- **공개 클라이언트 + PKCE S256 필수** (`token_endpoint_auth_method: none`).
- **JWT access 토큰**: `@better-auth/mcp` 의 `requireMcpAuth` 가 JWKS 로 서명·issuer·audience·만료를
  검증한다. 토큰은 무상태라 발급 후 만료 전까지 유효하다. 대신 **역할은 매 요청 DB 에서 다시 읽으므로**
  강등·UNVERIFIED 전환·계정 삭제는 즉시 반영된다(설계 결정, 2026-09-27 사용자 승인).
- **리소스 바인딩**: `mcp({ resource: `${SITE_URL}/api/mcp` })`. 토큰 audience 는 이 값만 허용한다.
  RFC 9728 보호 리소스 메타데이터는 플러그인이 제공하고, `/.well-known/*` 라우트에서 노출한다.
- **수명**: access 1시간, refresh 30일(회전, MCP 기본 재사용 간격 30초). `gyms:admin` 포함 access 토큰은
  `scopeExpirations` 로 15분.
- **스코프**: `gyms:read`, `gyms:write`, `gyms:admin`, `offline_access`.
- **로그인**: 기존 `/auth/sign-in` 재사용. 플러그인이 붙여 주는 서명된 OAuth 쿼리를 로그인 후
  `/api/auth/oauth2/authorize` 로 이어받도록 수정한다.
- **동의 화면 `/auth/mcp-consent`**: 서명 쿼리를 `verifyOAuthQueryParams` 로 검증한 뒤 클라이언트 이름,
  redirect URI 호스트, 요청 스코프를 표시한다. 사용자 역할로 실제 권한이 생기는 스코프만 선택 가능.
  **UNVERIFIED 는 거절**한다. 승인은 `authClient.oauth2.consent({ accept, scope })`.
- **회수**: 플러그인 RFC 7009 revoke 엔드포인트(refresh 토큰)와 계정 삭제 cascade 만 제공.
- **프록시**: `proxy.ts` 의 로케일 리다이렉트 제외 목록에 `/.well-known/` 를 추가한다.

## 4. 권한 모델

모든 도구에 동일하게 적용한다.

```
allowed = scopeGrants(token.scopes, tool.scope)
       && checkPermission(actor.userId, ownerId)[role][tool.action][tool.resource]
       && generationScopeAllows(actor, target)
```

- 기존 `lib/server/permission/check-permission.ts` 매트릭스를 **유일한 원천**으로 재사용한다.
- 소유권(`authorId`, `memberId`)은 서비스가 대상을 조회한 뒤 판정한다.
- 기수 접근: LEAD 는 전 기수, 그 외는 자신이 속한 파트의 기수만.
- `tools/list` 는 "역할상 가능(소유권 무시) && 스코프 부여" 인 도구만 노출한다.
  소유권 판정은 호출 시점에 한다.
- 각 작업은 정확히 하나의 정식 권한 검사를 가진다. 기존 페이지마다 달랐던 검사
  (예: 기수 수정에서 `generationId` 를 `dataOwnerId` 로 넘김)는 이 과정에서 정리하되 동작은 유지한다.

### 스코프별 도구 종류

| 스코프 | 도구 |
|---|---|
| `gyms:read` | 조회 전부 |
| `gyms:write` | 생성·수정, 세션 신청/취소, 참가자 제거, 이미지 업로드, 내 프로필 수정 |
| `gyms:admin` | 삭제, 멤버 승인, 역할 변경 |

### 역할별 요약

| 역할 | MCP 로 가능한 것 |
|---|---|
| LEAD | 전부 |
| CORE | 세션·프로젝트·파트·멤버 CRUD, 세션·프로젝트 삭제. 역할 변경·기수 관리 불가 |
| MEMBER | 세션·프로젝트 조회, 프로젝트 생성·본인 프로젝트 수정, 세션 신청/취소, 본인 프로필 |
| ALUMNUS | 세션·프로젝트 조회, 본인 프로필 수정 |
| UNVERIFIED | 연결 불가 |

## 5. 도구 카탈로그

### 공통 규칙

- 수정 도구는 부분 수정(PATCH): 기존 레코드와 패치를 병합한 뒤 웹과 같은 zod 스키마로 검증한다.
- 결과: `structuredContent` + 텍스트 요약. 실패는 `isError: true` + `{ code, message, fieldErrors? }`.
- 목록: `limit`(기본 50, 최대 200) + `cursor`, `generationId` 필터.
- 세션 일시: 오프셋 없는 입력은 서울 벽시계, 오프셋이 있으면 서울 시각으로 변환(기존 규칙).
- 애노테이션: 조회 `readOnlyHint`, 삭제·역할 변경 `destructiveHint`.

### 도구 목록

| 도메인 | 도구 | 스코프 |
|---|---|---|
| 컨텍스트 | `whoami` | read |
| 기수 | `list_generations`, `get_generation` | read |
| | `create_generation`, `update_generation` | write |
| | `delete_generation` | admin |
| 파트 | `list_parts`, `get_part` | read |
| | `create_part`, `update_part` | write |
| | `delete_part` | admin |
| 멤버 | `list_members`, `get_member` | read |
| | `update_member` | write |
| | `approve_member`, `update_member_role`, `delete_member` | admin |
| 내 프로필 | `get_my_profile` | read |
| | `update_my_profile` | write |
| 프로젝트 | `list_projects`, `get_project` | read |
| | `create_project`, `update_project` | write |
| | `delete_project` | admin |
| 세션 | `list_sessions`, `get_session` | read |
| | `create_session`, `update_session`, `register_session`, `unregister_session`, `remove_session_participant` | write |
| | `delete_session` | admin |
| 이미지 | `create_image_upload`, `complete_image_upload`, `import_image_from_url` | write |

`create_session` 은 `internalOpen` 이면 웹과 동일하게 기수 멤버에게 안내 메일을 보낸다(도구 설명에 명시).

## 6. 이미지 업로드 (최대 200MB, R2)

상수 `MAX_IMAGE_UPLOAD_BYTES = 209_715_200`. base64 입력은 지원하지 않는다
(도구 인자는 모델이 생성하는 텍스트라 대용량을 담을 수 없다).

### ① 직접 업로드 (셸이 있는 클라이언트)

1. `create_image_upload({ target, fileName, mimeType, sizeBytes })`
   - `sizeBytes ≤ 200MB`, `mimeType` 은 `image/*`.
   - `Content-Type` 과 `Content-Length` 를 함께 서명한 presigned PUT URL(15분).
   - 반환: `{ uploadUrl, objectKey, headers, curlExample }`.
2. 클라이언트가 R2 로 직접 PUT.
3. `complete_image_upload({ objectKey })`
   - `HeadObject` 로 존재·크기·타입 확인, Range GET 으로 앞부분 매직 바이트 검사(JPEG/PNG/WebP/GIF/AVIF).
   - 실패 시 객체 삭제. 성공 시 최종 공개 URL 반환.

### ② 서버 가져오기 (셸이 없는 클라이언트)

`import_image_from_url({ target, url })`

- URL 응답을 스트리밍으로 R2 멀티파트 업로드(`@aws-sdk/lib-storage`, 10MB 파트)에 흘려 보낸다.
- 200MB 초과 시 즉시 중단하고 멀티파트 업로드를 abort.
- SSRF 방어: HTTPS 만, DNS 해석 후 사설/루프백/링크로컬/예약 IP 차단,
  리다이렉트 최대 3회·매 홉 재검사, `image/*` + 매직 바이트 검증.

### 공통

- `target` 은 `sessions | projects | users`(멤버 프로필 이미지의 기존 접두사가 `users/`).
- 객체 키: `{target}/{uuid}.{ext}` (기존 규칙). 허용 확장자는 기존과 같되 **MCP 업로드는 SVG 를 받지 않는다**
  (매직 바이트로 검증할 수 없고 스크립트를 담을 수 있다): jpg, jpeg, png, webp, gif, avif.
- 생성·수정 도구의 이미지 필드는 우리 R2 버킷 URL 만 받는다.
- 참조가 끊긴 이미지는 기존 `deleteRemovedR2Images` 흐름으로 정리된다.
- 공개 사이트는 `next/image` 로 렌더링하므로 대용량 원본은 첫 최적화가 느릴 수 있다(알려진 한계).

## 7. 서비스 계층

```ts
type Actor = {
  userId: string
  role: Role
  scopes: Scope[] | 'session' // 웹 세션은 'session' (스코프 제한 없음)
  via: 'web' | 'mcp'
  clientId?: string
}

type ServiceResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      code:
        | 'UNAUTHORIZED'
        | 'FORBIDDEN'
        | 'NOT_FOUND'
        | 'VALIDATION'
        | 'CONFLICT'
        | 'INTERNAL'
      message: string
      fieldErrors?: Record<string, string[]>
    }
```

- 도메인당 한 파일, 함수 형태 `(actor, input) → Promise<ServiceResult<T>>`.
- 권한 검사, zod 검증, DB 쓰기, 캐시 무효화, R2 정리, 이메일 발송을 포함한다.
- `authorize(actor, action, resource, ownerId?)` 는 기존 매트릭스를 쓰고,
  `actor.scopes !== 'session'` 일 때만 스코프를 추가로 검사한다.
- 기수 스코프 해석은 쿠키를 읽지 않는 순수 함수 `resolveGenerationScope(actor, requested?)` 로 분리한다.
- Next 16 의 `updateTag` 는 Server Action 에서만 호출할 수 있다. MCP 라우트는 `AsyncLocalStorage`
  컨텍스트 안에서 도구를 실행하고, 그 안에서는 `updateCacheTags` 가 `revalidateTag(tag, { expire: 0 })` 로 전환한다.

### 웹 어댑터

- `actions.ts` 는 FormData 파싱 → `webActor()` → 서비스 → `FORBIDDEN` 은 `forbidden()`,
  기타 오류는 `{ error }`, 성공은 `redirect()` 로 축소된다.
- URL, 폼 상태, 리다이렉트, 오류 메시지 등 외부 동작은 바꾸지 않는다.
- 리팩터 순서: 조회 → 세션 → 프로젝트 → 파트/기수 → 멤버/프로필 → 삭제. 도메인 단위 커밋.

## 8. 감사 로그

`mcp_audit_log`

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid pk | |
| `createdAt` | timestamp | |
| `userId` | text → user.id, on delete set null | |
| `role` | role enum | 호출 당시 역할 |
| `clientId` | text | OAuth 클라이언트 |
| `clientName` | text | |
| `tool` | text | 도구 이름 |
| `input` | jsonb | 비밀성 필드 마스킹, 긴 문자열 2KB 절단 |
| `outcome` | text (`ok` / `error`) | |
| `errorCode` | text null | |
| `targetId` | text null | 생성·수정·삭제 대상 ID |
| `durationMs` | integer | |

- write·admin 스코프 도구 전부 기록(조회 제외). 실패 호출도 기록.
- 레지스트리의 `withAudit()` 가 모든 해당 핸들러를 감싼다.
- 감사 로그 쓰기 실패는 도구 결과를 막지 않는다(`logger.error`).

## 9. 오류 처리

| 상황 | 응답 |
|---|---|
| 토큰 없음/만료/audience 불일치 | HTTP 401 + `WWW-Authenticate: Bearer resource_metadata="…"` |
| 스코프 부족 | HTTP 403 + `WWW-Authenticate: Bearer error="insufficient_scope", scope="…"` |
| 사용자가 UNVERIFIED 로 강등 | 401 |
| 역할/소유권/기수 권한 실패 | `isError`, `FORBIDDEN` |
| 검증 실패 | `isError`, `VALIDATION` + `fieldErrors` |
| 대상 없음 | `isError`, `NOT_FOUND` |
| 예상 못한 예외 | `isError`, `INTERNAL` + 일반 메시지. 상세는 `logger.error` 에만 |

## 10. 테스트

1. 권한 매트릭스 테이블 테스트: 5 역할 × 스코프 조합 × 전 도구의 `authorize` 와 목록 필터.
2. 서비스 단위 테스트: 도메인별 검증·소유권·기수 스코프 분기.
3. 업로드 보안 테스트: SSRF(사설 IP, 리다이렉트), 200MB 초과 abort, 매직 바이트 불일치 삭제,
   presigned 서명의 `Content-Length` 포함.
4. MCP 통합 테스트(Playwright, 일회용 DB): 디스커버리 → DCR → authorize → consent → PKCE 토큰
   → `tools/list`, 역할별 목록 차이, UNVERIFIED 거절, 세션 왕복, 감사 로그 행, 읽기 전용 토큰의
   쓰기 호출 403.
5. 웹 회귀: 도메인 리팩터마다 기존 `tests/e2e/admin-crud/*.spec.ts` 와 단위 테스트 전체.
6. 수동 확인: 로컬 dev 서버(개발 DB :5435)에 Claude Code 로 연결. 운영 DB 는 건드리지 않는다.

## 11. 배포

머지 후 기존 CD 파이프라인이 마이그레이션(OAuth 테이블 + `mcp_audit_log`)을 적용한다.
새 환경 변수는 없다(`BETTER_AUTH_URL`, `NEXT_PUBLIC_SITE_URL`, R2 변수 재사용).
