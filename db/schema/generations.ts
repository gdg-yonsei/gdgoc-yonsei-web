import { date, pgTable, serial, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'
import { usersToGenerations } from '@/db/schema/users-to-generations'

export const generations = pgTable('generations', {
  id: serial('id').primaryKey().notNull(),
  startDate: date('startDate').notNull(),
  endDate: date('endDate'),
  name: text('name').notNull(),
})

export const generationsRelations = relations(generations, ({ many }) => ({
  parts: many(parts),
  usersToGenerations: many(usersToGenerations),
}))
