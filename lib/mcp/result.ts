/**
 * 서비스 결과를 MCP 도구 결과(`CallToolResult`)로 바꾼다.
 */
import 'server-only'

import type { CallToolResult } from '@modelcontextprotocol/server'
import type { ServiceResult } from '@/lib/server/services/admin/types'

/** 서비스 결과를 MCP 도구 결과로. 실패는 isError + { code, message, fieldErrors }. */
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
