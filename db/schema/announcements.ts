import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'

// 리드가 GYMS 회원 전체에게 모달로 띄우는 공지. 수정 없이 작성·삭제만 한다.
export const announcements = pgTable(
  'announcements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    ctaLabel: text('ctaLabel'),
    // 로케일 접두사 없는 `/admin...` 경로만 저장하고, 표시할 때 로케일을 붙인다.
    ctaHref: text('ctaHref'),
    authorId: text('authorId').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
  },
  (table) => [index('announcements_createdAt_idx').on(table.createdAt)]
)

/** 닫거나 버튼을 눌러 다시 띄우지 않을 공지. (공지, 사용자) 조합당 한 행. */
export const announcementReads = pgTable(
  'announcement_reads',
  {
    announcementId: uuid('announcementId')
      .notNull()
      .references(() => announcements.id, { onDelete: 'cascade' }),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    readAt: timestamp('readAt').defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.announcementId, table.userId] })]
)
