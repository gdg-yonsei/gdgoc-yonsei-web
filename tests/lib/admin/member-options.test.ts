import { describe, expect, it } from 'vitest'
import { groupMemberships } from '@/lib/admin/member-options'

describe('groupMemberships', () => {
  it('collects every generation and part of a member into one entry', () => {
    const grouped = groupMemberships([
      {
        id: 'a',
        name: 'alice',
        generationId: 11,
        generation: '11th',
        part: 'FE',
      },
      {
        id: 'b',
        name: 'bob',
        generationId: 11,
        generation: '11th',
        part: 'BE',
      },
      {
        id: 'a',
        name: 'alice',
        generationId: 10,
        generation: '10th',
        part: 'AI',
      },
    ])

    expect(grouped).toEqual([
      {
        id: 'a',
        name: 'alice',
        memberships: [
          { generationId: 11, generation: '11th', part: 'FE' },
          { generationId: 10, generation: '10th', part: 'AI' },
        ],
      },
      {
        id: 'b',
        name: 'bob',
        memberships: [{ generationId: 11, generation: '11th', part: 'BE' }],
      },
    ])
  })
})
