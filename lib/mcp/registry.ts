// 역할·스코프가 허용하지 않는 도구는 목록에도 노출하지 않는다.
import 'server-only'

import type { ToolAnnotations } from '@modelcontextprotocol/server'
import type { z } from 'zod'
import type {
  ActionType,
  ResourceType,
} from '@/lib/server/permission/has-permission'
import { hasScope, roleCouldEver } from '@/lib/server/services/admin/authorize'
import type {
  Actor,
  Scope,
  ServiceResult,
} from '@/lib/server/services/admin/types'

// zod input의 설명은 MCP 도구 문서로 공개된다.
export type ToolDefinition<S extends z.ZodType = z.ZodType> = {
  name: string
  title: string
  description: string
  scope: Scope
  /** 이 중 하나라도 역할상 가능(소유권 무시)하면 도구 목록에 노출한다. */
  gate: Array<{ action: ActionType; resource: ResourceType }>
  input: S
  annotations?: ToolAnnotations
  run: (actor: Actor, input: z.output<S>) => Promise<ServiceResult<unknown>>
  targetId?: (data: unknown) => string | undefined
}

export function defineTool<S extends z.ZodType>(
  definition: ToolDefinition<S>
): ToolDefinition {
  return definition
}

/** 토큰 스코프와 역할 양쪽이 허락하는 도구만 보인다. 소유권은 호출 시점에 판정한다. */
export function isToolVisible(actor: Actor, tool: ToolDefinition): boolean {
  return (
    hasScope(actor, tool.scope) &&
    tool.gate.some((gate) =>
      roleCouldEver(actor.role, gate.action, gate.resource)
    )
  )
}

export function idOf(data: unknown): string | undefined {
  const id = (data as { id?: unknown } | null)?.id
  return typeof id === 'string' || typeof id === 'number'
    ? String(id)
    : undefined
}
