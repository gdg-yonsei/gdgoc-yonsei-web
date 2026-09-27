import { z } from 'zod'
import {
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'

export const listArgs = {
  generationId: z
    .number()
    .int()
    .positive()
    .optional()
    .describe(
      'Generation to list. Omit for the default: all generations for LEAD, your latest generation otherwise. Valid ids come from whoami.'
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(200)
    .default(50)
    .describe('Page size (1-200).'),
  cursor: z
    .string()
    .regex(/^\d+$/)
    .optional()
    .describe('nextCursor from the previous page.'),
}

export function paginate<T>(items: T[], limit: number, cursor?: string) {
  const offset = cursor ? Number(cursor) : 0
  const next = offset + limit
  return {
    items: items.slice(offset, next),
    nextCursor: next < items.length ? String(next) : null,
    total: items.length,
  }
}

/** 목록 도구의 기수 인자. LEAD 가 생략하면 전 기수, 그 외는 서비스 기본값(최신 접근 기수). */
export function generationArg(
  actor: Actor,
  generationId?: number
): number | 'all' | undefined {
  return generationId ?? (actor.role === 'LEAD' ? 'all' : undefined)
}

export async function listPage<T>(
  result: Promise<ServiceResult<T[]>>,
  limit: number,
  cursor?: string
) {
  const resolved = await result
  return resolved.ok ? ok(paginate(resolved.data, limit, cursor)) : resolved
}

/** undefined 인 키를 뺀 패치를 현재 값 위에 덮는다(부분 수정). */
export function mergePatch<T extends object>(
  current: T,
  patch: Record<string, unknown>
): T {
  return {
    ...current,
    ...Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined)
    ),
  }
}

/** 상세 조회 → 입력 형태 변환 → 패치 병합 → 수정 서비스 호출. */
export async function patchWith<Detail, Input extends object, Out>(
  load: Promise<ServiceResult<Detail>>,
  toInput: (detail: Detail) => Input,
  patch: Record<string, unknown>,
  save: (input: Input) => Promise<ServiceResult<Out>>
): Promise<ServiceResult<Out>> {
  const current = await load
  if (!current.ok) return current
  return save(mergePatch(toInput(current.data), patch))
}

export const imageUrl = z
  .string()
  .url()
  .describe('Image URL returned by complete_image_upload or import_image_from_url.')
