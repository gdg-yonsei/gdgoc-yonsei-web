import { users } from '@/db/schema/users'
import { projects } from '@/db/schema/projects'
import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const usersToProjects = pgTable(
  'users_to_projects',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.projectId] }),
  })
)

export const usersToProjectsRelations = relations(
  usersToProjects,
  ({ one }) => ({
    project: one(projects, {
      fields: [usersToProjects.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [usersToProjects.userId],
      references: [users.id],
    }),
  })
)
