import { describe, expect, it } from 'vitest'
import { sessionValidation } from '@/lib/validations/session'

const baseSession = {
  name: 'T19 Week 1',
  nameKo: 'T19 1주차',
  description: 'desc',
  descriptionKo: '설명',
  mainImage: null,
  contentImages: [],
  location: 'Engineering Hall',
  locationKo: '공학원',
  maxCapacity: 30,
  internalOpen: true,
  publicOpen: false,
  startAt: new Date('2026-03-03T10:00:00Z'),
  endAt: new Date('2026-03-03T12:00:00Z'),
  partId: '1',
  participantId: ['user-1'],
  type: 'General Session' as const,
  displayOnWebsite: true,
}

describe('sessionValidation category', () => {
  it('accepts every activity category', () => {
    const categories = [
      'tech_talk',
      'part_session',
      'hackathon',
      'demo_day',
      'devrel',
    ] as const
    for (const category of categories) {
      expect(() =>
        sessionValidation.parse({ ...baseSession, category })
      ).not.toThrow()
    }
  })

  it('rejects an unknown category', () => {
    expect(() =>
      sessionValidation.parse({ ...baseSession, category: 'workshop' })
    ).toThrow()
  })

  it('rejects a missing category', () => {
    expect(() => sessionValidation.parse(baseSession)).toThrow()
  })
})
