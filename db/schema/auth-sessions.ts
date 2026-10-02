/**
 * 로그인 세션 테이블(`session`).
 *
 * Better Auth가 쿠키로 관리하는 웹 세션이다. 공개 사이트의 "세션(행사)" 테이블
 * (`sessions.ts`)과 이름이 비슷하니 혼동하지 않는다.
 */
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'

/** 로그인 세션. `token`은 쿠키에 서명되어 담기는 원본 세션 토큰이다. */
export const authSessions = pgTable(
  'session',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    token: text('sessionToken').notNull().unique(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires', { mode: 'date' }).notNull(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
  },
  (session) => [index('session_userId_idx').on(session.userId)]
)
