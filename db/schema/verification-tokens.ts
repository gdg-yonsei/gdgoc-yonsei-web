/**
 * Better Auth 인증 토큰 테이블(`verificationToken`). 이메일 확인, OAuth 상태 등 일회성 값을 저장한다.
 */
import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

/** 일회성 인증 값. 만료되면 Better Auth가 정리한다. */
export const verification = pgTable(
  'verificationToken',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    identifier: text('identifier').notNull(),
    value: text('token').notNull(),
    expiresAt: timestamp('expires', { mode: 'date' }).notNull(),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
  },
  (verificationToken) => [
    index('verificationToken_identifier_idx').on(verificationToken.identifier),
  ]
)
