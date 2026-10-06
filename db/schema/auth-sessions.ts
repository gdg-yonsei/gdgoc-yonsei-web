// 행사 sessions와 달리 Better Auth가 쿠키로 관리하는 로그인 세션이다.
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
