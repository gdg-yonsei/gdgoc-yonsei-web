import 'server-only'

import type { CallToolResult } from '@modelcontextprotocol/server'
import type { ServiceResult } from '@/lib/server/services/admin/types'

// MCP 실패 결과는 isError와 { code, message, fieldErrors }를 함께 전달한다.
export function toCallToolResult(
  result: ServiceResult<unknown>
): CallToolResult {
  if (result.ok) {
    const data = result.data ?? null
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
      structuredContent: { result: data },
    }
  }

  const error = {
    code: result.code,
    message: result.message,
    ...(result.fieldErrors ? { fieldErrors: result.fieldErrors } : {}),
  }
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify(error) }],
    structuredContent: { error },
  }
}
