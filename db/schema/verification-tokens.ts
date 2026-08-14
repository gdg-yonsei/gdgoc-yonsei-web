import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

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
