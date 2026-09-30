import { beforeEach, describe, expect, it, vi } from 'vitest'

const { findSession, findPart, canAccessGeneration, dbDelete, dbUpdate } =
  vi.hoisted(() => ({
    findSession: vi.fn(),
    findPart: vi.fn(),
    canAccessGeneration: vi.fn(),
    dbDelete: vi.fn(),
    dbUpdate: vi.fn(),
  }))

vi.mock('@/db', () => ({
  default: {
    query: {
      sessions: { findFirst: findSession },
      parts: { findFirst: findPart },
    },
    delete: dbDelete,
    update: dbUpdate,
  },
}))

vi.mock('@/lib/server/services/admin/authorize', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/lib/server/services/admin/authorize')
  >()),
  canAccessGeneration,
}))

vi.mock('@/lib/server/cache', () => ({
  invalidateSessionPublicCache: vi.fn(),
}))
vi.mock('@/lib/server/services/cache-context', () => ({
  getGenerationNameForPartId: vi.fn(async () => 'gen'),
  getSessionCacheContext: vi.fn(async () => ({ generationName: 'gen' })),
}))

import {
  createSession,
  deleteSession,
  registerForSession,
  removeSessionParticipant,
  unregisterFromSession,
  updateSession,
} from '@/lib/server/services/admin/sessions'
import type { Actor } from '@/lib/server/services/admin/types'

const SID = '00000000-0000-4000-8000-000000000000'
const core: Actor = {
  userId: 'core',
  role: 'CORE',
  scopes: ['gyms:read', 'gyms:write', 'gyms:admin'],
  via: 'mcp',
}

beforeEach(() => {
  vi.clearAllMocks()
  canAccessGeneration.mockResolvedValue(true)
})

describe('sessions service', () => {
  it('returns NOT_FOUND for an unknown session', async () => {
    findSession.mockResolvedValue(undefined)
    await expect(updateSession(core, SID, {})).resolves.toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
  })

  it('returns NOT_FOUND for a malformed session id', async () => {
    await expect(updateSession(core, 'nope', {})).resolves.toMatchObject({
      ok: false,
      code: 'NOT_FOUND',
    })
    expect(findSession).not.toHaveBeenCalled()
  })

  it('forbids CORE from editing another generation session', async () => {
    findSession.mockResolvedValue({
      id: SID,
      authorId: 'x',
      part: { generationsId: 9 },
    })
    canAccessGeneration.mockResolvedValue(false)
    await expect(updateSession(core, SID, {})).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    expect(canAccessGeneration).toHaveBeenCalledWith(core, 9)
    expect(dbUpdate).not.toHaveBeenCalled()
  })

  it('forbids delete with a write-only token', async () => {
    const writer: Actor = { ...core, scopes: ['gyms:read', 'gyms:write'] }
    await expect(deleteSession(writer, SID)).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    expect(dbDelete).not.toHaveBeenCalled()
  })

  it('forbids MEMBER from removing participants of a session they did not write', async () => {
    findSession.mockResolvedValue({
      id: SID,
      authorId: 'someone',
      part: { generationsId: 1 },
    })
    const member: Actor = { ...core, userId: 'me', role: 'MEMBER' }
    await expect(
      removeSessionParticipant(member, SID, 'victim')
    ).resolves.toMatchObject({ ok: false, code: 'FORBIDDEN' })
    expect(dbDelete).not.toHaveBeenCalled()
  })

  it('reports CONFLICT when already registered', async () => {
    findSession.mockResolvedValue({
      id: SID,
      internalOpen: true,
      publicOpen: false,
      endAt: new Date('2999-01-01T00:00:00Z'),
      userToSession: [{ userId: 'core' }],
      author: null,
    })
    await expect(registerForSession(core, SID)).resolves.toEqual({
      ok: false,
      code: 'CONFLICT',
      message: 'Already registered',
    })
  })

  it('lets the author edit their own session outside their current generations', async () => {
    findSession.mockResolvedValue({
      id: SID,
      authorId: 'core',
      part: { generationsId: 9 },
    })
    canAccessGeneration.mockResolvedValue(false)
    const result = await updateSession(core, SID, {})
    // 권한 검사를 통과하고 입력 검증 단계까지 간다.
    expect(result).toMatchObject({ ok: false, code: 'VALIDATION' })
  })

  it('refuses a part outside the generation the web form was opened in', async () => {
    findPart.mockResolvedValue({ generationsId: 5, name: 'Web' })
    const result = await createSession(
      core,
      {
        name: 'S',
        nameKo: '에스',
        description: 'd',
        descriptionKo: 'ㄷ',
        mainImage: null,
        contentImages: [],
        location: 'L',
        locationKo: '엘',
        maxCapacity: 10,
        internalOpen: false,
        publicOpen: false,
        startAt: new Date('2027-01-01T10:00:00Z'),
        endAt: new Date('2027-01-01T12:00:00Z'),
        partId: '3',
        participantId: [],
        type: 'Part Session',
        category: 'tech_talk',
        displayOnWebsite: true,
      },
      { expectedGenerationId: 4 }
    )
    expect(result).toEqual({
      ok: false,
      code: 'VALIDATION',
      message:
        'The selected part does not belong to the current generation scope.',
    })
  })

  it('requires the gyms:write scope to register or unregister', async () => {
    const reader: Actor = { ...core, scopes: ['gyms:read'] }
    await expect(registerForSession(reader, SID)).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    await expect(unregisterFromSession(reader, SID)).resolves.toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    })
    expect(findSession).not.toHaveBeenCalled()
  })
})
