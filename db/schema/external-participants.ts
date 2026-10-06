// 현재 화면에서 쓰지 않아도 비회원 참가 기록을 보존하기 위해 유지한다.
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'

/** 세션에 참여한 비회원. 세션이 지워지면 함께 지워진다. */
export const externalParticipants = pgTable('external_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('firstName'),
  firstNameKo: text('firstNameKo'),
  lastName: text('lastName'),
  lastNameKo: text('lastNameKo'),
  studentId: text('studentId'),
  email: text('email'),
  createdAt: timestamp('createdAt').defaultNow(),
  sessionId: uuid('sessionId')
    .notNull()
    .references(() => sessions.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
})

export const externalParticipantsRelation = relations(
  externalParticipants,
  ({ one }) => ({
    session: one(sessions, {
      fields: [externalParticipants.sessionId],
      references: [sessions.id],
    }),
  })
)
