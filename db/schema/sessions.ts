import {
  date,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'
import { relations } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'

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
  partId: serial('sessionId'),
  eventDate: date('eventDate').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const sessionRelations = relations(sessions, ({ one }) => ({
  part: one(parts, {
    fields: [sessions.partId],
    references: [parts.id],
  }),
}))
