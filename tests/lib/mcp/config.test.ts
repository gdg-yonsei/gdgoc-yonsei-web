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
