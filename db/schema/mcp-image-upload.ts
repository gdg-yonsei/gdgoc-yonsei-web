import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'

/**
 * MCP 로 발급·가져온 이미지 업로드 기록.
 *
 * - 업로드를 시작할 때 한 줄을 예약한다(시간당 한도는 이 줄 수로 센다).
 *   URL 가져오기는 객체 키를 알기 전에 예약하므로 objectKey 가 잠시 비어 있다.
 * - 끝나면 completedAt 또는 rejectedAt 이 찍힌다. 거절된 줄도 한도에 포함된다.
 * - 어느 쪽도 아닌 채 만료되면 정리 작업이 claimedAt(임대)을 찍고 R2 객체를 지운 뒤
 *   줄을 지운다. 지우기에 실패하면 임대가 끝난 뒤 다시 시도한다.
 * 사용자가 삭제돼도 정리를 위해 기록은 남긴다(userId 만 비운다).
 */
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
