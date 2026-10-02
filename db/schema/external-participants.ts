/**
 * 외부 참가자 테이블(`external_participants`).
 *
 * 회원이 아닌 참가자를 세션에 기록하기 위한 테이블이다. 현재 화면에서는 쓰지 않지만
 * 데이터 보존을 위해 스키마를 유지한다.
 */
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
