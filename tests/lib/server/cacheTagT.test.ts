import { describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({
  cacheTag: vi.fn(),
}))

import { cacheTag } from 'next/cache'
import cacheTagT from '@/lib/server/cacheTagT'

describe('cacheTagT', () => {
  it('forwards cache tags to next/cache', () => {
    cacheTagT('members', 'projects')

    expect(cacheTag).toHaveBeenCalledWith('members', 'projects')
  })
})
