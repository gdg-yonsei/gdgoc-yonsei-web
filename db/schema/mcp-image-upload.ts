import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'

// 거절을 포함한 예약 수로 시간당 한도를 센다. URL 가져오기는 objectKey 없이 예약할 수 있다.
// 만료된 미완료 객체는 임대로 정리·재시도한다. 완료 기록은 2일 뒤 지우며 사용자 삭제 시에도 보존한다.
export const mcpImageUpload = pgTable(
  'mcp_image_upload',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    objectKey: text('objectKey').unique(),
    userId: text('userId').references(() => users.id, { onDelete: 'set null' }),
    kind: text('kind', { enum: ['presigned', 'import'] }).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
    completedAt: timestamp('completedAt'),
    rejectedAt: timestamp('rejectedAt'),
    claimedAt: timestamp('claimedAt'),
  },
  (table) => [
    index('mcp_image_upload_userId_createdAt_idx').on(
      table.userId,
      table.createdAt
    ),
    index('mcp_image_upload_expiresAt_idx').on(table.expiresAt),
  ]
)
