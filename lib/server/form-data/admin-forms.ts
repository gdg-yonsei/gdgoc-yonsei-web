/**
 * 관리자 폼(`FormData`)을 서비스 입력 객체로 바꾸는 파서 모음.
 *
 * 각 함수는 폼 필드를 이름 그대로 읽어 서비스가 기대하는 모양으로 맞추기만 한다.
 * 필수값·형식 검사는 서비스가 zod 스키마로 다시 하므로 여기서는 하지 않는다.
 * 폼 필드를 추가하면 해당 페이지의 입력 컴포넌트, 이 파서, `lib/validations`의
 * 스키마를 함께 고친다.
 */
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

/** 가입 승인 폼: 승인할 사용자와 부여할 역할. */
export function parseAcceptMemberForm(formData: FormData) {
  return {
    userId: readString(formData, 'userId'),
    role: readString(formData, 'role'),
  }
}

/** 가입 거절(삭제) 폼: 삭제할 사용자 ID. */
export function parseDeleteMemberForm(formData: FormData) {
  return { userId: readString(formData, 'userId') }
}

/** 기수 생성·수정 폼. 날짜는 `YYYY-MM-DD` 문자열 그대로 넘긴다. */
export function parseGenerationForm(formData: FormData) {
  return {
    name: readString(formData, 'name'),
    startDate: readString(formData, 'startDate'),
    endDate: readString(formData, 'endDate'),
  }
}

/** 멤버 정보 수정 폼(관리자 수정과 본인 프로필 수정이 같은 필드를 쓴다). */
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

/**
 * 파트 생성·수정 폼.
 *
 * `displayOrder`는 필드가 아예 없으면 `undefined`(기존 값 유지), 비어 있으면
 * `NaN`(검증 오류로 이어짐)으로 구분해 넘긴다.
 */
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

/** 프로젝트 생성·수정 폼. 이미지·참가자·태그 목록은 JSON 배열 필드다. */
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

/**
 * 세션 생성·수정 폼.
 *
 * 알 수 없는 세션 종류는 파트 세션으로, 알 수 없는 활동 분류는 `tech_talk`로
 * 바꿔 넘긴다(폼은 정해진 선택지만 보내므로 조작된 요청에 대한 방어다).
 */
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
