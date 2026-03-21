'use server'

import { auth } from '@/auth'
import db from '@/db'
import { bookingRequests } from '@/db/schema/booking-requests'
import type { ActionResult } from '@/lib/server/actions/types'
import { revalidatePath } from 'next/cache'
import { sql } from 'drizzle-orm'
import { z } from 'zod'

const requestBookingSchema = z.object({
  roomName: z.string().trim().min(1, 'Room name is required'),
  building: z.string().trim().min(1, 'Building is required'),
  campus: z.string().trim().min(1, 'Campus is required'),
  startTime: z.string().datetime({ message: 'Invalid start time' }),
  endTime: z.string().datetime({ message: 'Invalid end time' }),
  eventName: z.string().trim().min(1, 'Event name is required'),
  eventType: z.string().trim().min(1, 'Event type is required'),
  attendees: z.coerce.number().int().positive('Attendees must be positive'),
  contactPhone: z.string().trim().min(1, 'Contact phone is required'),
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

  const startDate = new Date(startTime)
  const endDate = new Date(endTime)

  if (endDate <= startDate) {
    return { success: false, error: '종료 시간은 시작 시간 이후여야 합니다' }
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
      const message =
        error instanceof Error ? error.message : 'Unknown error'
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
