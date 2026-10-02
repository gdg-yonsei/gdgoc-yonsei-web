/**
 * 프로젝트-태그 연결 테이블(`projects_to_tags`, 다대다).
 */
import { projects } from '@/db/schema/projects'
import { tags } from '@/db/schema/tags'
import { pgTable, serial, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/** 프로젝트와 태그 연결. 어느 쪽이 지워져도 연결이 함께 지워진다. */
export const projectsToTags = pgTable('projects_to_tags', {
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  tagId: serial('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
})

/** 연결 행에서 프로젝트·태그로 가는 관계. */
export const projectsToTagsRelations = relations(projectsToTags, ({ one }) => ({
  tag: one(tags, {
    fields: [projectsToTags.tagId],
    references: [tags.id],
  }),
  project: one(projects, {
    fields: [projectsToTags.projectId],
    references: [projects.id],
  }),
}))
