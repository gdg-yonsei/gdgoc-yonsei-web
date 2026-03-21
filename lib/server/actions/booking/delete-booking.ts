'use server'

import { auth } from '@/auth'
import db from '@/db'
import { bookingRequests } from '@/db/schema/booking-requests'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'

export async function deleteBookingAction(bookingId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    // Get the web_booking_requests record to find the externalId
    const record = await db
      .select({ externalId: bookingRequests.externalId })
      .from(bookingRequests)
      .where(eq(bookingRequests.id, bookingId))
      .limit(1)

    const externalId = record[0]?.externalId

    // Delete from auto-booker's booking_requests table
    if (externalId) {
      await db.execute(
        sql`DELETE FROM booking_requests WHERE id = ${Number(externalId)}`
      )
    }

    // Delete from web_booking_requests
    await db.delete(bookingRequests).where(eq(bookingRequests.id, bookingId))

    revalidatePath('/admin/booking')
    return { success: true }
  } catch (error: any) {
    console.error('Delete booking failed:', error.message)
    return { success: false, error: error.message || '삭제에 실패했습니다' }
  }
}
