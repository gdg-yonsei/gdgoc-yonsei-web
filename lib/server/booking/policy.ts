/**
 * 강의실 예약 시간 규칙(순수 함수).
 *
 * 학교 예약 시스템의 제약을 미리 걸러 auto-booker에 넘기기 전에 사용자에게 바로
 * 알려 준다. DB·인증과 무관하므로 단위 테스트로 규칙을 고정한다.
 */

/** 오늘(서울 기준 자정)부터 며칠 뒤부터 예약할 수 있는지. 학교 규정상 약 2주. */
export const MIN_BOOKING_LEAD_DAYS = 15

/** 예약 가능한 최소 사용 시간(분). */
export const MIN_BOOKING_DURATION_MINUTES = 30
/** 예약 가능한 최대 사용 시간(분). */
export const MAX_BOOKING_DURATION_MINUTES = 360

/**
 * 예약 시각 문자열을 Date로 읽는다.
 * 타임존 없는 `datetime-local` 값(`2026-10-01T10:00`)은 서울 시간(+09:00)으로 본다.
 * 읽을 수 없으면 `null`.
 */
export function parseBookingDateTime(value: string): Date | null {
  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return null
  }

  const valueWithTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(
    trimmedValue
  )
    ? `${trimmedValue.length === 16 ? `${trimmedValue}:00` : trimmedValue}+09:00`
    : trimmedValue

  const parsedDate = new Date(valueWithTimezone)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

/** 예약 가능한 가장 이른 시작 시각: 서울 기준 오늘 자정 + `MIN_BOOKING_LEAD_DAYS`일. */
export function getMinimumBookingStartDate(now: Date = new Date()): Date {
  const kstDateString = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

  const kstMidnightToday = new Date(`${kstDateString}T00:00:00+09:00`)
  kstMidnightToday.setDate(kstMidnightToday.getDate() + MIN_BOOKING_LEAD_DAYS)
  return kstMidnightToday
}

/** 초·밀리초가 0이고 분이 10분 단위인지. */
export function isTenMinuteBoundary(date: Date): boolean {
  return (
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0 &&
    date.getUTCMinutes() % 10 === 0
  )
}

/**
 * 예약 시간대가 규칙에 맞는지 확인한다.
 * 맞으면 `null`, 어긋나면 사용자에게 보일 오류 문구(한국어)를 돌려준다.
 * 검사 순서가 곧 사용자에게 보이는 오류 우선순위다.
 */
export function checkBookingWindow(
  start: Date,
  end: Date,
  now: Date = new Date()
): string | null {
  if (end <= start) {
    return '종료 시간은 시작 시간 이후여야 합니다'
  }
  if (start < getMinimumBookingStartDate(now)) {
    return '예약은 최소 2주 이후 일정만 신청할 수 있습니다'
  }
  if (!isTenMinuteBoundary(start) || !isTenMinuteBoundary(end)) {
    return '예약 시간은 10분 단위로 입력해야 합니다'
  }

  const durationMinutes = (end.getTime() - start.getTime()) / 60000
  if (durationMinutes < MIN_BOOKING_DURATION_MINUTES) {
    return '예약 시간은 최소 30분 이상이어야 합니다'
  }
  if (durationMinutes > MAX_BOOKING_DURATION_MINUTES) {
    return '예약 시간은 최대 6시간까지 신청할 수 있습니다'
  }
  if (start <= now) {
    return '과거 시간에는 예약할 수 없습니다'
  }
  return null
}
