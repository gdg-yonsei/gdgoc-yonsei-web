import { describe, expect, it } from 'vitest'
import {
  findMembership,
  groupMemberships,
  listMembershipGenerations,
  listMembershipParts,
  memberDisplayName,
  memberMatchesSearch,
  normalizeMemberSearch,
} from '@/lib/admin/member-options'

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

describe('member picker helpers', () => {
  const kim = {
    name: 'seungyeon',
    firstName: 'Seungyeon',
    lastName: 'Kim',
    firstNameKo: '승연',
    lastNameKo: '김',
    isForeigner: false,
    memberships: [
      { generationId: 11, generation: '11th', part: 'FE' },
      { generationId: 12, generation: '12th', part: 'BE' },
    ],
  }
  const lee = {
    name: 'lee',
    firstName: 'Jin',
    lastName: 'Lee',
    firstNameKo: null,
    lastNameKo: null,
    isForeigner: false,
    memberships: [{ generationId: 12, generation: '12th', part: 'AI' }],
  }

  it('prefers the Korean name and falls back to the English one', () => {
    expect(memberDisplayName(kim)).toBe('김승연')
    expect(memberDisplayName(lee)).toBe('Lee Jin')
  })

  it('matches searches regardless of spacing and case', () => {
    expect(memberMatchesSearch(kim, normalizeMemberSearch('김 승연'))).toBe(
      true
    )
    expect(memberMatchesSearch(lee, normalizeMemberSearch('JIN'))).toBe(true)
    expect(memberMatchesSearch(lee, normalizeMemberSearch('kim'))).toBe(false)
    expect(memberMatchesSearch(lee, '')).toBe(true)
  })

  it('treats empty generation and part filters as wildcards', () => {
    expect(findMembership(kim.memberships, '', '')).toBeDefined()
    expect(findMembership(kim.memberships, '12th', 'FE')).toBeUndefined()
    expect(findMembership(kim.memberships, '12th', 'BE')?.part).toBe('BE')
  })

  it('lists generations newest first and parts per generation', () => {
    expect(listMembershipGenerations([kim, lee])).toEqual(['12th', '11th'])
    expect(listMembershipParts([kim, lee], '')).toEqual(['AI', 'BE', 'FE'])
    expect(listMembershipParts([kim, lee], '12th')).toEqual(['AI', 'BE'])
  })
})
