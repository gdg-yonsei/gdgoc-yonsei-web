import 'server-only'
import { cookies } from 'next/headers'
import { eq, isNotNull } from 'drizzle-orm'
import db from '@/db'
import { bookingRequests } from '@/db/schema/booking-requests'
import { bookingFetch } from './booking-fetch'

export async function syncBookingStatus() {
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

  if (!sessionToken) return

  try {
    const response = await bookingFetch('/api/booking-requests', {
      headers: { 'X-Session-Token': sessionToken },
      cache: 'no-store',
    })

    if (!response.ok) return

    const apiRequests: { id: number; status: string }[] = await response.json()

    // Get local records that have an externalId
    const localRecords = await db
      .select({
        id: bookingRequests.id,
        externalId: bookingRequests.externalId,
        status: bookingRequests.status,
      })
      .from(bookingRequests)
      .where(isNotNull(bookingRequests.externalId))

    // Build a map of externalId -> apiStatus
    const apiStatusMap = new Map<string, string>()
    for (const req of apiRequests) {
      apiStatusMap.set(req.id.toString(), req.status)
    }

    // Update local records where status differs
    for (const local of localRecords) {
      if (!local.externalId) continue
      const apiStatus = apiStatusMap.get(local.externalId)
      if (
        apiStatus &&
        apiStatus !== local.status &&
        ['PENDING', 'SCHEDULED', 'SUCCESS', 'FAILED'].includes(apiStatus)
      ) {
        await db
          .update(bookingRequests)
          .set({
            status: apiStatus as 'PENDING' | 'SCHEDULED' | 'SUCCESS' | 'FAILED',
            updatedAt: new Date(),
          })
          .where(eq(bookingRequests.id, local.id))
      }
    }
  } catch {
    // Sync failure should not break the page
  }
}
