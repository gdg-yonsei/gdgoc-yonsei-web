import { users } from '@/db/schema/users'
import { parts } from '@/db/schema/parts'
import { pgEnum, pgTable, primaryKey, serial, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const partTypeEnum = pgEnum('partType', ['Primary', 'Secondary'])

export const usersToParts = pgTable(
  'users_to_parts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    partId: serial('part_id')
      .notNull()
      .references(() => parts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    partType: partTypeEnum('partType').default('Primary'),
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
