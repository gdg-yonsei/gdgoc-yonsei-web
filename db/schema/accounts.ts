import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'

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

    // Retained during the migration so existing Auth.js account data remains
    // recoverable. Better Auth does not read or write these fields.
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
