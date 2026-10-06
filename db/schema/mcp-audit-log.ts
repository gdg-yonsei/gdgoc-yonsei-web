import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { roleEnum, users } from '@/db/schema/users'

// 실패한 쓰기·관리 호출도 기록하며, 입력의 비밀성 키와 긴 문자열은 lib/mcp/audit.ts에서 가린다.
export const mcpAuditLog = pgTable(
  'mcp_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    userId: text('userId').references(() => users.id, { onDelete: 'set null' }),
    role: roleEnum('role').notNull(),
    clientId: text('clientId'),
    clientName: text('clientName'),
    tool: text('tool').notNull(),
    input: jsonb('input').$type<unknown>().notNull(),
    outcome: text('outcome', { enum: ['ok', 'error'] }).notNull(),
    errorCode: text('errorCode'),
    targetId: text('targetId'),
    durationMs: integer('durationMs').notNull(),
  },
  (table) => [
    index('mcp_audit_log_userId_createdAt_idx').on(
      table.userId,
      table.createdAt
    ),
  ]
)
