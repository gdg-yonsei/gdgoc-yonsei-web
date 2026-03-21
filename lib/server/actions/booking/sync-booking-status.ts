import 'server-only'
import { eq, isNotNull } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import db from '@/db'
import { bookingRequests } from '@/db/schema/booking-requests'

export async function syncBookingStatus() {
  try {
    // Get local records that have an externalId (linked to auto-booker's booking_requests)
    const localRecords = await db
      .select({
        id: bookingRequests.id,
        externalId: bookingRequests.externalId,
        status: bookingRequests.status,
      })
      .from(bookingRequests)
      .where(isNotNull(bookingRequests.externalId))

    if (localRecords.length === 0) return

    // Query auto-booker's booking_requests table directly for status updates
    const externalIds = localRecords
      .map((r) => r.externalId)
      .filter((id): id is string => id !== null)

    if (externalIds.length === 0) return

    const apiRecords = await db.execute(
      sql`SELECT id, status FROM booking_requests WHERE id = ANY(${externalIds.map(Number)}::int[])`
    )

    const apiStatusMap = new Map<string, string>()
    const rows = apiRecords as unknown as { id: number; status: string }[]
    for (const row of rows) {
      apiStatusMap.set(row.id.toString(), row.status)
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
