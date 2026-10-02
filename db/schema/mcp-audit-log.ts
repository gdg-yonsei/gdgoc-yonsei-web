/**
 * MCP 도구 호출 감사 로그 테이블(`mcp_audit_log`).
 */
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

/**
 * MCP 쓰기·관리 도구 호출 기록. 실패한 호출도 남긴다.
 * 입력은 비밀성 키를 가리고 긴 문자열을 잘라서 저장한다(lib/mcp/audit.ts).
 */
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
