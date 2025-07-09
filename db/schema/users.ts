import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { usersToParts } from '@/db/schema/users-to-parts'
import { usersToProjects } from '@/db/schema/users-to-projects'

/**
 * @desc 사용자 권한 및 역할
 * @member "GDGoC 멤버"
 * @core 각 파트장
 * @lead Organizer
 * @alumnus 알럼나이
 * @unverified 가입 후 기본 상태 (일반 멤버로 전환 필요)
 */
export const roleEnum = pgEnum('role', [
  'MEMBER',
  'CORE',
  'LEAD',
  'ALUMNUS',
  'UNVERIFIED',
])

export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  firstName: text('firstName'),
  firstNameKo: text('firstNameKo'),
  lastName: text('lastName'),
  lastNameKo: text('lastNameKo'),
  role: roleEnum('role').notNull().default('UNVERIFIED'),
  githubId: text('githubId'),
  instagramId: text('instagramId'),
  linkedInId: text('linkedinId'),
  registeredAt: timestamp('registeredAt').defaultNow().notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  isForeigner: boolean('isForeigner').default(false).notNull(),
  major: text('major'),
  studentId: integer('studentId'),
  telephone: text('telephone'),
})

export const usersRelations = relations(users, ({ many }) => ({
  usersToParts: many(usersToParts),
  usersToProjects: many(usersToProjects),
}))
