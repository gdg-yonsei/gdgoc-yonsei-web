import { describe, expect, it } from 'vitest'
import formatUserName from '@/lib/format-user-name'

describe('formatUserName', () => {
  it('returns foreigner full name as first last', () => {
    expect(formatUserName(null, 'John', 'Doe', true)).toBe('John Doe')
  })

  it('returns korean full name as last+first', () => {
    expect(formatUserName(null, '길동', '홍', false, true)).toBe('홍길동')
  })

  it('returns default full name as last first', () => {
    expect(formatUserName(null, 'John', 'Doe')).toBe('Doe John')
  })

  it('returns name when first and last are missing', () => {
    expect(formatUserName('github-name', null, null)).toBe('github-name')
  })

  it('returns Unknown User when every field is empty', () => {
    expect(formatUserName(null, null, null)).toBe('Unknown User')
  })
})
