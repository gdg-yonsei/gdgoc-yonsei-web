import 'server-only'

import { getAuthEnv } from '@/lib/server/env-core'
import { SCOPES } from '@/lib/server/services/admin/types'

/** MCP OAuth 토큰에 부여할 수 있는 스코프. 서비스 계층의 `SCOPES`와 같은 목록이다. */
export const MCP_SCOPES = SCOPES
export const MCP_ACCESS_TOKEN_TTL = 3600
// scopeExpirations 숫자는 epoch 만료 시각으로 해석되므로 admin 토큰 수명은 상대 기간 문자열이어야 한다.
export const MCP_ADMIN_ACCESS_TOKEN_TTL = '15m'
export const MCP_REFRESH_TOKEN_TTL = 2_592_000

/** RFC 8707 리소스 식별자. 발급 토큰의 audience 이자 MCP 엔드포인트 URL 이다. */
export function getMcpResourceUrl(): string {
  return `${new URL(getAuthEnv().BETTER_AUTH_URL).origin}/api/mcp`
}
