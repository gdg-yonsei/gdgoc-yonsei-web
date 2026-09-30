import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from '@/db/schema/users'

/**
 * MCP 로 발급·가져온 이미지 업로드 기록.
 * 시간당 업로드 한도를 세고, 완료되지 않은 채 만료된 R2 객체를 치우는 데 쓴다.
 * 사용자가 삭제돼도 정리를 위해 기록은 남긴다(userId 만 비운다).
 */
export const mcpImageUpload = pgTable(
  'mcp_image_upload',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    objectKey: text('objectKey').notNull().unique(),
    userId: text('userId').references(() => users.id, { onDelete: 'set null' }),
    kind: text('kind', { enum: ['presigned', 'import'] }).notNull(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    expiresAt: timestamp('expiresAt').notNull(),
    completedAt: timestamp('completedAt'),
  },
  (table) => [
    index('mcp_image_upload_userId_createdAt_idx').on(
      table.userId,
      table.createdAt
    ),
    index('mcp_image_upload_expiresAt_idx').on(table.expiresAt),
  ]
)
