import { describe, expect, it } from 'vitest'
import { layoutSocialTitle } from '@/lib/seo/social-image-title'

describe('social image title layout', () => {
  it('limits a long Korean title to two explicit lines with an ellipsis', () => {
    const layout = layoutSocialTitle(
      '아주 긴 한국어 이벤트 제목이 소셜 이미지 영역을 벗어나지 않도록 두 줄로 안전하게 제한되어야 합니다'.repeat(
        3
      ),
      'ko'
    )

    expect(layout.lines).toHaveLength(2)
    expect(layout.lines[1]).toMatch(/…$/u)
    expect(layout.truncated).toBe(true)
  })

  it('keeps English and emoji grapheme clusters intact when truncating', () => {
    const family = '👨‍👩‍👧‍👦'
    const layout = layoutSocialTitle(
      `Building delightful developer experiences ${family} `.repeat(12),
      'en'
    )
    const rendered = layout.lines.join('')

    expect(layout.lines).toHaveLength(2)
    expect(layout.truncated).toBe(true)
    expect(rendered).not.toContain('\u200d…')
    expect(rendered.endsWith('…')).toBe(true)
  })

  it('preserves a short title without adding an empty second line', () => {
    expect(layoutSocialTitle('Flutter Study Jam', 'en')).toMatchObject({
      lines: ['Flutter Study Jam'],
      truncated: false,
    })
  })
})
