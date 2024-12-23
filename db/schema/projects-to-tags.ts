import { projects } from '@/db/schema/projects'
import { tags } from '@/db/schema/tags'
import { pgTable, primaryKey, serial, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const projectsToTags = pgTable(
  'projects_to_tags',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
    tagId: serial('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.tagId] }),
  })
)

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
