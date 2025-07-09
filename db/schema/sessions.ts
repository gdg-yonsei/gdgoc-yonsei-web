import {
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'
import { generations } from '@/db/schema/generations'
import { relations } from 'drizzle-orm'

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  name: text('name').notNull(),
  nameKo: text('nameKo'),
  description: text('description'),
  descriptionKo: text('descriptionKo'),
  mainImage: text('mainImage').notNull().default('/session-default.png'),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  authorId: text('authorId')
    .notNull()
    .references(() => users.id, { onDelete: 'no action', onUpdate: 'cascade' }),
  generationId: integer('generationId').notNull(),
  eventDate: date('eventDate').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const sessionRelations = relations(sessions, ({ one }) => ({
  generation: one(generations, {
    fields: [sessions.generationId],
    references: [generations.id],
  }),
}))
