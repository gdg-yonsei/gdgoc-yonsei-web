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
import { userToSession } from '@/db/schema/user-to-session'

// 가입 직후 UNVERIFIED는 운영진 승인 전까지 관리자 화면에 접근할 수 없다.
// 역할별 권한은 lib/server/permission/policy.ts에서 정한다.
export const roleEnum = pgEnum('role', [
  'MEMBER',
  'CORE',
  'LEAD',
  'ALUMNUS',
  'UNVERIFIED',
])

export type Role = (typeof roleEnum.enumValues)[number]

// 전화번호는 하이픈·공백을 뺀 값으로 저장한다.
export const users = pgTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  // Auth.js는 `emailVerified`에 확인 시각을 저장했지만 Better Auth는 boolean을
  // 요구한다. 예전 값은 그대로 두고, 새 필드는 별도 컬럼에 매핑해 마이그레이션에서 채웠다.
  authjsEmailVerified: timestamp('emailVerified', { mode: 'date' }),
  emailVerified: boolean('betterAuthEmailVerified').default(false).notNull(),
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
  sessionNotiEmail: boolean('sessionNotiEmail').default(true).notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  usersToParts: many(usersToParts),
  usersToProjects: many(usersToProjects),
  userToSession: many(userToSession),
}))
