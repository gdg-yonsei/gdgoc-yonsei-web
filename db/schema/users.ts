/**
 * 사용자 테이블(`user`).
 *
 * Better Auth가 관리하는 계정이면서 GDGoC 멤버 프로필이다. 가입하면 `UNVERIFIED`로
 * 시작하고, 운영진이 승인하면 멤버가 된다.
 */
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

/**
 * 사용자 역할. 권한 정책은 `lib/server/permission/policy.ts`에 있다.
 * - MEMBER: 일반 멤버
 * - CORE: 파트장 등 운영진
 * - LEAD: 오거나이저(모든 권한)
 * - ALUMNUS: 졸업생(알럼나이)
 * - UNVERIFIED: 가입 직후 상태. 운영진 승인 전에는 관리자 화면에 들어갈 수 없다.
 */
export const roleEnum = pgEnum('role', [
  'MEMBER',
  'CORE',
  'LEAD',
  'ALUMNUS',
  'UNVERIFIED',
])

/** 사용자 역할 유니온 타입. 역할 목록의 단일 출처는 위 `roleEnum`이다. */
export type Role = (typeof roleEnum.enumValues)[number]

/**
 * 사용자(멤버 프로필 포함).
 * - `studentId`: 학번(숫자). `telephone`: 하이픈·공백을 뺀 전화번호
 * - `sessionNotiEmail`: 새 세션 안내 메일 수신 여부
 */
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

/** 사용자의 파트 소속, 프로젝트 참가, 세션 참가 관계. */
export const usersRelations = relations(users, ({ many }) => ({
  usersToParts: many(usersToParts),
  usersToProjects: many(usersToProjects),
  userToSession: many(userToSession),
}))
