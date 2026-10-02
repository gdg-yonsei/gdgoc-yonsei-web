/**
 * 파트 테이블(`parts`).
 *
 * 기수 안의 세부 팀(프론트엔드, 백엔드, ML/AI 등). 구성원은 `users_to_parts`로 연결한다.
 */
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { generations } from '@/db/schema/generations'
import { usersToParts } from '@/db/schema/users-to-parts'
import { sessions } from '@/db/schema/sessions'

/** 파트. `displayOrder`가 작을수록 공개 사이트에서 먼저 보인다. */
export const parts = pgTable('parts', {
  id: serial('id').primaryKey().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  generationsId: integer('generationId').references(() => generations.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
  displayOrder: integer('displayOrder').notNull().default(10),
})

/** 파트가 속한 기수, 구성원, 파트 세션. */
export const partsRelations = relations(parts, ({ one, many }) => ({
  generation: one(generations, {
    fields: [parts.generationsId],
    references: [generations.id],
  }),
  usersToParts: many(usersToParts),
  sessions: many(sessions),
}))
