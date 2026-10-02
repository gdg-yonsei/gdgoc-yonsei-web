/**
 * 사용자-파트 소속 테이블(`users_to_parts`, 다대다).
 */
import { users } from '@/db/schema/users'
import { parts } from '@/db/schema/parts'
import { pgEnum, pgTable, primaryKey, serial, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * 파트 안에서의 역할.
 * - Core: 파트장 등 운영진(관리자 화면의 파트 수정에서는 보존된다)
 * - Primary: 주 소속 파트
 * - Secondary: 겸임(더블 보드) 파트
 */
export const userType = pgEnum('userType', ['Core', 'Primary', 'Secondary'])

/** 사용자의 파트 소속. (사용자, 파트) 조합당 한 행. */
export const usersToParts = pgTable(
  'users_to_parts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    partId: serial('part_id')
      .notNull()
      .references(() => parts.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userType: userType('userType').default('Primary'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.partId] }),
  })
)

/** 소속 행에서 파트·사용자로 가는 관계. */
export const usersToPartsRelations = relations(usersToParts, ({ one }) => ({
  part: one(parts, {
    fields: [usersToParts.partId],
    references: [parts.id],
  }),
  user: one(users, {
    fields: [usersToParts.userId],
    references: [users.id],
  }),
}))
