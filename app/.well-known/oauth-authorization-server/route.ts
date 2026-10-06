import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider'
import { connection } from 'next/server'
import { auth } from '@/auth'

const metadata = oauthProviderAuthServerMetadata(auth)

/** RFC 8414 issuer 경로 없는 루트도 2025 세대 MCP 클라이언트 호환을 위해 제공한다.
 * connection()은 빌드 워커의 동시 oauth_resource 시딩으로 생기는 unique 충돌을 막는다. */
export async function GET(request: Request) {
  await connection()
  return metadata(request)
}
