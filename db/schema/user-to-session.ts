/**
 * 사용자-세션 참가 테이블(`userToSession`, 다대다).
 */
import { users } from '@/db/schema/users'
import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { sessions } from '@/db/schema/sessions'

/** 세션 참가자. (사용자, 세션) 조합당 한 행. */
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

/** 참가 행에서 세션·사용자로 가는 관계. */
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
