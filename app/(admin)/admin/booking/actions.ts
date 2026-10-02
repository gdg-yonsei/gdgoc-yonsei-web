'use server'

/**
 * 강의실 대관 예약 Server Action(신청, 삭제). 한국어 전용 화면에서만 쓴다.
 *
 * 예약은 외부 auto-booker가 읽는 테이블에 기록하고, 화면 표시용 미러 테이블에도 같이 쓴다.
 * 시간 규칙·입력 스키마·DB 접근은 `lib/server/booking/*`에 있다.
 */
import { revalidatePath } from 'next/cache'
import { getAuthSession } from '@/auth'
import {
  checkBookingWindow,
  parseBookingDateTime,
} from '@/lib/server/booking/policy'
import {
  deleteBookingMirror,
  deleteExternalBooking,
  getMirrorExternalId,
  insertBookingMirror,
  insertExternalBooking,
} from '@/lib/server/booking/repository'
import {
  bookingIdSchema,
  requestBookingSchema,
} from '@/lib/server/booking/schema'
import type { BookingActionResult } from '@/lib/server/booking/types'
import { logger } from '@/lib/server/logger'
import { hasPermission } from '@/lib/server/permission/has-permission'
import { fieldErrorsFromZod } from '@/lib/server/services/admin/types'

/**
 * 강의실 예약 신청.
 * 입력 검증 → 로그인·권한 확인 → 시간 규칙 확인 → auto-booker 테이블 기록 →
 * 웹 미러 기록(실패해도 성공 처리) 순서로 동작한다.
 */
export async function requestBookingAction(
  formData: FormData
): Promise<BookingActionResult<{ id: number; status: string }>> {
  const parsed = requestBookingSchema.safeParse(
    Object.fromEntries(formData.entries())
  )
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: fieldErrorsFromZod(parsed.error),
    }
  }

  const session = await getAuthSession()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized: User not authenticated' }
  }
  if (!(await hasPermission(session.user.id, 'post', 'booking'))) {
    return { success: false, error: 'Forbidden' }
  }

  const input = parsed.data
  const start = parseBookingDateTime(input.startTime)
  const end = parseBookingDateTime(input.endTime)
  if (!start || !end) {
    return { success: false, error: 'Invalid booking time' }
  }

  const windowError = checkBookingWindow(start, end)
  if (windowError) {
    return { success: false, error: windowError }
  }

  try {
    const inserted = await insertExternalBooking({
      userId: session.user.id,
      userEmail: session.user.email ?? 'unknown@gdgoc.yonsei.ac.kr',
      roomName: input.roomName,
      building: input.building,
      campus: input.campus,
      start,
      end,
      eventName: input.eventName,
      eventType: input.eventType,
      attendees: input.attendees,
      contactPhone: input.contactPhone,
    })

    // 미러는 화면 표시용이므로 실패해도 예약은 성공이다(repository.ts 참고).
    try {
      await insertBookingMirror({
        externalId: inserted?.id?.toString() ?? null,
        roomName: input.roomName,
        building: input.building,
        campus: input.campus,
        startTime: start,
        endTime: end,
        eventName: input.eventName,
        eventType: input.eventType,
        attendees: input.attendees,
        contactPhone: input.contactPhone,
        status: 'PENDING',
        requestedById: session.user.id,
      })
    } catch (error: unknown) {
      logger.error('booking.request.save', error)
    }

    revalidatePath('/admin/booking')
    return {
      success: true,
      data: { id: inserted?.id ?? 0, status: 'PENDING' },
    }
  } catch (error: unknown) {
    // DB 오류 원문에는 테이블·제약 이름이 들어 있으므로 화면에는 일반 문구만 보인다.
    logger.error('booking.request', error)
    return { success: false, error: '예약 등록에 실패했습니다' }
  }
}

/**
 * 예약 삭제. auto-booker 원본 행(있으면)과 미러 행을 함께 지운다.
 *
 * @param bookingId 미러 테이블의 예약 id
 */
export async function deleteBookingAction(
  bookingId: string
): Promise<BookingActionResult> {
  const parsed = bookingIdSchema.safeParse(bookingId)
  if (!parsed.success) {
    return { success: false, error: 'Invalid booking ID' }
  }

  const session = await getAuthSession()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }
  if (!(await hasPermission(session.user.id, 'delete', 'booking'))) {
    return { success: false, error: 'Forbidden' }
  }

  try {
    const externalId = await getMirrorExternalId(parsed.data)
    if (externalId) {
      // SQL에 숫자로 넣으므로 숫자 형식이 아니면 원본도 미러도 건드리지 않는다.
      if (!/^\d+$/.test(externalId)) {
        return { success: false, error: 'Invalid external booking ID' }
      }
      await deleteExternalBooking(Number(externalId))
    }

    await deleteBookingMirror(parsed.data)

    revalidatePath('/admin/booking')
    return { success: true, data: undefined }
  } catch (error: unknown) {
    logger.error('booking.delete', error)
    return { success: false, error: '삭제에 실패했습니다' }
  }
}
