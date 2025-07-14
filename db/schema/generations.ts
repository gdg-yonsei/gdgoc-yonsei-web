import { date, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'
import { sessions } from '@/db/schema/sessions'

export const generations = pgTable('generations', {
  id: serial('id').primaryKey().notNull(),
  startDate: date('startDate').notNull(),
  endDate: date('endDate'),
  name: text('name').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

export const generationsRelations = relations(generations, ({ many }) => ({
  parts: many(parts),
  sessions: many(sessions),
}))
