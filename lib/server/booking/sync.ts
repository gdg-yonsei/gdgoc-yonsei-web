/**
 * 예약 목록을 auto-booker 원본 상태와 맞춘다.
 *
 * auto-booker는 학교 시스템에 예약을 넣으며 원본 테이블의 상태(예약 예정·완료·실패)를
 * 바꾼다. 관리자 화면은 원본 상태를 바로 보여 주고, 웹 미러 테이블 갱신은 응답을 보낸
 * 뒤로 미룬다. 페이지 렌더링(GET, 프리페치 포함) 중에 DB를 쓰지 않기 위해서다.
 */
import 'server-only'

import { runAfterResponse } from '@/lib/server/after-response'
import {
  getExternalStatuses,
  updateMirrorStatus,
} from '@/lib/server/booking/repository'
import {
  BOOKING_STATUSES,
  type BookingStatus,
} from '@/lib/server/booking/schema'
import {
  getBookingRequests,
  type BookingRequestListItem,
} from '@/lib/server/fetcher/admin/get-booking-requests'
import { logger } from '@/lib/server/logger'

function isBookingStatus(value: string | undefined): value is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(value ?? '')
}

/** 원본 상태를 읽지 못하면 미러에 저장된 상태를 그대로 쓴다. */
async function readExternalStatuses(
  bookings: readonly BookingRequestListItem[]
): Promise<Map<string, string>> {
  const externalIds = bookings
    .map((booking) => booking.externalId)
    .filter((id): id is string => id !== null && /^\d+$/.test(id))
  if (externalIds.length === 0) return new Map()

  try {
    return await getExternalStatuses(externalIds.map(Number))
  } catch (error) {
    logger.error('booking.sync.read', error)
    return new Map()
  }
}

/**
 * 관리자 예약 목록을 원본 상태를 반영해 돌려준다.
 * 미러와 상태가 다른 행은 응답 뒤에 미러 테이블에도 저장한다.
 */
export async function getBookingsWithLiveStatus(): Promise<
  BookingRequestListItem[]
> {
  const bookings = await getBookingRequests()
  const statuses = await readExternalStatuses(bookings)

  const changed: { id: string; status: BookingStatus }[] = []
  const merged = bookings.map((booking) => {
    const live = booking.externalId
      ? statuses.get(booking.externalId)
      : undefined
    if (!isBookingStatus(live) || live === booking.status) return booking
    changed.push({ id: booking.id, status: live })
    return { ...booking, status: live }
  })

  if (changed.length > 0) {
    runAfterResponse('booking.sync.write', async () => {
      for (const { id, status } of changed) {
        await updateMirrorStatus(id, status)
      }
    })
  }

  return merged
}
