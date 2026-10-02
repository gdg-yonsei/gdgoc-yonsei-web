/**
 * 강의실 예약 저장소.
 *
 * 예약은 두 테이블에 기록된다.
 * 1. `booking_requests`: auto-booker 서비스가 소유한 테이블. 같은 DB를 공유하므로
 *    Drizzle 스키마 없이 SQL로 접근하고, 결과 행은 zod로 검증한다. auto-booker가 이
 *    행을 읽어 학교 시스템에 예약을 넣고 상태를 갱신한다.
 * 2. `web_booking_requests`(Drizzle `bookingRequests`): 관리자 화면 표시용 미러.
 *    누가 신청했는지 등 웹 쪽 정보를 함께 둔다.
 *
 * 일관성 모델: 원본(1)이 기준이고 미러(2)는 최선 노력(best-effort)이다. 미러 저장이
 * 실패해도 예약 자체는 성공으로 보며, 상태는 `syncBookingStatus`가 원본에서 다시 읽어 맞춘다.
 */
import 'server-only'

import { eq, isNotNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { bookingRequests } from '@/db/schema/booking-requests'
import type { BookingStatus } from '@/lib/server/booking/schema'

/** auto-booker 테이블에서 읽는 행. 드라이버 결과를 캐스트하지 않고 이 스키마로 검증한다. */
const externalRowSchema = z.object({
  id: z.coerce.number().int(),
  status: z.string(),
})

function parseExternalRows(result: Iterable<unknown>) {
  return z.array(externalRowSchema).parse([...result])
}

/** auto-booker 테이블에 새 예약 요청(PENDING)을 넣고 생성된 행을 돌려준다. */
export async function insertExternalBooking(values: {
  userId: string
  userEmail: string
  roomName: string
  building: string
  campus: string
  start: Date
  end: Date
  eventName: string
  eventType: string
  attendees: number
  contactPhone: string
}): Promise<{ id: number; status: string } | undefined> {
  const result = await db.execute(sql`
    INSERT INTO booking_requests (
      user_id, user_email, room_name, building, campus,
      start_time, end_time, event_name, event_type,
      attendees, contact_phone, status, created_at
    ) VALUES (
      ${values.userId},
      ${values.userEmail},
      ${values.roomName},
      ${values.building},
      ${values.campus},
      ${values.start.toISOString()},
      ${values.end.toISOString()},
      ${values.eventName},
      ${values.eventType},
      ${values.attendees},
      ${values.contactPhone},
      'PENDING',
      NOW()
    )
    RETURNING id, status
  `)

  return parseExternalRows(result)[0]
}

/** auto-booker 테이블의 예약 요청을 지운다. */
export async function deleteExternalBooking(externalId: number): Promise<void> {
  await db.execute(sql`DELETE FROM booking_requests WHERE id = ${externalId}`)
}

/** auto-booker 테이블에서 여러 예약의 현재 상태를 읽는다(키: 문자열 ID). */
export async function getExternalStatuses(
  externalIds: readonly number[]
): Promise<Map<string, string>> {
  const result = await db.execute(
    sql`SELECT id, status FROM booking_requests WHERE id = ANY(${[...externalIds]}::int[])`
  )
  return new Map(
    parseExternalRows(result).map((row) => [String(row.id), row.status])
  )
}

/** 웹 미러 테이블에 예약을 기록한다. */
export async function insertBookingMirror(
  values: typeof bookingRequests.$inferInsert
): Promise<void> {
  await db.insert(bookingRequests).values(values)
}

/** 웹 미러 행에 연결된 auto-booker 예약 ID(문자열). 없으면 `null`/`undefined`. */
export async function getMirrorExternalId(
  bookingId: string
): Promise<string | null | undefined> {
  const record = await db
    .select({ externalId: bookingRequests.externalId })
    .from(bookingRequests)
    .where(eq(bookingRequests.id, bookingId))
    .limit(1)
  return record[0]?.externalId
}

/** 웹 미러 행을 지운다. */
export async function deleteBookingMirror(bookingId: string): Promise<void> {
  await db.delete(bookingRequests).where(eq(bookingRequests.id, bookingId))
}

/** auto-booker 예약과 연결된 웹 미러 행 목록. */
export function listLinkedMirrors() {
  return db
    .select({
      id: bookingRequests.id,
      externalId: bookingRequests.externalId,
      status: bookingRequests.status,
    })
    .from(bookingRequests)
    .where(isNotNull(bookingRequests.externalId))
}

/** 웹 미러 행의 상태를 바꾼다. */
export async function updateMirrorStatus(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  await db
    .update(bookingRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(bookingRequests.id, bookingId))
}
