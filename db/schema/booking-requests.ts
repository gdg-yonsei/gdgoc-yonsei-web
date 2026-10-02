/**
 * 강의실 예약 웹 미러 테이블(`web_booking_requests`).
 *
 * 예약의 원본은 auto-booker 서비스가 소유한 `booking_requests` 테이블이고, 이 테이블은
 * 관리자 화면 표시용 미러다(`lib/server/booking/repository.ts` 참고).
 */
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

/** 예약 진행 상태: 접수 → 예약 예정 → 완료/실패. */
export const bookingStatusEnum = pgEnum('bookingStatus', [
  'PENDING',
  'SCHEDULED',
  'SUCCESS',
  'FAILED',
])

/** 관리자 화면의 예약 목록. `externalId`는 auto-booker 원본 행 ID(숫자 문자열)다. */
export const bookingRequests = pgTable('web_booking_requests', {
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
  executedAt: timestamp('executedAt'),
  errorMessage: text('errorMessage'),
})

/** 예약 신청자(user) 관계. */
export const bookingRequestsRelations = relations(
  bookingRequests,
  ({ one }) => ({
    requestedBy: one(users, {
      fields: [bookingRequests.requestedById],
      references: [users.id],
    }),
  })
)
