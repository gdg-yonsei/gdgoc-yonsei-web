import { beforeEach, describe, expect, it, vi } from 'vitest'

const { actorFromClaims, mcpFetch, isRouteHandlerInvalidation } = vi.hoisted(() => ({
  actorFromClaims: vi.fn(),
  mcpFetch: vi.fn(),
  isRouteHandlerInvalidation: { value: false },
}))

vi.mock('@/auth', () => ({ auth: {} }))
vi.mock('@better-auth/mcp', () => ({
  // 토큰 검증은 플러그인 몫이다. 여기서는 검증을 통과한 클레임을 넘긴다고 가정한다.
  requireMcpAuth:
    (_auth: unknown, handler: (request: Request, claims: unknown) => Promise<Response>) =>
    (request: Request) =>
      handler(request, { sub: 'u1', scope: 'gyms:read', azp: 'c1', exp: 2_000_000_000 }),
}))
vi.mock('@/lib/mcp/config', () => ({
  getMcpResourceUrl: () => 'https://gdgoc.test/api/mcp',
}))
vi.mock('@/lib/mcp/actor', () => ({ actorFromClaims }))
vi.mock('@/lib/mcp/server', () => ({
  createGymsMcpHandler: () => ({
    fetch: async (request: Request, options: unknown) => {
      const { isRouteHandlerInvalidation: check } = await import(
        '@/lib/server/cache/invalidation-context'
      )
      isRouteHandlerInvalidation.value = check()
      return mcpFetch(request, options)
    },
  }),
}))
vi.mock('@/lib/mcp/tools', () => ({ ALL_TOOLS: [] }))

import { POST } from '@/app/api/mcp/route'

const request = () =>
  new Request('https://gdgoc.test/api/mcp', { method: 'POST', body: '{}' })

describe('POST /api/mcp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isRouteHandlerInvalidation.value = false
  })

  it('answers 401 with a resource metadata challenge when the user may not use MCP', async () => {
    actorFromClaims.mockResolvedValue(null)
    const response = await POST(request())
    expect(response.status).toBe(401)
    expect(response.headers.get('www-authenticate')).toContain(
      'resource_metadata="https://gdgoc.test/.well-known/oauth-protected-resource/api/mcp"'
    )
    expect(mcpFetch).not.toHaveBeenCalled()
  })

  it('serves the request as the actor inside the route-handler invalidation context', async () => {
    const actor = { userId: 'u1', role: 'CORE', scopes: ['gyms:read'], via: 'mcp', clientId: 'c1' }
    actorFromClaims.mockResolvedValue(actor)
    mcpFetch.mockResolvedValue(new Response('ok'))

    const response = await POST(request())

    expect(await response.text()).toBe('ok')
    expect(isRouteHandlerInvalidation.value).toBe(true)
    expect(mcpFetch).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({
        authInfo: expect.objectContaining({
          clientId: 'c1',
          scopes: ['gyms:read'],
          expiresAt: 2_000_000_000,
          extra: { actor },
        }),
      })
    )
  })
})
