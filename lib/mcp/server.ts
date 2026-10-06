// 무상태 Streamable HTTP는 요청마다 새 서버를 만든다. 허용된 도구만 등록하고 쓰기·관리는 감사 기록한다.
import 'server-only'

import { McpServer, createMcpHandler } from '@modelcontextprotocol/server'
import { withAudit } from '@/lib/mcp/audit'
import { isToolVisible, type ToolDefinition } from '@/lib/mcp/registry'
import { toCallToolResult } from '@/lib/mcp/result'
import { logger } from '@/lib/server/logger'
import { fail, type Actor } from '@/lib/server/services/admin/types'

const INSTRUCTIONS = `GYMS is the GDGoC Yonsei management system.
Call whoami first to learn your role, granted scopes and which generationId values you can use.
Session start/end times without a UTC offset are interpreted as Seoul wall-clock time (Asia/Seoul).
Upload images first (create_image_upload + PUT + complete_image_upload when you can run shell commands, otherwise import_image_from_url) and pass the returned URL to create/update tools.
Update tools are partial: send only the fields you want to change.`

export function buildMcpServer(actor: Actor, tools: ToolDefinition[]) {
  const server = new McpServer(
    { name: 'gyms', version: '1.0.0' },
    { instructions: INSTRUCTIONS }
  )

  for (const tool of tools.filter((candidate) =>
    isToolVisible(actor, candidate)
  )) {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.input,
        annotations: {
          readOnlyHint: tool.scope === 'gyms:read',
          destructiveHint: tool.scope === 'gyms:admin',
          openWorldHint: false,
          ...tool.annotations,
        },
      },
      async (input: unknown) => {
        const execute = async () => {
          try {
            return await tool.run(actor, input)
          } catch (error) {
            logger.error('mcp.tool', error, {
              tool: tool.name,
              userId: actor.userId,
            })
            return fail('INTERNAL', 'Unexpected server error.')
          }
        }

        const result =
          tool.scope === 'gyms:read'
            ? await execute()
            : await withAudit(
                actor,
                { tool: tool.name, targetId: tool.targetId },
                input,
                execute
              )
        return toCallToolResult(result)
      }
    )
  }

  return server
}

// 2026-07-28 요청은 네이티브, 2025 세대는 무상태 폴백이다. 라우트가 토큰 검증 후 authInfo.extra.actor를 넣는다.
export function createGymsMcpHandler(tools: ToolDefinition[]) {
  return createMcpHandler(({ authInfo }) => {
    const actor = authInfo?.extra?.actor as Actor | undefined
    if (!actor) {
      throw new Error('MCP request reached the server without an actor')
    }
    return buildMcpServer(actor, tools)
  })
}
