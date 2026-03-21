import 'server-only'
import { desc, eq } from 'drizzle-orm'
import db from '@/db'
import { bookingRequests } from '@/db/schema/booking-requests'
import { users } from '@/db/schema/users'

export type BookingRequestListItem = {
  id: string
  roomName: string
  building: string
  campus: string
  startTime: Date
  endTime: Date
  eventName: string
  eventType: string
  attendees: number
  contactPhone: string
  status: 'PENDING' | 'SCHEDULED' | 'SUCCESS' | 'FAILED'
  requestedByName: string | null
  createdAt: Date
}

export async function getBookingRequests(): Promise<BookingRequestListItem[]> {
  const rows = await db
    .select({
      id: bookingRequests.id,
      roomName: bookingRequests.roomName,
      building: bookingRequests.building,
      campus: bookingRequests.campus,
      startTime: bookingRequests.startTime,
      endTime: bookingRequests.endTime,
      eventName: bookingRequests.eventName,
      eventType: bookingRequests.eventType,
      attendees: bookingRequests.attendees,
      contactPhone: bookingRequests.contactPhone,
      status: bookingRequests.status,
      requestedByName: users.name,
      createdAt: bookingRequests.createdAt,
    })
    .from(bookingRequests)
    .leftJoin(users, eq(bookingRequests.requestedById, users.id))
    .orderBy(desc(bookingRequests.createdAt))

  return rows
}
