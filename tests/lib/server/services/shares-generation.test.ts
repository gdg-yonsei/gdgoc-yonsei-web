import { describe, expect, it, vi } from 'vitest'

const { selectDistinct } = vi.hoisted(() => ({ selectDistinct: vi.fn() }))

vi.mock('@/db', () => ({ default: { selectDistinct } }))

import { sharesGenerationWith } from '@/lib/server/services/admin/authorize'

/** loadAccessibleGenerations 의 비 LEAD 경로(selectDistinct 체인) 결과를 순서대로 돌려준다. */
function generationsInOrder(...results: { id: number; name: string }[][]) {
  for (const result of results) {
    const chain = {
      from: () => chain,
      innerJoin: () => chain,
      where: () => chain,
      orderBy: async () => result,
    }
    selectDistinct.mockReturnValueOnce(chain)
  }
}

describe('sharesGenerationWith', () => {
  it('is true for yourself and for LEAD without querying', async () => {
    await expect(
      sharesGenerationWith({ userId: 'a', role: 'CORE' }, 'a')
    ).resolves.toBe(true)
    await expect(
      sharesGenerationWith({ userId: 'a', role: 'LEAD' }, 'b')
    ).resolves.toBe(true)
    expect(selectDistinct).not.toHaveBeenCalled()
  })

  it('is true when both belong to a common generation', async () => {
    generationsInOrder(
      [{ id: 5, name: '5th' }],
      [
        { id: 4, name: '4th' },
        { id: 5, name: '5th' },
      ]
    )
    await expect(
      sharesGenerationWith({ userId: 'a', role: 'CORE' }, 'b')
    ).resolves.toBe(true)
  })

  it('is false when they share no generation', async () => {
    generationsInOrder([{ id: 5, name: '5th' }], [{ id: 4, name: '4th' }])
    await expect(
      sharesGenerationWith({ userId: 'a', role: 'CORE' }, 'b')
    ).resolves.toBe(false)
  })
})
