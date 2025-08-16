import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import { usersToParts } from '@/db/schema/users-to-parts'
import { sessions } from '@/db/schema/sessions'

export const parts = pgTable('parts', {
  id: serial('id').primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  generationsId: integer('generationId'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

export const partsRelations = relations(parts, ({ one, many }) => ({
  generation: one(generations, {
    fields: [parts.generationsId],
    references: [generations.id],
  }),
  usersToParts: many(usersToParts),
  sessions: many(sessions),
}))
