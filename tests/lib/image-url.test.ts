import { describe, expect, it } from 'vitest'
import { joinImageUrl } from '@/lib/image-url'

describe('joinImageUrl', () => {
  it.each([
    ['https://cdn.example', 'sessions/a.png'],
    ['https://cdn.example/', 'sessions/a.png'],
    ['https://cdn.example//', '/sessions/a.png'],
    [' https://cdn.example/ ', 'sessions/a.png'],
  ])('joins %s and %s with one slash', (base, key) => {
    expect(joinImageUrl(base, key)).toBe('https://cdn.example/sessions/a.png')
  })
})
