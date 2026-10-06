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

/** 무상태 Streamable HTTP: JWT 서명·issuer·audience·만료를 확인하고, 실패 시 RFC 9728 인증 헤더와 401을 반환한다.
 * 현재 DB 역할로 Actor를 만들고 캐시 무효화 컨텍스트에서 실행한다. GET/DELETE는 405다. */
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
          ...(typeof claims.exp === 'number' ? { expiresAt: claims.exp } : {}),
          extra: { actor },
        },
      })
    )
  },
  { resource }
)
