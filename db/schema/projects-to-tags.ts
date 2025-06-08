import { projects } from '@/db/schema/projects'
import { tags } from '@/db/schema/tags'
import { pgTable, serial, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

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
