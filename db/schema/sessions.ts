/**
 * 세션(행사) 테이블(`sessions`).
 *
 * 기술 세션·파트 세션·해커톤 등 활동 기록. 로그인 세션 테이블(`auth-sessions.ts`)과는
 * 다르다. 시작·종료 시각은 "서울 벽시계 시각을 UTC 라벨로" 저장한다
 * (`lib/format/datetime.ts` 참고).
 */
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

/**
 * 세션.
 * - `internalOpen`/`publicOpen`: 멤버 내부 신청·외부 공개 신청 허용 여부
 * - `displayOnWebsite`: 공개 사이트 세션 기록에 보일지
 * - `startAt`/`endAt`: 서울 벽시계 시각(UTC 라벨)
 */
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

/** 세션의 파트, 참가자, 작성자 관계. */
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
