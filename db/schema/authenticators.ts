import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'

export const passkeys = pgTable(
  'authenticator',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name'),
    publicKey: text('credentialPublicKey').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    credentialID: text('credentialID').notNull().unique(),
    counter: integer('counter').notNull(),
    deviceType: text('credentialDeviceType').notNull(),
    backedUp: boolean('credentialBackedUp').notNull(),
    transports: text('transports'),
    createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow(),
    aaguid: text('aaguid'),

    // No longer used by Better Auth. It is kept nullable so migrated Auth.js
    // credentials can be rolled back without losing their account reference.
    authjsProviderAccountId: text('providerAccountId'),
  },
  (passkey) => [index('authenticator_userId_idx').on(passkey.userId)]
)
