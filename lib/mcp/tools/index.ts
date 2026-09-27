import type { ToolDefinition } from '@/lib/mcp/registry'
import { whoami } from '@/lib/mcp/tools/context'
import { generationTools } from '@/lib/mcp/tools/generations'
import { memberTools, profileTools } from '@/lib/mcp/tools/members'
import { partTools } from '@/lib/mcp/tools/parts'

export const ALL_TOOLS: ToolDefinition[] = [
  whoami,
  ...generationTools,
  ...partTools,
  ...memberTools,
  ...profileTools,
]
