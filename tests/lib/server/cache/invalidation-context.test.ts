import { beforeEach, describe, expect, it, vi } from 'vitest'

const { updateTag, revalidateTag } = vi.hoisted(() => ({
  updateTag: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({
  updateTag,
  revalidateTag,
  revalidatePath: vi.fn(),
}))

import { updateCacheTags } from '@/lib/server/cache/utils'
import { runWithRouteHandlerInvalidation } from '@/lib/server/cache/invalidation-context'

describe('updateCacheTags', () => {
  beforeEach(() => vi.clearAllMocks())

  it('uses updateTag in server actions', () => {
    updateCacheTags(['a'])
    expect(updateTag).toHaveBeenCalledWith('a')
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('uses revalidateTag with expire 0 inside route handler context', async () => {
    await runWithRouteHandlerInvalidation(async () => updateCacheTags(['b']))
    expect(revalidateTag).toHaveBeenCalledWith('b', { expire: 0 })
    expect(updateTag).not.toHaveBeenCalled()
  })
})
