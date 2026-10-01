import { describe, expect, it } from 'vitest'
import {
  generationPath,
  localeHref,
  projectPath,
  sessionPath,
} from '@/lib/site/routes'

describe('site routes', () => {
  it('builds unlocalized archive and detail paths', () => {
    expect(generationPath('member', '25-26')).toBe('/member/25-26')
    expect(sessionPath('25-26', 'abc')).toBe('/session/25-26/abc')
    expect(projectPath('25-26', 'xyz')).toBe('/project/25-26/xyz')
  })

  it('prefixes the locale for links', () => {
    expect(localeHref('ko')).toBe('/ko')
    expect(localeHref('en', sessionPath('25-26', 'abc'))).toBe(
      '/en/session/25-26/abc'
    )
  })
})
