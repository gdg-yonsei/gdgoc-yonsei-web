// 필드 추가 시 입력 컴포넌트·폼 파서·검증 스키마를 함께 바꿔야 한다. 실제 검증은 서비스가 맡는다.
import 'server-only'

import type { Role } from '@/db/schema/users'
import {
  readBoolean,
  readOptionalNumber,
  readString,
  readStringArray,
  readTrimmedOrNull,
  readWallClockDate,
} from '@/lib/server/form-data/fields'
import {
  ACTIVITY_CATEGORIES,
  type ActivityCategory,
  type SessionType,
} from '@/lib/validations/session'

export function parseAcceptMemberForm(formData: FormData) {
  return {
    userId: readString(formData, 'userId'),
    role: readString(formData, 'role'),
  }
}

export function parseDeleteMemberForm(formData: FormData) {
  return { userId: readString(formData, 'userId') }
}

export function parseAnnouncementForm(formData: FormData) {
  return {
    title: readString(formData, 'title'),
    body: readString(formData, 'body'),
    ctaLabel: readTrimmedOrNull(formData, 'ctaLabel'),
    ctaHref: readTrimmedOrNull(formData, 'ctaHref'),
  }
}

export function parseGenerationForm(formData: FormData) {
  return {
    name: readString(formData, 'name'),
    startDate: readString(formData, 'startDate'),
    endDate: readString(formData, 'endDate'),
  }
}

export function parseMemberForm(formData: FormData) {
  return {
    name: readString(formData, 'name'),
    firstName: readString(formData, 'firstName'),
    firstNameKo: readString(formData, 'firstNameKo'),
    lastName: readString(formData, 'lastName'),
    lastNameKo: readString(formData, 'lastNameKo'),
    email: readString(formData, 'email'),
    githubId: readString(formData, 'githubId'),
    instagramId: readString(formData, 'instagramId'),
    linkedInId: readString(formData, 'linkedInId'),
    major: readString(formData, 'major'),
    studentId: readString(formData, 'studentId'),
    telephone: readString(formData, 'telephone'),
    // 역할은 서비스가 enum으로 검증하고, 변경 권한이 없으면 무시한다.
    role: readString(formData, 'role') as Role,
    isForeigner: readBoolean(formData, 'isForeigner'),
    profileImage: readString(formData, 'profileImage'),
  }
}

// displayOrder 누락은 undefined로 기존값을 유지하고, 빈 입력은 NaN으로 검증 실패를 유도한다.
export function parsePartForm(formData: FormData) {
  return {
    name: readString(formData, 'name'),
    description: readString(formData, 'description'),
    generationId: Number(readString(formData, 'generationId')),
    displayOrder: readOptionalNumber(formData, 'displayOrder'),
    membersList: readStringArray(formData, 'membersList', 'form-data.part'),
    doubleBoardMembersList: readStringArray(
      formData,
      'doubleBoardMembersList',
      'form-data.part'
    ),
  }
}

export function parseProjectForm(formData: FormData) {
  return {
    name: readString(formData, 'name'),
    nameKo: readString(formData, 'nameKo'),
    description: readString(formData, 'description'),
    descriptionKo: readString(formData, 'descriptionKo'),
    content: readString(formData, 'content'),
    contentKo: readString(formData, 'contentKo'),
    mainImage: readString(formData, 'mainImage'),
    generationId: readString(formData, 'generationId'),
    contentImages: readStringArray(
      formData,
      'contentImages',
      'form-data.project'
    ),
    participants: readStringArray(
      formData,
      'participants',
      'form-data.project'
    ),
    repoUrl: readTrimmedOrNull(formData, 'repoUrl'),
    demoUrl: readTrimmedOrNull(formData, 'demoUrl'),
    tags: readStringArray(formData, 'tags', 'form-data.project'),
  }
}

// 조작된 요청의 알 수 없는 세션 종류는 파트 세션, 활동 분류는 tech_talk로 바꾼다.
export function parseSessionForm(formData: FormData) {
  const type: SessionType =
    formData.get('type') === 'General Session'
      ? 'General Session'
      : 'Part Session'
  const rawCategory = formData.get('category')
  const category: ActivityCategory = ACTIVITY_CATEGORIES.includes(
    rawCategory as ActivityCategory
  )
    ? (rawCategory as ActivityCategory)
    : 'tech_talk'

  return {
    name: readString(formData, 'name'),
    nameKo: readString(formData, 'nameKo'),
    description: readString(formData, 'description'),
    descriptionKo: readString(formData, 'descriptionKo'),
    mainImage: readString(formData, 'mainImage'),
    contentImages: readStringArray(
      formData,
      'contentImages',
      'form-data.session'
    ),
    startAt: readWallClockDate(formData, 'startAt'),
    endAt: readWallClockDate(formData, 'endAt'),
    location: readString(formData, 'location'),
    locationKo: readString(formData, 'locationKo'),
    internalOpen: readBoolean(formData, 'internalOpen'),
    publicOpen: readBoolean(formData, 'publicOpen'),
    maxCapacity: Number(formData.get('maxCapacity')),
    partId: readString(formData, 'partId'),
    participantId: readStringArray(
      formData,
      'participantId',
      'form-data.session'
    ),
    type,
    category,
    displayOnWebsite: readBoolean(formData, 'displayOnWebsite'),
  }
}
