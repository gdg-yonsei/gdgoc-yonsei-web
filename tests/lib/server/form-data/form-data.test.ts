import { describe, expect, it, vi } from 'vitest'
import getAcceptMemberFormData from '@/lib/server/form-data/get-accept-member-form-data'
import getDeleteMemberFormData from '@/lib/server/form-data/get-delete-member-form-data'
import getGenerationFormData from '@/lib/server/form-data/get-generation-form-data'
import getMemberFormData from '@/lib/server/form-data/get-member-form-data'
import getPartFormData from '@/lib/server/form-data/get-part-form-data'
import getProjectFormData from '@/lib/server/form-data/get-project-form-data'
import getSessionFormData from '@/lib/server/form-data/get-session-form-data'

function createFormData(entries: Record<string, string>) {
  const formData = new FormData()

  for (const [key, value] of Object.entries(entries)) {
    formData.set(key, value)
  }

  return formData
}

describe('form-data parsers', () => {
  it('parses accept member form data', () => {
    const formData = createFormData({
      userId: 'user-1',
      role: 'CORE',
    })

    expect(getAcceptMemberFormData(formData)).toEqual({
      userId: 'user-1',
      role: 'CORE',
    })
  })

  it('parses delete member form data', () => {
    const formData = createFormData({
      userId: 'user-2',
    })

    expect(getDeleteMemberFormData(formData)).toEqual({
      userId: 'user-2',
    })
  })

  it('parses generation form data', () => {
    const formData = createFormData({
      name: '11th',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    })

    expect(getGenerationFormData(formData)).toEqual({
      name: '11th',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    })
  })

  it('parses member form data and converts isForeigner', () => {
    const formData = createFormData({
      name: '홍길동',
      firstName: 'Gildong',
      firstNameKo: '길동',
      lastName: 'Hong',
      lastNameKo: '홍',
      email: 'user@example.com',
      githubId: 'github',
      instagramId: 'insta',
      linkedInId: 'linkedin',
      major: 'CS',
      studentId: '20250001',
      telephone: '010-0000-0000',
      role: 'MEMBER',
      isForeigner: 'true',
      profileImage: '/profile.png',
    })

    expect(getMemberFormData(formData)).toEqual({
      name: '홍길동',
      firstName: 'Gildong',
      firstNameKo: '길동',
      lastName: 'Hong',
      lastNameKo: '홍',
      email: 'user@example.com',
      githubId: 'github',
      instagramId: 'insta',
      linkedInId: 'linkedin',
      major: 'CS',
      studentId: '20250001',
      telephone: '010-0000-0000',
      role: 'MEMBER',
      isForeigner: true,
      profileImage: '/profile.png',
    })
  })

  it('parses part form data', () => {
    const formData = createFormData({
      name: 'Web',
      description: 'Web Part',
      generationId: '10',
      membersList: JSON.stringify(['u1', 'u2']),
      doubleBoardMembersList: JSON.stringify(['u3']),
    })

    expect(getPartFormData(formData)).toEqual({
      name: 'Web',
      description: 'Web Part',
      generationId: 10,
      membersList: ['u1', 'u2'],
      doubleBoardMembersList: ['u3'],
    })
  })

  it('parses project form data', () => {
    const formData = createFormData({
      name: 'Project',
      nameKo: '프로젝트',
      description: 'desc',
      descriptionKo: '설명',
      content: 'content',
      contentKo: '콘텐츠',
      mainImage: '/main.png',
      generationId: '10',
      contentImages: JSON.stringify(['/1.png', '/2.png']),
      participants: JSON.stringify(['u1', 'u2']),
    })

    expect(getProjectFormData(formData)).toEqual({
      name: 'Project',
      nameKo: '프로젝트',
      description: 'desc',
      descriptionKo: '설명',
      content: 'content',
      contentKo: '콘텐츠',
      mainImage: '/main.png',
      generationId: '10',
      contentImages: ['/1.png', '/2.png'],
      participants: ['u1', 'u2'],
    })
  })

  it('returns empty arrays when project json fields are invalid', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const formData = createFormData({
      name: 'Project',
      nameKo: '프로젝트',
      description: 'desc',
      descriptionKo: '설명',
      content: 'content',
      contentKo: '콘텐츠',
      mainImage: '/main.png',
      generationId: '10',
      contentImages: 'invalid-json',
      participants: 'invalid-json',
    })

    const result = getProjectFormData(formData)

    expect(result.contentImages).toEqual([])
    expect(result.participants).toEqual([])
    expect(errorSpy).toHaveBeenCalledTimes(2)

    errorSpy.mockRestore()
  })

  it('parses session form data', () => {
    const formData = createFormData({
      name: 'Session',
      nameKo: '세션',
      description: 'desc',
      descriptionKo: '설명',
      mainImage: '/main.png',
      contentImages: JSON.stringify(['/1.png']),
      generationId: '10',
      startAt: '2025-01-01T10:00:00.000Z',
      endAt: '2025-01-01T12:00:00.000Z',
      location: 'A101',
      locationKo: '에이101',
      internalOpen: 'true',
      publicOpen: 'false',
      maxCapacity: '30',
      partId: '1',
      participantId: JSON.stringify(['u1']),
      type: 'General Session',
      displayOnWebsite: 'true',
    })

    const result = getSessionFormData(formData)

    expect(result).toMatchObject({
      name: 'Session',
      nameKo: '세션',
      description: 'desc',
      descriptionKo: '설명',
      mainImage: '/main.png',
      contentImages: ['/1.png'],
      generationId: '10',
      location: 'A101',
      locationKo: '에이101',
      internalOpen: true,
      publicOpen: false,
      maxCapacity: 30,
      partId: '1',
      participantId: ['u1'],
      type: 'General Session',
      displayOnWebsite: true,
    })
    expect(result.startAt.getTime()).toBe(
      new Date('2025-01-01T10:00:00.000Z').getTime()
    )
    expect(result.endAt.getTime()).toBe(
      new Date('2025-01-01T12:00:00.000Z').getTime()
    )
  })

  it('defaults session type to Part Session when type is unknown', () => {
    const formData = createFormData({
      name: 'Session',
      nameKo: '세션',
      description: 'desc',
      descriptionKo: '설명',
      mainImage: '/main.png',
      contentImages: JSON.stringify(['/1.png']),
      generationId: '10',
      startAt: '2025-01-01T10:00:00.000Z',
      endAt: '2025-01-01T12:00:00.000Z',
      location: 'A101',
      locationKo: '에이101',
      internalOpen: 'false',
      publicOpen: 'false',
      maxCapacity: '10',
      partId: '1',
      participantId: JSON.stringify(['u1']),
      type: 'unknown-type',
      displayOnWebsite: 'false',
    })

    expect(getSessionFormData(formData).type).toBe('Part Session')
  })

  it('throws when participantId is not a valid json array in session form', () => {
    const formData = createFormData({
      name: 'Session',
      nameKo: '세션',
      description: 'desc',
      descriptionKo: '설명',
      mainImage: '/main.png',
      contentImages: JSON.stringify(['/1.png']),
      generationId: '10',
      startAt: '2025-01-01T10:00:00.000Z',
      endAt: '2025-01-01T12:00:00.000Z',
      location: 'A101',
      locationKo: '에이101',
      internalOpen: 'false',
      publicOpen: 'false',
      maxCapacity: '10',
      partId: '1',
      participantId: 'invalid-json',
      type: 'Part Session',
      displayOnWebsite: 'false',
    })

    expect(() => getSessionFormData(formData)).toThrow()
  })
})
