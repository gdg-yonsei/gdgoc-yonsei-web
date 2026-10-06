import { users } from '@/db/schema/users'
import { projects } from '@/db/schema/projects'
import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/** 프로젝트 참가자. (사용자, 프로젝트) 조합당 한 행. */
export const usersToProjects = pgTable(
  'users_to_projects',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, {
        onDelete: 'cascade',
        onUpdate: 'cascade',
      }),
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
