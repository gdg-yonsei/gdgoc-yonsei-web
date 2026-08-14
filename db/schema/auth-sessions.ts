import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'

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
