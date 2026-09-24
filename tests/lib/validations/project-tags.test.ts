import { describe, expect, it } from 'vitest'
import { projectValidation } from '@/lib/validations/project'
import { MAX_PROJECT_TAGS, dedupeTags } from '@/lib/validations/project-tags'

const baseProject = {
  name: 'Campus Compass',
  nameKo: '캠퍼스 나침반',
  description: 'desc',
  descriptionKo: '설명',
  content: 'content',
  contentKo: '내용',
  mainImage: '/project-default.png',
  contentImages: ['/img-1.png'],
  participants: ['user-1'],
  generationId: '1',
  repoUrl: null,
  demoUrl: null,
}

describe('dedupeTags', () => {
  it('trims, drops blanks and keeps the first spelling of duplicates', () => {
    expect(
      dedupeTags([' Next.js ', 'next.js', '', 'Firebase', 'FIREBASE'])
    ).toEqual(['Next.js', 'Firebase'])
  })
})

describe('projectValidation tags', () => {
  it('defaults to no tags', () => {
    expect(projectValidation.parse(baseProject).tags).toEqual([])
  })

  it('dedupes case-insensitively before counting', () => {
    expect(
      projectValidation.parse({ ...baseProject, tags: ['Go', 'go', 'Rust'] })
        .tags
    ).toEqual(['Go', 'Rust'])
  })

  it('rejects more than 12 distinct tags', () => {
    const tags = Array.from(
      { length: MAX_PROJECT_TAGS + 1 },
      (_, index) => `tag-${index}`
    )
    expect(projectValidation.safeParse({ ...baseProject, tags }).success).toBe(
      false
    )
  })

  it('rejects blank, overlong and delimiter-bearing tags', () => {
    for (const tag of ['   ', 'x'.repeat(33), 'a,b', 'a|b']) {
      expect(
        projectValidation.safeParse({ ...baseProject, tags: [tag] }).success
      ).toBe(false)
    }
  })
})
