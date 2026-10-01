/**
 * `FormData` 필드 리더.
 *
 * 관리자 폼은 Server Action으로 `FormData`를 보낸다. 값은 모두 문자열이고 배열은
 * JSON 문자열로 실려 오므로, 서비스에 넘기기 전에 이 함수들로 기본 형태만 맞춘다.
 * 실제 유효성 검사는 각 서비스의 zod 스키마(`lib/validations/*`)가 맡는다.
 */
import 'server-only'

import { logger } from '@/lib/server/logger'

/** 문자열 필드 값을 읽는다. 없거나 파일이면 `null`. */
export function readString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  return typeof value === 'string' ? value : null
}

/** 앞뒤 공백을 지운 문자열을 읽는다. 비어 있으면 `null`(선택 입력 URL 등). */
export function readTrimmedOrNull(
  formData: FormData,
  key: string
): string | null {
  const value = readString(formData, key)?.trim()
  return value ? value : null
}

/** 체크박스·토글 필드. 폼은 켜짐을 문자열 `'true'`로 보낸다. */
export function readBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === 'true'
}

/**
 * JSON 배열로 직렬화된 문자열 목록을 읽는다(멤버 ID 목록, 이미지 URL 목록 등).
 * 필드가 없으면 빈 배열, JSON이 깨졌으면 로그를 남기고 빈 배열을 돌려준다.
 * 문자열이 아닌 항목은 버린다.
 *
 * @param logScope - JSON 파싱 실패 시 남길 로그 범위(예: `form-data.project`)
 */
export function readStringArray(
  formData: FormData,
  key: string,
  logScope: string
): string[] {
  const raw = readString(formData, key)
  if (!raw) {
    return []
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch (error) {
    logger.error(logScope, error, { field: key })
    return []
  }
}

/**
 * `datetime-local` 값을 Date로 읽는다.
 *
 * 세션 시간은 "서울 벽시계 시각을 UTC 라벨로 저장"하는 규칙을 따른다
 * (`lib/format/datetime.ts` 참고). 타임존 없는 입력을 `new Date(str)`로 읽으면 서버
 * 로컬 타임존으로 해석돼 개발 환경(KST)에서 9시간 어긋나므로 명시적으로 UTC로 읽는다.
 */
export function readWallClockDate(
  formData: FormData,
  key: string
): Date | null {
  const value = readString(formData, key)
  if (!value) {
    return null
  }

  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)
    ? new Date(`${value}Z`)
    : new Date(value)
}
