import {
  boolean,
  date,
  integer,
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
import { externalParticipants } from '@/db/schema/external-participants'
import { userToSession } from '@/db/schema/user-to-session'

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
  openSession: boolean('openSession').default(false),
  maxCapacity: integer('maxCapacity').default(0),
  location: text('location'),
  locationKo: text('locationKo'),
  eventDate: date('eventDate').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const sessionRelations = relations(sessions, ({ one, many }) => ({
  part: one(parts, {
    fields: [sessions.partId],
    references: [parts.id],
  }),
  externalParticipants: many(externalParticipants),
  userToSession: many(userToSession),
}))
