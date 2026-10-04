# GYMS MCP

GYMS(`/admin` 관리자 시스템)는 원격 [Model Context Protocol](https://modelcontextprotocol.io) 서버로도 열려 있다.
MCP 클라이언트(Claude.ai·Claude Desktop 커넥터, Claude Code, Codex, ChatGPT, Cursor …)는 로그인한 사용자의 역할
범위 안에서 관리자 화면이 하는 일을 할 수 있다.

- 엔드포인트: `https://gdgoc.yonsei.ac.kr/api/mcp` (Streamable HTTP, stateless)
- 설계 기록: [`docs/superpowers/specs/2026-09-27-gyms-mcp-design.md`](../superpowers/specs/2026-09-27-gyms-mcp-design.md)

## 연결

멤버는 GYMS 대시보드(`/admin`)에서 클라이언트별 설치 안내를 볼 수 있다
([`mcp-install-guide.tsx`](../../app/components/admin/mcp-install-guide.tsx)). 클라이언트의 메뉴 이름이 바뀌면
[`mcp-install-guides.ts`](../../app/components/admin/mcp-install-guides.ts)를 고친다.

| 클라이언트             | 방법                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Claude Code            | `claude mcp add --transport http gyms https://gdgoc.yonsei.ac.kr/api/mcp` 후 `/mcp` → Authenticate      |
| Codex (CLI / IDE / 앱) | `codex mcp add gyms --url https://gdgoc.yonsei.ac.kr/api/mcp` 후 `codex mcp login gyms`                 |
| Claude 웹 / Desktop    | Customize → Connectors → + → Add custom connector → 엔드포인트 URL                                      |
| ChatGPT 웹             | Settings → Security and login → Developer mode 켜기, chatgpt.com/plugins → + → 연결 URL(`/api/mcp`까지) |
| ChatGPT Desktop        | 웹에서 연결을 먼저 만든 뒤, 새 대화의 도구 메뉴에서 추가                                                |
| Cursor                 | `mcp.json`: `{ "mcpServers": { "gyms": { "url": "https://gdgoc.yonsei.ac.kr/api/mcp" } } }`             |

클라이언트가 브라우저를 열면 평소처럼 GitHub·Google·패스키로 로그인하고, 동의 화면(`/auth/mcp-consent`)에서
그 연결에 줄 스코프를 고른다. `UNVERIFIED` 계정은 연결할 수 없다.

## 구조

```text
MCP 클라이언트 ──► POST /api/mcp (토큰 없음) ─► 401 + WWW-Authenticate: resource_metadata=…
             ──► GET /.well-known/oauth-protected-resource/api/mcp        (RFC 9728)
             ──► GET /.well-known/oauth-authorization-server/api/auth     (RFC 8414)
             ──► CIMD client_id URL 또는 POST /api/auth/oauth2/register   (DCR)
             ──► 브라우저: /api/auth/oauth2/authorize → /auth/sign-in → /auth/mcp-consent
             ──► POST /api/auth/oauth2/token (PKCE S256) → JWT 액세스 토큰
             ──► POST /api/mcp (Bearer)
                    app/api/mcp/route.ts      requireMcpAuth(JWKS) → actorFromClaims(역할은 DB에서)
                    lib/mcp/server.ts         요청마다 McpServer 하나, 이 행위자가 쓸 수 있는 도구만 등록
                    lib/mcp/tools/*.ts        zod 입력 → 서비스 → CallToolResult
                    lib/server/services/admin/*.ts   웹 Server Action과 공유
```

- **인가 서버**: Better Auth + `jwt()`, `@better-auth/mcp`, `@better-auth/cimd`([`auth.ts`](../../auth.ts)).
  토큰의 audience는 `/api/mcp`로 묶인다.
- **서비스 계층**: 모든 관리자 쓰기는 `lib/server/services/admin/*`에 있고, 명시적인 `Actor`
  (`{ userId, role, scopes, via }`)를 받아 `ServiceResult`를 돌려준다. 웹 Server Action과 MCP 도구는 같은 함수를
  감싼 얇은 어댑터라서 권한 검사·검증·캐시 무효화가 서로 어긋날 수 없다.
- **캐시 무효화**: `updateTag`는 Server Action에서만 동작한다. MCP 라우트는 도구를
  `runWithRouteHandlerInvalidation` 안에서 실행하고, 그 안에서는 `updateCacheTags`가
  `revalidateTag(tag, { expire: 0 })`로 바뀐다([`invalidation-context.ts`](../../lib/server/cache/invalidation-context.ts)).
- **감사 로그**: 쓰기·관리 도구 호출은 `lib/mcp/audit.ts`가 기록한다(아래).

## 권한

도구 호출은 다음 세 가지를 모두 만족할 때만 허용된다.

1. 액세스 토큰에 도구의 스코프가 있다.
2. 역할 권한 표([`policy.ts`](../../lib/server/permission/policy.ts))가 그 작업을 허용한다(소유권 포함: MEMBER는
   본인 프로젝트만 수정).
3. LEAD가 아니면 자신이 속한 파트의 기수 안에서만 작업한다.

`tools/list`는 그 역할이 받은 스코프로 쓸 가능성이 있는 도구만 돌려준다. 소유권은 도구를 실행할 때 확인한다.
전체 규칙은 [`auth-and-permissions.md`](./auth-and-permissions.md).

멤버 데이터 규칙(웹과 MCP 공통):

- **연락처**(이메일, 전화, 학번)는 본인, LEAD, 같은 기수 멤버에게만 보인다. 그 외에는 해당 필드가 `null`. 이름·파트·기수는 보인다.
- **멤버 수정**: 누구나 본인 프로필을 고칠 수 있다. LEAD는 누구나 고칠 수 있다. CORE는 같은 기수의 MEMBER·ALUMNUS·UNVERIFIED만 고칠 수 있다.
- **이메일 변경**: 본인 또는 LEAD만(로그인이 이메일로 계정을 연결하므로, 남의 이메일을 바꾸면 그 계정을 넘겨주는 셈이다).

| 스코프       | 열리는 것                                                          |
| ------------ | ------------------------------------------------------------------ |
| `gyms:read`  | 모든 조회 도구                                                     |
| `gyms:write` | 생성·수정, 세션 참가 신청, 참가자 제거, 이미지 업로드, 본인 프로필 |
| `gyms:admin` | 삭제, 가입 대기 목록, 승인, 역할 변경                              |

| 역할       | MCP로 할 수 있는 일                                                                |
| ---------- | ---------------------------------------------------------------------------------- |
| LEAD       | 전부                                                                               |
| CORE       | 세션·프로젝트·파트·멤버 CRUD, 세션·프로젝트 삭제. 역할·기수 관리는 불가            |
| MEMBER     | 세션·프로젝트 조회, 프로젝트 생성, 본인 프로젝트 수정, 세션 참가 신청, 본인 프로필 |
| ALUMNUS    | 세션·프로젝트 조회, 세션 참가 신청, 본인 프로필                                    |
| UNVERIFIED | 연결 불가                                                                          |

역할과 그 클라이언트에 준 동의(`oauth_consent`)는 요청마다 DB에서 읽으므로(`lib/mcp/actor.ts`), 강등하거나 계정을
지우거나 연결을 끊으면 MCP 접근이 바로 끊긴다. 토큰은 JWT이며 액세스 토큰은
1시간(`gyms:admin` 포함 시 15분), 리프레시 토큰은 30일이다(`lib/mcp/config.ts`).

## 도구

| 영역     | 도구                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 컨텍스트 | `whoami`                                                                                                                                                     |
| 기수     | `list_generations`, `get_generation`, `create_generation`, `update_generation`, `delete_generation`                                                          |
| 파트     | `list_parts`, `get_part`, `create_part`, `update_part`, `delete_part`                                                                                        |
| 멤버     | `list_members`, `get_member`, `update_member`, `list_pending_members`, `approve_member`, `update_member_role`, `delete_member`                               |
| 프로필   | `get_my_profile`, `update_my_profile`                                                                                                                        |
| 프로젝트 | `list_projects`, `get_project`, `create_project`, `update_project`, `delete_project`                                                                         |
| 세션     | `list_sessions`, `get_session`, `create_session`, `update_session`, `register_session`, `unregister_session`, `remove_session_participant`, `delete_session` |
| 이미지   | `create_image_upload`, `complete_image_upload`, `import_image_from_url`                                                                                      |

- 수정 도구는 부분 수정이다. 빠진 필드는 현재 값을 유지한다.
- 오프셋 없는 세션 시각은 서울 벽시계 시각으로 본다. 오프셋이 있으면 서울 시각으로 바꾼다.
- `internalOpen`으로 `create_session`을 하면 웹과 마찬가지로 그 기수 멤버에게 메일을 보낸다.
- 접근할 수 없는 `generationId`를 명시하면 `FORBIDDEN`이다(생략하면 기본 기수).
- `list_sessions`에 `openForRegistration`을 주면 끝난 세션과 정원이 찬 세션을 뺀다. 각 행에 `participantCount`가 있다.
- 날짜가 없는 오래된 세션을 `update_session`할 때는 `startAt`과 `endAt`을 함께 넣어야 한다.

### 이미지 (최대 200MB, Cloudflare R2)

자세한 흐름과 SSRF 방어는 [`uploads.md`](./uploads.md#2-mcp-업로드-최대-200mb).

- 셸이 있는 클라이언트: `create_image_upload` → `curl`로 PUT → `complete_image_upload`(크기·매직 바이트 확인 후 공개 URL).
- 셸이 없는 클라이언트: `import_image_from_url`이 공개 https 이미지를 R2로 스트리밍한다.
- 허용 형식: jpg, jpeg, png, webp, gif, avif. SVG는 거부.
- 한도: 사용자당 시간당 100회(실패·거절 포함). 넘으면 `RATE_LIMITED`.

## 연결 관리

멤버는 프로필의 **연결된 AI 도구**(`/admin/profile/mcp`)에서 자신이 동의한 클라이언트(이름, 스코프, 연결·마지막 사용
시각)를 보고 연결을 끊을 수 있다. 끊으면 동의 기록을 지우고 그 클라이언트의 리프레시·액세스 토큰을 폐기한다
(`lib/server/services/admin/mcp-connections.ts`). 같은 화면에 최근 MCP 활동(감사 로그 50건)이 나오고, LEAD는
"모든 멤버"로 전체 기록을 본다.

## 감사 로그

쓰기·관리 도구 호출은 성공 여부와 관계없이 `mcp_audit_log`에 남는다: 사용자, 역할, OAuth 클라이언트 id와 이름,
도구, 정리된 입력, 결과, 대상 id(실패했으면 입력에서 추출). 정리 과정에서 비밀처럼 보이는 키와 이메일·전화·학번
값을 가리고, URL 쿼리 문자열(서명 URL)을 지우고, 긴 문자열을 자른다. 1년 지난 행은 자동으로 지운다.

```sql
select "createdAt", tool, outcome, "errorCode", "targetId", "clientId"
from mcp_audit_log
where "userId" = $1
order by "createdAt" desc
limit 50;
```

## 알려진 한계

- 아주 큰 원본 이미지도 `next/image`로 제공하므로, 200MB 이미지의 첫 최적화 요청은 느리다.
- 감사 로그 화면은 최근 50건만 보여 준다. 더 오래된 기록은 위 SQL로 본다.
