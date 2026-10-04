import { beforeEach, describe, expect, it, vi } from 'vitest'

const { revoke, actor, redirect } = vi.hoisted(() => ({
  revoke: vi.fn(),
  actor: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error('redirect')
  }),
}))
vi.mock('@/lib/server/services/admin/mcp-connections', () => ({
  revokeMcpConnection: revoke,
}))
vi.mock('@/lib/server/services/admin/web-actor', () => ({ getWebActor: actor }))
vi.mock('@/lib/admin-i18n/server', () => ({
  getLocalizedAdminPath: vi.fn(async () => '/ko/admin/profile/mcp'),
}))
vi.mock('next/navigation', () => ({ redirect }))
import { disconnectMcpClientAction } from '@/app/(admin)/admin/profile/mcp/actions'

const form = () => {
  const data = new FormData()
  data.set('clientId', 'client-1')
  return data
}
beforeEach(() => {
  vi.clearAllMocks()
  actor.mockResolvedValue({ userId: 'me' })
})
describe('MCP disconnect action', () => {
  it.each(['INTERNAL', 'FORBIDDEN', 'VALIDATION'])(
    'shows %s failures without redirecting',
    async (code) => {
      revoke.mockResolvedValue({ ok: false, code, message: 'Failure' })
      expect(
        await disconnectMcpClientAction({ failed: false }, form())
      ).toEqual({ failed: true })
      expect(redirect).not.toHaveBeenCalled()
    }
  )
  it.each([{ ok: true }, { ok: false, code: 'NOT_FOUND' }])(
    'redirects after success or an already missing connection: %j',
    async (result) => {
      revoke.mockResolvedValue(result)
      await expect(
        disconnectMcpClientAction({ failed: false }, form())
      ).rejects.toThrow('redirect')
      expect(redirect).toHaveBeenCalledWith('/ko/admin/profile/mcp')
    }
  )
  it('does not disconnect without a signed-in actor', async () => {
    actor.mockResolvedValue(null)
    expect(await disconnectMcpClientAction({ failed: false }, form())).toEqual({
      failed: true,
    })
    expect(revoke).not.toHaveBeenCalled()
  })
})
