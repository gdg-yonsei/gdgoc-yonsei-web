/**
 * 모든 MCP 도구 목록. 새 도구를 만들면 여기에 추가한다.
 */
import 'server-only'

import type { ToolDefinition } from '@/lib/mcp/registry'
import { whoami } from '@/lib/mcp/tools/context'
import { generationTools } from '@/lib/mcp/tools/generations'
import { imageTools } from '@/lib/mcp/tools/images'
import { memberTools, profileTools } from '@/lib/mcp/tools/members'
import { partTools } from '@/lib/mcp/tools/parts'
import { projectTools } from '@/lib/mcp/tools/projects'
import { sessionTools } from '@/lib/mcp/tools/sessions'

/** 등록 순서가 도구 목록 순서다. `whoami`를 맨 앞에 둔다. */
export const ALL_TOOLS: ToolDefinition[] = [
  whoami,
  ...generationTools,
  ...partTools,
  ...memberTools,
  ...profileTools,
  ...projectTools,
  ...sessionTools,
  ...imageTools,
]
