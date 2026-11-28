import { beforeEach, describe, expect, it, vi } from 'vitest'

const { select, limit } = vi.hoisted(() => {
  const limit = vi.fn()
  const where = vi.fn(() => ({ limit }))
  const from = vi.fn(() => ({ where }))
  return { limit, select: vi.fn(() => ({ from })) }
})

vi.mock('@/db', () => ({ db: { select } }))

import { findReferencedImageKeys } from '@/lib/server/storage/image-references'

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('findReferencedImageKeys', () => {
  it('reports a key as referenced when any table still uses it', async () => {
    // 키마다 프로젝트, 세션, 프로필 순으로 조회한다.
    limit
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'session-1' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])

    const referenced = await findReferencedImageKeys([
      'projects/shared.png',
      'projects/orphan.png',
    ])

    expect([...referenced]).toEqual(['projects/shared.png'])
    expect(select).toHaveBeenCalledTimes(6)
  })

  it('looks each key up once even when it is listed twice', async () => {
    limit.mockResolvedValue([])

    await findReferencedImageKeys(['projects/a.png', 'projects/a.png'])

    expect(select).toHaveBeenCalledTimes(3)
  })

  it('treats every key as referenced when the lookup fails, so nothing is deleted', async () => {
    limit.mockRejectedValue(new Error('db down'))

    const referenced = await findReferencedImageKeys([
      'projects/a.png',
      'sessions/b.png',
    ])

    expect([...referenced].sort()).toEqual(['projects/a.png', 'sessions/b.png'])
  })

  it('does not query when there is nothing to check', async () => {
    expect((await findReferencedImageKeys([])).size).toBe(0)
    expect(select).not.toHaveBeenCalled()
  })
})
