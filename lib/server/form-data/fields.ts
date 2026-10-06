// 폼 배열은 JSON 문자열로 온다. 형태만 맞추고 실제 검증은 서비스의 zod 스키마가 한다.
import 'server-only'

import { logger } from '@/lib/server/logger'

export function readString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  return typeof value === 'string' ? value : null
}

export function readTrimmedOrNull(
  formData: FormData,
  key: string
): string | null {
  const value = readString(formData, key)?.trim()
  return value ? value : null
}

/** 선택 숫자 필드. 누락은 `undefined`(기존 값 유지), 빈 값·파일은 `NaN`(검증 실패)이다. */
export function readOptionalNumber(
  formData: FormData,
  key: string
): number | undefined {
  const value = formData.get(key)
  if (value === null) return undefined
  if (typeof value !== 'string' || value.trim() === '') return NaN
  return Number(value)
}

export function readBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === 'true'
}

// 문자열 배열이 없거나 JSON이 깨지면 빈 배열이다. 비문자열 항목은 버리고 파싱 실패를 logScope에 기록한다.
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

// 세션 datetime-local은 서울 벽시계에 UTC 라벨을 붙인다. 서버 로컬 시간으로 읽으면 KST에서 9시간 어긋난다.
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
