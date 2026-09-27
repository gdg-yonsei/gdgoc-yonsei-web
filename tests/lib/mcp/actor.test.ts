import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getUserRole } = vi.hoisted(() => ({ getUserRole: vi.fn() }))
vi.mock('@/lib/server/fetcher/admin/get-user-role', () => ({
  default: getUserRole,
}))

import { actorFromClaims } from '@/lib/mcp/actor'

describe('actorFromClaims', () => {
  beforeEach(() => {
    getUserRole.mockReset()
  })

  it('returns null when the user was demoted to UNVERIFIED (or deleted)', async () => {
    getUserRole.mockResolvedValue('UNVERIFIED')
    await expect(
      actorFromClaims({ sub: 'u1', scope: 'gyms:read', azp: 'c1' })
    ).resolves.toBeNull()
  })

  it('keeps only gyms scopes and reads the role from the database', async () => {
    getUserRole.mockResolvedValue('CORE')
    await expect(
      actorFromClaims({
        sub: 'u1',
        scope: 'openid gyms:read offline_access gyms:write',
        azp: 'c1',
      })
    ).resolves.toEqual({
      userId: 'u1',
      role: 'CORE',
      scopes: ['gyms:read', 'gyms:write'],
      via: 'mcp',
      clientId: 'c1',
    })
    expect(getUserRole).toHaveBeenCalledWith('u1')
  })

  it('falls back to client_id when azp is absent', async () => {
    getUserRole.mockResolvedValue('MEMBER')
    await expect(
      actorFromClaims({ sub: 'u1', scope: 'gyms:read', client_id: 'c9' })
    ).resolves.toMatchObject({ clientId: 'c9' })
  })

  it('returns null without sub', async () => {
    await expect(actorFromClaims({ scope: 'gyms:read' })).resolves.toBeNull()
    expect(getUserRole).not.toHaveBeenCalled()
  })
})
