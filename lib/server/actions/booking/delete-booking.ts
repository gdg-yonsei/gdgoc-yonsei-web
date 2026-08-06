'use server'

import { auth } from '@/auth'
import db from '@/db'
import { bookingRequests } from '@/db/schema/booking-requests'
import handlePermission from '@/lib/server/permission/handle-permission'
import type { ActionResult } from '@/lib/server/actions/types'
import { revalidatePath } from 'next/cache'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { logger } from '@/lib/server/logger'

const deleteBookingSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
})

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

  if (!(await handlePermission(session.user.id, 'delete', 'booking'))) {
    return { success: false, error: 'Forbidden' }
  }

  try {
    const record = await db
      .select({ externalId: bookingRequests.externalId })
      .from(bookingRequests)
      .where(eq(bookingRequests.id, parsed.data.bookingId))
      .limit(1)

    const externalId = record[0]?.externalId

    if (externalId) {
      if (!/^\d+$/.test(externalId)) {
        return { success: false, error: 'Invalid external booking ID' }
      }

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
    logger.error('booking.delete', error)
    return { success: false, error: message || '삭제에 실패했습니다' }
  }
}
