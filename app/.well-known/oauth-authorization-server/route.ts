import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider'
import { connection } from 'next/server'
import { auth } from '@/auth'

const metadata = oauthProviderAuthServerMetadata(auth)

/**
 * RFC 8414 문서의 정식 위치는 issuer 경로가 붙은
 * `/.well-known/oauth-authorization-server/api/auth`(`[...path]` 가 처리)이다.
 * 경로 없는 루트 위치를 먼저 조회하는 2025 세대 MCP 클라이언트를 위해 같은 문서를 여기서도 낸다.
 *
 * connection() 으로 요청 시점에만 실행한다. 빌드에서 사전 렌더링되면 여러 빌드 워커가
 * 동시에 Better Auth 를 초기화하며 oauth_resource 를 시드하다 unique 제약에 부딪힌다.
 */
export async function GET(request: Request) {
  await connection()
  return metadata(request)
}
