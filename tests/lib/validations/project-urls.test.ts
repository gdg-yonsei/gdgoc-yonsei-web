import { describe, expect, it } from 'vitest'
import { projectValidation } from '@/lib/validations/project'

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
}

describe('projectValidation urls', () => {
  it('accepts null repo/demo urls', () => {
    expect(() =>
      projectValidation.parse({ ...baseProject, repoUrl: null, demoUrl: null })
    ).not.toThrow()
  })

  it('accepts valid https urls', () => {
    expect(() =>
      projectValidation.parse({
        ...baseProject,
        repoUrl: 'https://github.com/gdg-yonsei/web',
        demoUrl: 'https://gdgoc.yonsei.ac.kr',
      })
    ).not.toThrow()
  })

  it('rejects a malformed url', () => {
    expect(() =>
      projectValidation.parse({
        ...baseProject,
        repoUrl: 'not-a-url',
        demoUrl: null,
      })
    ).toThrow()
  })

  it.each([
    'javascript:alert(document.cookie)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
  ])('rejects the non-web url %s', (url) => {
    for (const field of ['repoUrl', 'demoUrl'] as const) {
      const result = projectValidation.safeParse({
        ...baseProject,
        repoUrl: null,
        demoUrl: null,
        [field]: url,
      })
      expect(result.success).toBe(false)
    }
  })

  it('rejects oversized text and lists', () => {
    expect(
      projectValidation.safeParse({
        ...baseProject,
        repoUrl: null,
        demoUrl: null,
        name: 'n'.repeat(201),
      }).success
    ).toBe(false)
    expect(
      projectValidation.safeParse({
        ...baseProject,
        repoUrl: null,
        demoUrl: null,
        participants: Array.from({ length: 1001 }, (_, index) => `u${index}`),
      }).success
    ).toBe(false)
  })
})
