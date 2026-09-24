import { describe, expect, it } from 'vitest'
import { isPlaceholderImage } from '@/lib/site/images'

describe('isPlaceholderImage', () => {
  it('recognises the stock fallbacks, local or absolute', () => {
    expect(isPlaceholderImage('/session-default.png')).toBe(true)
    expect(
      isPlaceholderImage('https://gdgoc.yonsei.ac.kr/project-default.png')
    ).toBe(true)
    expect(isPlaceholderImage('')).toBe(true)
    expect(isPlaceholderImage(null)).toBe(true)
  })

  it('keeps real uploads', () => {
    expect(
      isPlaceholderImage('https://image.gdgyonsei.moveto.kr/sessions/a.webp')
    ).toBe(false)
  })
})
