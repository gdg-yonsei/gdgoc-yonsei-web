// 행사 시각은 서울 벽시계 시각에 UTC 라벨을 붙여 저장한다(lib/format/datetime.ts).
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'
import { relations } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'
import { externalParticipants } from '@/db/schema/external-participants'
import { userToSession } from '@/db/schema/user-to-session'

/** 세션 종류: 기수 전체 대상(General) 또는 특정 파트 대상(Part). */
export const sessionTypeEnum = pgEnum('sessionType', [
  'General Session',
  'Part Session',
])

/** 공개 사이트 세션 기록의 분류(필터와 배지에 쓰인다). */
export const activityCategoryEnum = pgEnum('activityCategory', [
  'tech_talk',
  'part_session',
  'hackathon',
  'demo_day',
  'devrel',
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
  partId: integer('partId').references(() => parts.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  internalOpen: boolean('internalOpen').default(false),
  publicOpen: boolean('publicOpen').default(false),
  maxCapacity: integer('maxCapacity').default(0),
  location: text('location'),
  locationKo: text('locationKo'),
  type: sessionTypeEnum('type').default('Part Session'),
  category: activityCategoryEnum('category').notNull().default('tech_talk'),
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
