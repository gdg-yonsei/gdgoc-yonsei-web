import { beforeEach, describe, expect, it, vi } from 'vitest'

const { calls, connection, handler, metadata } = vi.hoisted(() => {
  const calls: string[] = []
  return {
    calls,
    connection: vi.fn(async () => {
      calls.push('connection')
    }),
    handler: vi.fn(async () => {
      calls.push('auth')
      return new Response('{}')
    }),
    metadata: vi.fn(async () => {
      calls.push('auth')
      return new Response('{}')
    }),
  }
})

vi.mock('next/server', () => ({ connection }))
vi.mock('@/auth', () => ({ auth: { handler } }))
vi.mock('@better-auth/oauth-provider', () => ({
  oauthProviderAuthServerMetadata: () => metadata,
}))

// 빌드 중 사전 렌더링되면 여러 빌드 워커가 동시에 Better Auth 를 초기화하며
// oauth_resource 를 시드하다 unique 제약에 부딪힌다. 요청 시점에만 실행돼야 한다.
describe('.well-known discovery routes', () => {
  beforeEach(() => {
    calls.length = 0
  })

  it('defers the authorization server metadata route to request time', async () => {
    const { GET } =
      await import('@/app/.well-known/oauth-authorization-server/route')
    await GET(
      new Request('http://localhost/.well-known/oauth-authorization-server')
    )
    expect(calls).toEqual(['connection', 'auth'])
  })

  it('defers the catch-all discovery route to request time', async () => {
    const { GET } = await import('@/app/.well-known/[...path]/route')
    await GET(
      new Request(
        'http://localhost/.well-known/oauth-protected-resource/api/mcp'
      )
    )
    expect(calls).toEqual(['connection', 'auth'])
  })
})
