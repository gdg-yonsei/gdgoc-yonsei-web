'use server'

import { getAuthSession } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
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
  const session = await getAuthSession()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!(await handlePermission(session.user.id, 'get', 'bookingPage'))) {
    return { success: false, error: 'Forbidden' }
  }

  try {
    const response = await bookingFetch('/api/venues', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Better Auth signs the browser cookie. The booking API expects the
        // canonical token stored in the shared session table instead.
        'X-Session-Token': session.session.token,
      },
      // Cache the structure for an hour or upon dynamic validation
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      return {
        success: false,
        error:
          errorData?.detail ||
          `API Request failed with status ${response.status}`,
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Network error occurred while fetching venues'
    return { success: false, error: message }
  }
}
