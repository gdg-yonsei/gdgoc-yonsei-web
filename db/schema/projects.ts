// 이미지 필드에는 R2 공개 URL을 저장한다.
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { usersToProjects } from '@/db/schema/users-to-projects'
import { users } from '@/db/schema/users'
import { projectsToTags } from '@/db/schema/projects-to-tags'
import { generations } from '@/db/schema/generations'

// 대표 이미지가 없으면 기본 이미지 경로를 쓴다. 일반 멤버는 자기 프로젝트만 고칠 수 있다.
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  name: text('name').notNull(),
  nameKo: text('nameKo'),
  description: text('description').notNull().default(''),
  descriptionKo: text('descriptionKo'),
  content: text('content').notNull().default(''),
  contentKo: text('contentKo').notNull().default(''),
  mainImage: text('mainImage').notNull().default('/project-default.png'),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  repoUrl: text('repoUrl'),
  demoUrl: text('demoUrl'),
  authorId: text('authorId')
    .notNull()
    .references(() => users.id, { onDelete: 'no action', onUpdate: 'cascade' }),
  generationId: integer('generationId')
    .notNull()
    .references(() => generations.id, {
      onDelete: 'cascade',
      onUpdate: 'cascade',
    }),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
})

export const projectsRelations = relations(projects, ({ many, one }) => ({
  usersToProjects: many(usersToProjects),
  projectsToTags: many(projectsToTags),
  generation: one(generations, {
    fields: [projects.generationId],
    references: [generations.id],
  }),
}))
