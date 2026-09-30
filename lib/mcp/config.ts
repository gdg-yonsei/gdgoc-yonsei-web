import 'server-only'

import { getAuthEnv } from '@/lib/server/env-core'

export const MCP_SCOPES = ['gyms:read', 'gyms:write', 'gyms:admin'] as const
export const MCP_ACCESS_TOKEN_TTL = 3600
/**
 * gyms:admin 이 포함된 access 토큰 수명. scopeExpirations 는 숫자를 만료 시각(epoch 초)으로
 * 해석하므로 반드시 상대 기간 문자열로 적는다.
 */
export const MCP_ADMIN_ACCESS_TOKEN_TTL = '15m'
export const MCP_REFRESH_TOKEN_TTL = 2_592_000

/** RFC 8707 리소스 식별자. 발급 토큰의 audience 이자 MCP 엔드포인트 URL 이다. */
export function getMcpResourceUrl(): string {
  return `${new URL(getAuthEnv().BETTER_AUTH_URL).origin}/api/mcp`
}
