import { describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}))

import { revalidateTag } from 'next/cache'
import { revalidateCache } from '@/lib/server/cache'

describe('revalidateCache', () => {
  it('revalidates a single tag', () => {
    revalidateCache('members')

    expect(revalidateTag).toHaveBeenCalledWith('members', 'max')
    expect(revalidateTag).toHaveBeenCalledTimes(1)
  })

  it('revalidates every tag in a list', () => {
    revalidateCache(['members', 'parts'])

    expect(revalidateTag).toHaveBeenCalledWith('members', 'max')
    expect(revalidateTag).toHaveBeenCalledWith('parts', 'max')
    expect(revalidateTag).toHaveBeenCalledTimes(2)
  })
})
