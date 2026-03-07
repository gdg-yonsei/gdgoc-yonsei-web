import { describe, expect, it } from 'vitest'

import {
  forEachPublicLocale,
  homeTag,
  memberGenerationTag,
  projectTag,
  sessionGenerationTag,
} from '@/lib/server/cache'

describe('cache tags', () => {
  it('builds locale-scoped tags', () => {
    expect(homeTag('ko')).toBe('home:ko')
    expect(memberGenerationTag('9th', 'en')).toBe('member:generation:9th:en')
    expect(sessionGenerationTag('10th', 'ko')).toBe(
      'session:generation:10th:ko'
    )
  })

  it('encodes identifiers inside item tags', () => {
    expect(projectTag('project/id', 'en')).toBe(
      'project:item:project%2Fid:en'
    )
  })

  it('expands helpers across all public locales', () => {
    expect(forEachPublicLocale((locale) => [homeTag(locale)])).toEqual([
      'home:en',
      'home:ko',
    ])
  })
})
