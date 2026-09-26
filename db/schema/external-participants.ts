import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'

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
    .references(() => sessions.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
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
