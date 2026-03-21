'use server'

import { cookies } from 'next/headers'
import { auth } from '@/auth'
import db from '@/db'
import { bookingRequests } from '@/db/schema/booking-requests'
import { revalidatePath } from 'next/cache'
import { bookingFetch } from './booking-fetch'

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

  // Fetch session token
  const cookieStore = await cookies()
  let sessionToken = cookieStore.get('__Secure-authjs.session-token')?.value
  if (!sessionToken) {
    sessionToken = cookieStore.get('authjs.session-token')?.value
  }
  if (!sessionToken) {
    sessionToken = cookieStore.get('__Secure-next-auth.session-token')?.value
  }
  if (!sessionToken) {
    sessionToken = cookieStore.get('next-auth.session-token')?.value
  }

  if (!sessionToken) {
    return { success: false, error: 'Unauthorized: Session session-token not found' }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized: User not authenticated' }
  }

  const payload = {
    room_name: roomName,
    building: building,
    campus: campus,
    start_time: startTime + ':00',
    end_time: endTime + ':00',
    event_name: eventName,
    event_type: eventType,
    attendees: attendees,
    contact_phone: contactPhone,
  }

  try {
    const response = await bookingFetch('/api/booking-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return { success: false, error: errorData?.detail || `API Request failed with status ${response.status}` }
    }

    const data = await response.json()

    // Save to local DB
    try {
      await db.insert(bookingRequests).values({
        externalId: data.id?.toString() ?? null,
        roomName,
        building,
        campus,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        eventName,
        eventType,
        attendees,
        contactPhone,
        status: data.status ?? 'PENDING',
        requestedById: session.user.id,
      })
    } catch (error: any) {
      console.error('DB save failure:', error.message)
      // DB save failure should not block the user — the API request already succeeded
    }

    revalidatePath('/admin/booking')
    return { success: true, data }
  } catch (error: any) {
    console.error(error.message)
    return { success: false, error: error.message || 'Network error occurred' }
  }
}
