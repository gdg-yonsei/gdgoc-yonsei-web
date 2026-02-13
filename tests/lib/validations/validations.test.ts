import { describe, expect, it } from 'vitest'
import { acceptMemberValidation } from '@/lib/validations/accept-member'
import { deleteMemberValidation } from '@/lib/validations/delete-member'
import { generationValidation } from '@/lib/validations/generation'
import { memberValidation } from '@/lib/validations/member'
import { partValidation } from '@/lib/validations/part'
import { projectValidation } from '@/lib/validations/project'
import { sessionValidation } from '@/lib/validations/session'

describe('validation schemas', () => {
  it('validates accept member payload', () => {
    expect(
      acceptMemberValidation.safeParse({ userId: 'u1', role: 'member' }).success
    ).toBe(true)
    expect(
      acceptMemberValidation.safeParse({ userId: 'u1', role: 'MEMBER' }).success
    ).toBe(false)
    expect(
      acceptMemberValidation.safeParse({ userId: '', role: '' }).success
    ).toBe(false)
  })

  it('validates delete member payload', () => {
    expect(deleteMemberValidation.safeParse({ userId: 'u1' }).success).toBe(
      true
    )
    expect(deleteMemberValidation.safeParse({ userId: '' }).success).toBe(false)
  })

  it('validates generation payload and date order', () => {
    expect(
      generationValidation.safeParse({
        name: '11th',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      }).success
    ).toBe(true)

    expect(
      generationValidation.safeParse({
        name: '11th',
        startDate: '2025/01/01',
        endDate: '2025-12-31',
      }).success
    ).toBe(false)

    expect(
      generationValidation.safeParse({
        name: '11th/admin',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      }).success
    ).toBe(false)

    expect(
      generationValidation.safeParse({
        name: '11th',
        startDate: '2025-01-01',
        endDate: null,
      }).success
    ).toBe(true)

    expect(
      generationValidation.safeParse({
        name: '11th',
        startDate: '2025-01-01',
        endDate: '',
      }).success
    ).toBe(true)

    const reversed = generationValidation.safeParse({
      name: '11th',
      startDate: '2025-12-31',
      endDate: '2025-01-01',
    })

    expect(reversed.success).toBe(false)
    if (!reversed.success) {
      expect(reversed.error.flatten().fieldErrors.endDate?.[0]).toBe(
        'The end date must be later than the start date.'
      )
    }
  })

  it('validates member payload', () => {
    const validMember = {
      name: '홍길동',
      firstName: 'Gildong',
      firstNameKo: '길동',
      lastName: 'Hong',
      lastNameKo: '홍',
      email: 'user@example.com',
      githubId: null,
      instagramId: null,
      linkedInId: null,
      major: 'CS',
      studentId: '20250001',
      telephone: '010-0000-0000',
      role: 'MEMBER' as const,
      isForeigner: false,
      profileImage: null,
    }

    expect(memberValidation.safeParse(validMember).success).toBe(true)
    expect(
      memberValidation.safeParse({
        ...validMember,
        email: 'invalid-email',
      }).success
    ).toBe(false)
  })

  it('validates part payload and rejects duplicates between member lists', () => {
    expect(
      partValidation.safeParse({
        name: 'Web',
        description: 'desc',
        generationId: 1,
        membersList: ['u1', 'u2'],
        doubleBoardMembersList: ['u3'],
      }).success
    ).toBe(true)

    const duplicate = partValidation.safeParse({
      name: 'Web',
      description: 'desc',
      generationId: 1,
      membersList: ['u1', 'u2'],
      doubleBoardMembersList: ['u2'],
    })

    expect(duplicate.success).toBe(false)

    const duplicateInMembers = partValidation.safeParse({
      name: 'Web',
      description: 'desc',
      generationId: 1,
      membersList: ['u1', 'u1'],
      doubleBoardMembersList: [],
    })

    expect(duplicateInMembers.success).toBe(false)
  })

  it('validates project payload', () => {
    expect(
      projectValidation.safeParse({
        name: 'Project',
        nameKo: '프로젝트',
        description: 'desc',
        descriptionKo: '설명',
        content: 'content',
        contentKo: '콘텐츠',
        mainImage: '/main.png',
        contentImages: ['/1.png'],
        participants: ['u1'],
        generationId: '10',
      }).success
    ).toBe(true)

    expect(
      projectValidation.safeParse({
        name: 'Project',
        nameKo: '프로젝트',
        description: 'desc',
        descriptionKo: '설명',
        content: 'content',
        contentKo: '콘텐츠',
        mainImage: '/main.png',
        contentImages: [],
        participants: [],
        generationId: '',
      }).success
    ).toBe(false)
  })

  it('validates session payload and start/end order', () => {
    const validSession = {
      name: 'Session',
      nameKo: '세션',
      description: 'desc',
      descriptionKo: '설명',
      mainImage: '/main.png',
      contentImages: ['/1.png'],
      location: 'A101',
      locationKo: '에이101',
      maxCapacity: 10,
      internalOpen: true,
      publicOpen: false,
      startAt: new Date('2025-01-01T10:00:00.000Z'),
      endAt: new Date('2025-01-01T12:00:00.000Z'),
      partId: '1',
      participantId: ['u1'],
      type: 'Part Session' as const,
      displayOnWebsite: true,
    }

    expect(sessionValidation.safeParse(validSession).success).toBe(true)

    expect(
      sessionValidation.safeParse({
        ...validSession,
        endAt: new Date('2025-01-01T09:00:00.000Z'),
      }).success
    ).toBe(false)

    expect(
      sessionValidation.safeParse({
        ...validSession,
        participantId: [],
      }).success
    ).toBe(false)

    expect(
      sessionValidation.safeParse({
        ...validSession,
        participantId: ['u1', 'u1'],
      }).success
    ).toBe(false)
  })
})
