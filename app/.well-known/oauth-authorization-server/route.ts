import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider'
import { auth } from '@/auth'

/**
 * RFC 8414 문서의 정식 위치는 issuer 경로가 붙은
 * `/.well-known/oauth-authorization-server/api/auth`(`[...path]` 가 처리)이다.
 * 경로 없는 루트 위치를 먼저 조회하는 2025 세대 MCP 클라이언트를 위해 같은 문서를 여기서도 낸다.
 */
export const GET = oauthProviderAuthServerMetadata(auth)
