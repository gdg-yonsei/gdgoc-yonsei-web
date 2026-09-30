import { requireMcpAuth } from '@better-auth/mcp'
import {
  OAuthError,
  OAuthErrorCode,
  bearerAuthChallengeResponse,
  getOAuthProtectedResourceMetadataUrl,
} from '@modelcontextprotocol/server'
import { auth } from '@/auth'
import { actorFromClaims } from '@/lib/mcp/actor'
import { getMcpResourceUrl } from '@/lib/mcp/config'
import { createGymsMcpHandler } from '@/lib/mcp/server'
import { ALL_TOOLS } from '@/lib/mcp/tools'
import { runWithRouteHandlerInvalidation } from '@/lib/server/cache/invalidation-context'

const resource = getMcpResourceUrl()
const mcp = createGymsMcpHandler(ALL_TOOLS)

/**
 * GYMS MCP 엔드포인트 (Streamable HTTP, 무상태).
 *
 * `requireMcpAuth` 가 JWT 서명·issuer·audience·만료를 검증하고 없거나 틀리면
 * RFC 9728 `WWW-Authenticate` 로 401 을 돌려준다. 통과한 토큰은 DB 의 현재 역할로
 * Actor 를 만들고, 서비스의 캐시 무효화가 Route Handler 에서도 동작하도록
 * 무효화 컨텍스트 안에서 실행한다. GET/DELETE 는 내보내지 않아 405 가 된다.
 */
export const POST = requireMcpAuth(
  auth,
  async (request, claims) => {
    const actor = await actorFromClaims(claims)
    if (!actor) {
      return bearerAuthChallengeResponse(
        new OAuthError(
          OAuthErrorCode.InvalidToken,
          'This account cannot use GYMS MCP.'
        ),
        {
          resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(
            new URL(resource)
          ),
        }
      )
    }

    return runWithRouteHandlerInvalidation(() =>
      mcp.fetch(request, {
        authInfo: {
          token: '',
          clientId: actor.clientId ?? '',
          scopes: actor.scopes === 'session' ? [] : actor.scopes,
          expiresAt: typeof claims.exp === 'number' ? claims.exp : undefined,
          extra: { actor },
        },
      })
    )
  },
  { resource }
)
