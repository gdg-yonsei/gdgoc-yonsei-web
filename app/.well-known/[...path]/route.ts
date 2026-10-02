/**
 * OAuth/MCP 디스커버리 문서 라우트(`/.well-known/*`).
 */
import { connection } from 'next/server'
import { auth } from '@/auth'

/**
 * OAuth/MCP 디스커버리 문서.
 *
 * `@better-auth/mcp` 는 onRequest 에서 루트 경로의
 * `/.well-known/oauth-protected-resource[/api/mcp]`(RFC 9728)를,
 * oauth-provider 는 `/.well-known/oauth-authorization-server`(RFC 8414)와
 * `/.well-known/openid-configuration` 을 처리한다. 둘 다 Better Auth 핸들러로 넘긴다.
 * 빌드 중 사전 렌더링되지 않도록 요청 시점에만 실행한다.
 */
export async function GET(request: Request) {
  await connection()
  return auth.handler(request)
}

/** HEAD 요청도 같은 핸들러로 처리한다. */
export const HEAD = GET
