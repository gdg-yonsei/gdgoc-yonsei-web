import 'server-only'

import type { ToolDefinition } from '@/lib/mcp/registry'
import { whoami } from '@/lib/mcp/tools/context'
import { generationTools } from '@/lib/mcp/tools/generations'
import { imageTools } from '@/lib/mcp/tools/images'
import { memberTools, profileTools } from '@/lib/mcp/tools/members'
import { partTools } from '@/lib/mcp/tools/parts'
import { projectTools } from '@/lib/mcp/tools/projects'
import { sessionTools } from '@/lib/mcp/tools/sessions'

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
