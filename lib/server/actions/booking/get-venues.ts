'use server'

import { cookies } from 'next/headers'
import { bookingFetch } from './booking-fetch'

export type VenuesResponse = {
  success: boolean
  data?: {
    [campus: string]: {
      buildings: string[]
      rooms: {
        id: string
        building: string
        name: string
        capacity: string
      }[]
    }
  }
  error?: string
}

export async function getVenuesAction(): Promise<VenuesResponse> {
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

  try {
    const response = await bookingFetch('/api/venues', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': sessionToken,
      },
      // Cache the structure for an hour or upon dynamic validation
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return { success: false, error: errorData?.detail || `API Request failed with status ${response.status}` }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error occurred while fetching venues' }
  }
}
