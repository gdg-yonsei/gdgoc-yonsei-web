// 세션의 기수는 소속 파트를 통해 결정된다.
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

export const generationsRelations = relations(generations, ({ many }) => ({
  parts: many(parts),
  projects: many(projects),
}))
