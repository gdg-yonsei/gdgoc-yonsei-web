'use server'

import { auth } from '@/auth'
import db from '@/db'
import { bookingRequests } from '@/db/schema/booking-requests'
import handlePermission from '@/lib/server/permission/handle-permission'
import type { ActionResult } from '@/lib/server/actions/types'
import { revalidatePath } from 'next/cache'
import { sql } from 'drizzle-orm'
import { z } from 'zod'

const MIN_BOOKING_LEAD_DAYS = 15
const MIN_BOOKING_DURATION_MINUTES = 30
const MAX_BOOKING_DURATION_MINUTES = 360

function parseBookingDateTime(value: string): Date | null {
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

  if (Number.isNaN(parsedDate.getTime())) {
    return null
  }

  return parsedDate
}

function getMinimumBookingStartDate(): Date {
  const now = new Date()
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

function isTenMinuteBoundary(date: Date): boolean {
  return (
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0 &&
    date.getUTCMinutes() % 10 === 0
  )
}

const bookingDateTimeSchema = z
  .string()
  .trim()
  .refine((value) => parseBookingDateTime(value) !== null, {
    message: 'Invalid datetime',
  })

const requestBookingSchema = z.object({
  roomName: z.string().trim().min(1, 'Room name is required').max(120),
  building: z.string().trim().min(1, 'Building is required').max(120),
  campus: z.string().trim().min(1, 'Campus is required').max(120),
  startTime: bookingDateTimeSchema,
  endTime: bookingDateTimeSchema,
  eventName: z.string().trim().min(1, 'Event name is required').max(200),
  eventType: z.string().trim().min(1, 'Event type is required').max(120),
  attendees: z.coerce.number().int().positive('Attendees must be positive'),
  contactPhone: z
    .string()
    .trim()
    .min(1, 'Contact phone is required')
    .max(30, 'Contact phone is too long')
    .regex(
      /^[\d +()-]+$/,
      'Contact phone must contain only numbers and common phone symbols'
    ),
})

export type RequestBookingInput = z.infer<typeof requestBookingSchema>
export type RequestBookingResult = ActionResult<{
  id: number
  status: string
}>

export async function requestBookingAction(
  formData: FormData
): Promise<RequestBookingResult> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = requestBookingSchema.safeParse(raw)

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (!fieldErrors[key]) fieldErrors[key] = []
      fieldErrors[key].push(issue.message)
    }
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors,
    }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized: User not authenticated' }
  }

  if (!(await handlePermission(session.user.id, 'post', 'booking'))) {
    return { success: false, error: 'Forbidden' }
  }

  const {
    roomName,
    building,
    campus,
    startTime,
    endTime,
    eventName,
    eventType,
    attendees,
    contactPhone,
  } = parsed.data

  const startDate = parseBookingDateTime(startTime)
  const endDate = parseBookingDateTime(endTime)

  if (!startDate || !endDate) {
    return { success: false, error: 'Invalid booking time' }
  }

  if (endDate <= startDate) {
    return { success: false, error: '종료 시간은 시작 시간 이후여야 합니다' }
  }

  if (startDate < getMinimumBookingStartDate()) {
    return {
      success: false,
      error: '예약은 최소 2주 이후 일정만 신청할 수 있습니다',
    }
  }

  if (!isTenMinuteBoundary(startDate) || !isTenMinuteBoundary(endDate)) {
    return {
      success: false,
      error: '예약 시간은 10분 단위로 입력해야 합니다',
    }
  }

  const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60000

  if (durationMinutes < MIN_BOOKING_DURATION_MINUTES) {
    return {
      success: false,
      error: '예약 시간은 최소 30분 이상이어야 합니다',
    }
  }

  if (durationMinutes > MAX_BOOKING_DURATION_MINUTES) {
    return {
      success: false,
      error: '예약 시간은 최대 6시간까지 신청할 수 있습니다',
    }
  }

  if (startDate <= new Date()) {
    return { success: false, error: '과거 시간에는 예약할 수 없습니다' }
  }

  try {
    const result = await db.execute(sql`
      INSERT INTO booking_requests (
        user_id, user_email, room_name, building, campus,
        start_time, end_time, event_name, event_type,
        attendees, contact_phone, status, created_at
      ) VALUES (
        ${session.user.id},
        ${session.user.email ?? 'unknown@gdgoc.yonsei.ac.kr'},
        ${roomName},
        ${building},
        ${campus},
        ${startDate.toISOString()},
        ${endDate.toISOString()},
        ${eventName},
        ${eventType},
        ${attendees},
        ${contactPhone},
        'PENDING',
        NOW()
      )
      RETURNING id, status
    `)

    const rows = result as unknown as { id: number; status: string }[]
    const inserted = rows?.[0]

    try {
      await db.insert(bookingRequests).values({
        externalId: inserted?.id?.toString() ?? null,
        roomName,
        building,
        campus,
        startTime: startDate,
        endTime: endDate,
        eventName,
        eventType,
        attendees,
        contactPhone,
        status: 'PENDING',
        requestedById: session.user.id,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('web_booking_requests save failure:', message)
    }

    revalidatePath('/admin/booking')
    return {
      success: true,
      data: { id: inserted?.id ?? 0, status: 'PENDING' },
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Booking request failed:', message)
    return { success: false, error: message || '예약 등록에 실패했습니다' }
  }
}
