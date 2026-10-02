/**
 * 프로젝트 테이블(`projects`).
 *
 * 공개 사이트 프로젝트 쇼케이스와 관리자 화면의 프로젝트. 이미지 필드에는 R2 공개 URL을
 * 저장한다. 참가자는 `users_to_projects`, 태그는 `projects_to_tags`로 연결한다.
 */
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

/**
 * 프로젝트.
 * - `mainImage`: 대표 이미지(없으면 기본 이미지 경로)
 * - `images`: 본문 이미지 URL 목록(JSON 배열)
 * - `authorId`: 작성자. 일반 멤버는 자기 프로젝트만 고칠 수 있다.
 */
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

/** 참가자, 태그, 기수 관계. */
export const projectsRelations = relations(projects, ({ many, one }) => ({
  usersToProjects: many(usersToProjects),
  projectsToTags: many(projectsToTags),
  generation: one(generations, {
    fields: [projects.generationId],
    references: [generations.id],
  }),
}))
