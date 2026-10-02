/**
 * 웹 미러 예약 상태를 auto-booker 원본 상태와 맞춘다.
 */
import 'server-only'

import {
  getExternalStatuses,
  listLinkedMirrors,
  updateMirrorStatus,
} from '@/lib/server/booking/repository'
import {
  BOOKING_STATUSES,
  type BookingStatus,
} from '@/lib/server/booking/schema'
import { logger } from '@/lib/server/logger'

function isBookingStatus(value: string): value is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(value)
}

/**
 * auto-booker가 갱신한 상태(예약 예정·완료·실패)를 웹 미러 테이블에 반영한다.
 * 동기화에 실패해도 예약 화면은 마지막으로 저장된 상태로 그려야 하므로 예외를
 * 던지지 않고 로그만 남긴다.
 */
export async function syncBookingStatus(): Promise<void> {
  try {
    const mirrors = await listLinkedMirrors()
    const externalIds = mirrors
      .map((mirror) => mirror.externalId)
      .filter((id): id is string => id !== null)
    if (externalIds.length === 0) return

    const statuses = await getExternalStatuses(externalIds.map(Number))

    for (const mirror of mirrors) {
      if (!mirror.externalId) continue
      const status = statuses.get(mirror.externalId)
      if (status && status !== mirror.status && isBookingStatus(status)) {
        await updateMirrorStatus(mirror.id, status)
      }
    }
  } catch (error) {
    logger.error('booking.sync', error)
  }
}
