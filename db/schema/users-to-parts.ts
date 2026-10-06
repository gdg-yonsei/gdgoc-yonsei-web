import { users } from '@/db/schema/users'
import { parts } from '@/db/schema/parts'
import { pgEnum, pgTable, primaryKey, serial, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Core는 파트 수정에서도 보존한다. Primary는 주 소속, Secondary는 겸임이다.
export const userType = pgEnum('userType', ['Core', 'Primary', 'Secondary'])

/** 사용자의 파트 소속. (사용자, 파트) 조합당 한 행. */
export const usersToParts = pgTable(
  'users_to_parts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    partId: serial('part_id')
      .notNull()
      .references(() => parts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userType: userType('userType').default('Primary'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.partId] }),
  })
)

export const usersToPartsRelations = relations(usersToParts, ({ one }) => ({
  part: one(parts, {
    fields: [usersToParts.partId],
    references: [parts.id],
  }),
  user: one(users, {
    fields: [usersToParts.userId],
    references: [users.id],
  }),
}))
