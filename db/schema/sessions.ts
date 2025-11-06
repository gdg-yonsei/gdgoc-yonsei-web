import {
  boolean,
  integer,
  jsonb,
  pgEnum,
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

export const sessionTypeEnum = pgEnum('sessionType', [
  'General Session',
  'Part Session',
])

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().notNull().primaryKey(),
  name: text('name').notNull(),
  nameKo: text('nameKo').notNull(),
  description: text('description'),
  descriptionKo: text('descriptionKo'),
  mainImage: text('mainImage').notNull().default('/session-default.png'),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  authorId: text('authorId')
    .notNull()
    .references(() => users.id, { onDelete: 'no action', onUpdate: 'cascade' }),
  partId: serial('sessionId'),
  internalOpen: boolean('internalOpen').default(false),
  publicOpen: boolean('publicOpen').default(false),
  maxCapacity: integer('maxCapacity').default(0),
  location: text('location'),
  locationKo: text('locationKo'),
  type: sessionTypeEnum('type').default('Part Session'),
  displayOnWebsite: boolean('displayOnWebsite').default(true),
  startAt: timestamp(),
  endAt: timestamp(),
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
  author: one(users, {
    fields: [sessions.authorId],
    references: [users.id],
  }),
}))
