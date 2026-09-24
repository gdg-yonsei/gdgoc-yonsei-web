import { describe, expect, it } from 'vitest'
import { localizedPath } from '@/lib/site/localized-path'

describe('localizedPath', () => {
  it.each([
    ['/en', 'ko', '/ko'],
    ['/en/session/25-26/f8c1fc4a', 'ko', '/ko/session/25-26/f8c1fc4a'],
    ['/ko/project', 'en', '/en/project'],
    [null, 'ko', '/ko'],
    ['/', 'en', '/en'],
    ['/privacy', 'ko', '/ko/privacy'],
  ] as const)('%s → %s', (pathname, locale, expected) => {
    expect(localizedPath(pathname, locale)).toBe(expected)
  })
})
