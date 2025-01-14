import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { usersToProjects } from '@/db/schema/users-to-projects'
import { users } from '@/db/schema/users'
import { projectsToTags } from '@/db/schema/projects-to-tags'

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  mainImage: text('mainImage').notNull().default('/project-default.png'),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  authorId: text('authorId')
    .notNull()
    .references(() => users.id, { onDelete: 'no action', onUpdate: 'cascade' }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const projectsRelations = relations(projects, ({ many }) => ({
  usersToProjects: many(usersToProjects),
  projectsToTags: many(projectsToTags),
}))
