import type { ToolDefinition } from '@/lib/mcp/registry'
import { whoami } from '@/lib/mcp/tools/context'

export const ALL_TOOLS: ToolDefinition[] = [whoami]
