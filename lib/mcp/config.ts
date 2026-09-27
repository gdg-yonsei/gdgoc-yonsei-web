import 'server-only'

import { getAuthEnv } from '@/lib/server/env-core'

export const MCP_SCOPES = ['gyms:read', 'gyms:write', 'gyms:admin'] as const
export const MCP_ACCESS_TOKEN_TTL = 3600
export const MCP_ADMIN_ACCESS_TOKEN_TTL = 900
export const MCP_REFRESH_TOKEN_TTL = 2_592_000

/** RFC 8707 리소스 식별자. 발급 토큰의 audience 이자 MCP 엔드포인트 URL 이다. */
export function getMcpResourceUrl(): string {
  return `${new URL(getAuthEnv().BETTER_AUTH_URL).origin}/api/mcp`
}
