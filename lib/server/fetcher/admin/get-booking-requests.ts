/**
 * 관리자 예약 목록 조회(웹 미러 테이블 + 신청자 이름).
 *
 * 캐시하지 않는 관리자 조회다(권한·기수 범위에 따라 결과가 달라 공유 캐시를 쓰지 않는다).
 * 권한 확인은 호출부(레이아웃 가드, 서비스)가 먼저 한다.
 */
import 'server-only'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { bookingRequests } from '@/db/schema/booking-requests'
import { users } from '@/db/schema/users'

/** 관리자 예약 목록의 한 행. `externalId`는 auto-booker 원본 예약 ID다. */
export type BookingRequestListItem = {
  id: string
  externalId: string | null
  roomName: string
  building: string
  campus: string
  startTime: Date
  endTime: Date
  eventName: string
  eventType: string
  attendees: number
  contactPhone: string
  status: 'PENDING' | 'SCHEDULED' | 'SUCCESS' | 'FAILED'
  requestedByName: string | null
  createdAt: Date
}

/** 예약 목록을 최근 신청 순으로 읽는다. */
export async function getBookingRequests(): Promise<BookingRequestListItem[]> {
  const rows = await db
    .select({
      id: bookingRequests.id,
      externalId: bookingRequests.externalId,
      roomName: bookingRequests.roomName,
      building: bookingRequests.building,
      campus: bookingRequests.campus,
      startTime: bookingRequests.startTime,
      endTime: bookingRequests.endTime,
      eventName: bookingRequests.eventName,
      eventType: bookingRequests.eventType,
      attendees: bookingRequests.attendees,
      contactPhone: bookingRequests.contactPhone,
      status: bookingRequests.status,
      requestedByName: users.name,
      createdAt: bookingRequests.createdAt,
    })
    .from(bookingRequests)
    .leftJoin(users, eq(bookingRequests.requestedById, users.id))
    .orderBy(desc(bookingRequests.createdAt))

  return rows
}
