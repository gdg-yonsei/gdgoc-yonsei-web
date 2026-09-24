import { describe, expect, it } from 'vitest'
import {
  SESSION_CATEGORIES,
  categoryHue,
  categoryLabel,
  isSessionCategory,
  partHue,
} from '@/lib/site/labels'

describe('session labels', () => {
  it('names every category in both languages', () => {
    expect(categoryLabel('tech_talk', 'en')).toBe('Tech Talk')
    expect(categoryLabel('demo_day', 'ko')).toBe('데모데이')
    expect(categoryLabel('devrel', 'en')).toBe('Community Event')
  })

  it('keeps unknown categories readable and neutral', () => {
    expect(isSessionCategory('workshop')).toBe(false)
    expect(categoryLabel('workshop', 'en')).toBe('workshop')
    expect(categoryHue('workshop')).toBe('neutral')
  })

  it('maps categories onto the GDG palette', () => {
    expect(SESSION_CATEGORIES.map((category) => categoryHue(category))).toEqual(
      ['blue', 'green', 'red', 'yellow', 'pink']
    )
  })

  it('matches free-text part names loosely', () => {
    expect(
      [
        'Front-End',
        'Back-End',
        'ML/AI',
        'Cloud',
        'UI/UX',
        'DevRel',
        'Organizer',
        'Blockchain',
        null,
      ].map((name) => partHue(name))
    ).toEqual([
      'blue',
      'green',
      'yellow',
      'sky',
      'pink',
      'red',
      'neutral',
      'neutral',
      'neutral',
    ])
  })
})
