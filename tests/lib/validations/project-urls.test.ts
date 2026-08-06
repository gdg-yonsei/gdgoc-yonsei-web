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
})
