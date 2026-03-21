'use server'

import { auth } from '@/auth'
import db from '@/db'
import { bookingRequests } from '@/db/schema/booking-requests'
import { revalidatePath } from 'next/cache'
import { sql } from 'drizzle-orm'

export async function requestBookingAction(formData: FormData) {
  const roomName = formData.get('roomName') as string
  const building = formData.get('building') as string
  const campus = formData.get('campus') as string
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const eventName = formData.get('eventName') as string
  const eventType = formData.get('eventType') as string
  const attendees = Number(formData.get('attendees'))
  const contactPhone = formData.get('contactPhone') as string

  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized: User not authenticated' }
  }

  const startDate = new Date(startTime)
  const endDate = new Date(endTime)

  if (endDate <= startDate) {
    return { success: false, error: '종료 시간은 시작 시간 이후여야 합니다' }
  }

  if (startDate <= new Date()) {
    return { success: false, error: '과거 시간에는 예약할 수 없습니다' }
  }

  try {
    // Insert into auto-booker's booking_requests table directly
    // The auto-booker scheduler reads from this table to execute bookings
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

    // Also save to web_booking_requests for local tracking
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
    } catch (error: any) {
      console.error('web_booking_requests save failure:', error.message)
    }

    revalidatePath('/admin/booking')
    return { success: true, data: { id: inserted?.id, status: 'PENDING' } }
  } catch (error: any) {
    console.error('Booking request failed:', error.message)
    return { success: false, error: error.message || '예약 등록에 실패했습니다' }
  }
}
