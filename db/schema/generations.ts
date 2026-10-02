/**
 * 기수 테이블(`generations`).
 *
 * GDGoC Yonsei의 활동 기수(예: `25-26`). 파트·프로젝트가 기수에 속하고, 세션은 파트를
 * 통해 기수에 속한다. 공개 사이트 URL에도 기수 이름이 들어간다(`/session/25-26`).
 */
import { date, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'
import { projects } from '@/db/schema/projects'

/** 기수. `name`은 URL에 쓰이므로 바꾸면 공개 페이지 주소도 바뀐다. */
export const generations = pgTable('generations', {
  id: serial('id').primaryKey().notNull(),
  startDate: date('startDate').notNull(),
  endDate: date('endDate'),
  name: text('name').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

/** 기수에 속한 파트와 프로젝트. */
export const generationsRelations = relations(generations, ({ many }) => ({
  parts: many(parts),
  projects: many(projects),
}))
