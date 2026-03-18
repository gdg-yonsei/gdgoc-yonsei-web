'use server'

import { cookies } from 'next/headers'

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
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8000'
      : 'https://auto-booker.moveto.kr'

    const response = await fetch(`${baseUrl}/api/booking-request`, {
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
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error occurred' }
  }
}
