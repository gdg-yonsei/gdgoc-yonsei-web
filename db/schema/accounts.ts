/**
 * Better Auth 소셜 로그인 계정 테이블(`account`).
 *
 * 사용자 한 명이 GitHub·Google 계정을 여러 개 연결할 수 있다. 컬럼 이름 일부는
 * 예전 Auth.js 스키마를 그대로 쓰므로 TS 필드 이름과 DB 컬럼 이름이 다를 수 있다.
 */
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'

/** 연결된 외부 로그인 계정. 같은 제공자·계정 ID 조합은 한 번만 연결된다. */
export const accounts = pgTable(
  'account',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accountId: text('providerAccountId').notNull(),
    providerId: text('provider').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt', { mode: 'date' }),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt', { mode: 'date' }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),

    // Auth.js에서 옮겨 올 때 기존 계정 데이터를 복구할 수 있도록 남겨 둔 컬럼.
    // Better Auth는 읽지도 쓰지도 않는다.
    authjsType: text('type'),
    authjsExpiresAt: integer('expires_at'),
    authjsTokenType: text('token_type'),
    authjsSessionState: text('session_state'),
  },
  (account) => [
    index('account_userId_idx').on(account.userId),
    uniqueIndex('account_provider_providerAccountId_unique').on(
      account.providerId,
      account.accountId
    ),
  ]
)
