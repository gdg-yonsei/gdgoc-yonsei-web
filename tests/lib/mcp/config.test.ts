import { expect, it, vi } from 'vitest'

vi.mock('@/lib/server/env-core', () => ({
  getAuthEnv: () => ({
    BETTER_AUTH_URL: 'https://gdgoc.yonsei.ac.kr/some/path',
  }),
}))

import { getMcpResourceUrl } from '@/lib/mcp/config'

it('derives the MCP resource from the auth origin', () => {
  expect(getMcpResourceUrl()).toBe('https://gdgoc.yonsei.ac.kr/api/mcp')
})

it('expresses the admin token lifetime as a relative duration', async () => {
  // oauth-provider 의 scopeExpirations 는 숫자를 "만료 시각(epoch 초)"으로 해석한다.
  // 900 을 넣으면 1970년에 만료된 토큰이 발급된다.
  const { MCP_ADMIN_ACCESS_TOKEN_TTL } = await import('@/lib/mcp/config')
  expect(typeof MCP_ADMIN_ACCESS_TOKEN_TTL).toBe('string')
  expect(MCP_ADMIN_ACCESS_TOKEN_TTL).toBe('15m')
})
