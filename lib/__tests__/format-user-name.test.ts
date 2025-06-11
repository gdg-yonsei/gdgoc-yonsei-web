import { describe, it, expect } from 'vitest'
import formatUserName from '../format-user-name'

describe('formatUserName', () => {
  it('formats full name when not foreigner', () => {
    const result = formatUserName('gh', 'John', 'Doe', false)
    expect(result).toBe('Doe John')
  })

  it('formats full name when foreigner', () => {
    const result = formatUserName('gh', 'John', 'Doe', true)
    expect(result).toBe('John Doe')
  })

  it('falls back to GitHub name', () => {
    const result = formatUserName('githubName', null, null, false)
    expect(result).toBe('githubName')
  })

  it('returns Unknown User when no info', () => {
    const result = formatUserName(null, null, null)
    expect(result).toBe('Unknown User')
  })
})
