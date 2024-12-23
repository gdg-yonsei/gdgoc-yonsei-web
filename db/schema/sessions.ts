import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  mainImage: text('mainImage').notNull().default('/session-default.png'),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  authorId: text('authorId')
    .notNull()
    .references(() => users.id, { onDelete: 'no action', onUpdate: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})
