'use server'

import { auth } from '@/auth'
import db from '@/db'
import { bookingRequests } from '@/db/schema/booking-requests'
import type { ActionResult } from '@/lib/server/actions/types'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'

const deleteBookingSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
})

export type DeleteBookingInput = z.infer<typeof deleteBookingSchema>

export async function deleteBookingAction(
  bookingId: string
): Promise<ActionResult> {
  const parsed = deleteBookingSchema.safeParse({ bookingId })
  if (!parsed.success) {
    return { success: false, error: 'Invalid booking ID' }
  }

  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const record = await db
      .select({ externalId: bookingRequests.externalId })
      .from(bookingRequests)
      .where(eq(bookingRequests.id, parsed.data.bookingId))
      .limit(1)

    const externalId = record[0]?.externalId

    if (externalId) {
      await db.execute(
        sql`DELETE FROM booking_requests WHERE id = ${Number(externalId)}`
      )
    }

    await db
      .delete(bookingRequests)
      .where(eq(bookingRequests.id, parsed.data.bookingId))

    revalidatePath('/admin/booking')
    return { success: true, data: undefined }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Delete booking failed:', message)
    return { success: false, error: message || '삭제에 실패했습니다' }
  }
}
