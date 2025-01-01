import { users } from '@/db/schema/users'
import { generations } from '@/db/schema/generations'
import { pgTable, primaryKey, serial, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const usersToGenerations = pgTable(
  'users_to_generations',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    generationId: serial('generation_id')
      .notNull()
      .references(() => generations.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.generationId] }),
  })
)

export const usersToGenerationsRelations = relations(
  usersToGenerations,
  ({ one }) => ({
    generation: one(generations, {
      fields: [usersToGenerations.generationId],
      references: [generations.id],
    }),
    user: one(users, {
      fields: [usersToGenerations.userId],
      references: [users.id],
    }),
  })
)
