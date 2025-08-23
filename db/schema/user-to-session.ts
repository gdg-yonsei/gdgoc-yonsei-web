import { users } from '@/db/schema/users'
import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'

export const userToSession = pgTable(
  'userToSession',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    sessionId: uuid('sessionId')
      .notNull()
      .references(() => sessions.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.sessionId] }),
  })
)

export const userToSessionRelations = relations(userToSession, ({ one }) => ({
  session: one(sessions, {
    fields: [userToSession.sessionId],
    references: [sessions.id],
  }),
  user: one(users, {
    fields: [userToSession.userId],
    references: [users.id],
  }),
}))
