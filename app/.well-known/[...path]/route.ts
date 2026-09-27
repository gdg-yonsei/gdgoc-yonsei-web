import { auth } from '@/auth'

/**
 * OAuth/MCP 디스커버리 문서.
 *
 * `@better-auth/mcp` 는 onRequest 에서 루트 경로의
 * `/.well-known/oauth-protected-resource[/api/mcp]`(RFC 9728)를,
 * oauth-provider 는 `/.well-known/oauth-authorization-server`(RFC 8414)와
 * `/.well-known/openid-configuration` 을 처리한다. 둘 다 Better Auth 핸들러로 넘긴다.
 */
export function GET(request: Request) {
  return auth.handler(request)
}

export const HEAD = GET
