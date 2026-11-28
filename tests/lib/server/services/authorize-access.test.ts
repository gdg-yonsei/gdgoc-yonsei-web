import { beforeEach, describe, expect, it, vi } from 'vitest'

const { canAccessGeneration } = vi.hoisted(() => ({
  canAccessGeneration: vi.fn(),
}))

vi.mock('@/db', () => ({ db: {} }))
vi.mock('@/lib/server/services/admin/authorize', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/services/admin/authorize')
  >()),
  canAccessGeneration,
}))

import { authorizeAccess } from '@/lib/server/services/admin/authorize-access'
import type { Actor, Role } from '@/lib/server/services/admin/types'

const web = (role: Role, userId = 'me'): Actor => ({
  userId,
  role,
  scopes: 'session',
  via: 'web',
})

beforeEach(() => {
  vi.clearAllMocks()
  canAccessGeneration.mockResolvedValue(false)
})

describe('authorizeAccess', () => {
  it('denies a generation-scoped action when no generation is given', async () => {
    const result = await authorizeAccess(web('CORE'), 'delete', 'projects')
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' })
    // 기수가 없으면 접근 가능한 기수 조회 결과도 거부여야 한다.
    expect(canAccessGeneration).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'CORE' }),
      undefined
    )
  })

  it('allows a generation-scoped action only inside an accessible generation', async () => {
    canAccessGeneration.mockImplementation(
      async (_actor: Actor, generationId: number) => generationId === 3
    )
    expect(
      (
        await authorizeAccess(web('CORE'), 'post', 'sessions', {
          generationId: 3,
        })
      ).ok
    ).toBe(true)
    expect(
      await authorizeAccess(web('CORE'), 'post', 'sessions', {
        generationId: 4,
        generationDenied: 'out of scope',
      })
    ).toEqual({ ok: false, code: 'FORBIDDEN', message: 'out of scope' })
  })

  it('lets an author edit their own content without a generation lookup', async () => {
    const result = await authorizeAccess(web('CORE'), 'put', 'projects', {
      ownerId: 'me',
      generationId: 9,
    })
    expect(result.ok).toBe(true)
    expect(canAccessGeneration).not.toHaveBeenCalled()
  })

  it('does not let ownership stand in for a generation-only rule', async () => {
    const result = await authorizeAccess(web('CORE'), 'delete', 'projects', {
      ownerId: 'me',
      generationId: 9,
    })
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })

  it('never treats a missing owner as the requester', async () => {
    const result = await authorizeAccess(web('MEMBER', ''), 'put', 'projects', {
      ownerId: '',
    })
    expect(result).toMatchObject({ ok: false, code: 'FORBIDDEN' })
  })

  it('skips the generation lookup for lead and for undeclared rules', async () => {
    expect(
      (await authorizeAccess(web('LEAD'), 'delete', 'sessions', {})).ok
    ).toBe(true)
    expect(
      await authorizeAccess(web('MEMBER'), 'post', 'sessions', {
        generationId: 1,
      })
    ).toMatchObject({ ok: false, code: 'FORBIDDEN' })
    expect(canAccessGeneration).not.toHaveBeenCalled()
  })

  it('checks the token scope before the role', async () => {
    const readOnly: Actor = {
      userId: 'me',
      role: 'LEAD',
      scopes: ['gyms:read'],
      via: 'mcp',
    }
    expect(
      await authorizeAccess(readOnly, 'put', 'projects', { generationId: 1 })
    ).toEqual({
      ok: false,
      code: 'FORBIDDEN',
      message: 'The access token does not grant this operation.',
    })
  })

  it('uses a caller-established generation fact instead of a lookup', async () => {
    expect(
      (
        await authorizeAccess(web('CORE'), 'put', 'members', {
          ownerId: 'other',
          inGeneration: true,
        })
      ).ok
    ).toBe(true)
    expect(
      (
        await authorizeAccess(web('CORE'), 'put', 'members', {
          ownerId: 'other',
          inGeneration: false,
        })
      ).ok
    ).toBe(false)
    expect(canAccessGeneration).not.toHaveBeenCalled()
  })
})
