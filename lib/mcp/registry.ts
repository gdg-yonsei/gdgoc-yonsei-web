/**
 * MCP 도구 정의와 노출 규칙.
 *
 * 도구마다 필요한 스코프와 "이 역할이 이 도구를 쓸 수 있는지" 판단(`gate`)을 함께 정의한다.
 * 연결한 사용자가 쓸 수 없는 도구는 목록에도 보이지 않는다.
 */
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

/**
 * MCP 도구 하나의 정의.
 * - scope: 필요한 OAuth 스코프
 * - gate: 노출 조건(역할 정책)
 * - input: zod 입력 스키마(설명이 도구 문서가 된다)
 * - run: 서비스 함수를 부르는 실행부
 */
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

/** 도구 정의의 입력 타입을 추론하기 위한 헬퍼(값은 그대로 돌려준다). */
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
