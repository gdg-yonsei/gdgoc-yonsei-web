import 'server-only'

import type { ToolAnnotations } from '@modelcontextprotocol/server'
import type { z } from 'zod'
import type {
  ActionType,
  ResourceType,
} from '@/lib/server/permission/handle-permission'
import { hasScope, roleCouldEver } from '@/lib/server/services/admin/authorize'
import type {
  Actor,
  Scope,
  ServiceResult,
} from '@/lib/server/services/admin/types'

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
  /** 감사 로그의 targetId. 성공 결과에서 대상 ID 를 꺼낸다. */
  targetId?: (data: unknown) => string | undefined
}

export function defineTool<S extends z.ZodType>(
  definition: ToolDefinition<S>
): ToolDefinition {
  return definition as unknown as ToolDefinition
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

/** 성공 결과의 `id` 를 감사 로그 대상으로 쓴다. */
export function idOf(data: unknown): string | undefined {
  const id = (data as { id?: unknown } | null)?.id
  return id === undefined || id === null ? undefined : String(id)
}
