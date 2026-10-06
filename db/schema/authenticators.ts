// Better Auth 패스키 모델의 테이블 이름은 Auth.js 호환성을 위해 유지한다.
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'

/** 사용자가 등록한 패스키. 한 사용자가 여러 기기의 패스키를 가질 수 있다. */
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

    // Better Auth는 더 이상 쓰지 않는다. Auth.js에서 옮긴 자격 증명을 되돌릴 때
    // 계정 참조를 잃지 않도록 nullable로 남겨 둔다.
    authjsProviderAccountId: text('providerAccountId'),
  },
  (passkey) => [index('authenticator_userId_idx').on(passkey.userId)]
)
