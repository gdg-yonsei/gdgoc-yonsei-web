// 태그 이름은 대소문자 구분 없이 재사용한다(project-tags.ts).
import { pgTable, serial, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { projectsToTags } from '@/db/schema/projects-to-tags'

export const tags = pgTable('tags', {
  id: serial('id').primaryKey().notNull(),
  name: text('name').notNull().unique(),
})

export const tagsRelations = relations(tags, ({ many }) => ({
  projectsToTags: many(projectsToTags),
}))
