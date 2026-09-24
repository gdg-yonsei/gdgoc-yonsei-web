import { describe, expect, it } from 'vitest'
import { countLabel, fillTemplate, initials } from '@/lib/site/format'

describe('copy templates', () => {
  it('replaces known tokens and leaves unknown ones', () => {
    expect(
      fillTemplate('{count} sessions in {generation}', {
        count: 3,
        generation: '25-26',
      })
    ).toBe('3 sessions in 25-26')
    expect(fillTemplate('{missing}', {})).toBe('{missing}')
  })

  it('picks the singular or plural template', () => {
    expect(countLabel(1, '{count} session', '{count} sessions')).toBe(
      '1 session'
    )
    expect(countLabel(0, '{count} session', '{count} sessions')).toBe(
      '0 sessions'
    )
  })

  it('builds avatar initials for Latin and Hangul names', () => {
    expect(initials('Minji Kim')).toBe('MK')
    expect(initials('김민지')).toBe('김')
    expect(initials('   ')).toBe('?')
  })
})
