/**
 * MCP 도구 공용 입력 스키마와 헬퍼(목록 페이지네이션, 부분 수정 병합, 이미지 URL 검증).
 */
import 'server-only'

import { z } from 'zod'
import { getImageEnv } from '@/lib/server/env'
import { normalizeR2ImageObjectKey } from '@/lib/server/storage/object-key'
import {
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'

/** 목록 도구 공통 인자: 기수, 페이지 크기, 커서. */
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

/** 오프셋 커서 방식으로 목록 한 페이지를 자른다. `nextCursor`가 `null`이면 마지막 페이지다. */
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

/** 목록 서비스 결과를 페이지 형태로 바꾼다(실패는 그대로). */
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

/**
 * 이미지 필드: 업로드 도구가 돌려준 우리 R2 URL(해당 접두사)만 받는다.
 * 외부 URL 은 공개 페이지의 next/image 허용 호스트가 아니라 깨지고, 다른 항목의
 * 이미지를 가리키면 그 항목을 수정할 때 deleteRemovedImages가 공유 객체를 지운다.
 */
export function r2ImageUrl(prefix: 'sessions' | 'projects' | 'users') {
  return z
    .string()
    .url()
    .refine(
      (value) => {
        const base = getImageEnv()
          .NEXT_PUBLIC_IMAGE_URL.trim()
          .replace(/\/+$/, '')
        return (
          value.startsWith(`${base}/`) &&
          normalizeR2ImageObjectKey(value, prefix) !== null
        )
      },
      {
        message: `Use a URL returned by the image upload tools with target "${prefix}".`,
      }
    )
    .describe(
      `Image URL returned by complete_image_upload or import_image_from_url (target "${prefix}").`
    )
}
