import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from '@/db/schema/users'

export const bookingStatusEnum = pgEnum('bookingStatus', [
  'PENDING',
  'SCHEDULED',
  'SUCCESS',
  'FAILED',
])

export const bookingRequests = pgTable('booking_requests', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  externalId: text('externalId'),
  roomName: text('roomName').notNull(),
  building: text('building').notNull(),
  campus: text('campus').notNull(),
  startTime: timestamp('startTime').notNull(),
  endTime: timestamp('endTime').notNull(),
  eventName: text('eventName').notNull(),
  eventType: text('eventType').notNull(),
  attendees: integer('attendees').notNull(),
  contactPhone: text('contactPhone').notNull(),
  status: bookingStatusEnum('status').notNull().default('PENDING'),
  requestedById: text('requestedById')
    .notNull()
    .references(() => users.id, { onDelete: 'no action', onUpdate: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const bookingRequestsRelations = relations(
  bookingRequests,
  ({ one }) => ({
    requestedBy: one(users, {
      fields: [bookingRequests.requestedById],
      references: [users.id],
    }),
  })
)
