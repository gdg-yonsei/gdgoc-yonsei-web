import 'server-only'

import { z } from 'zod'
import { getImageEnv } from '@/lib/server/env'
import { normalizeR2ImageObjectKey } from '@/lib/server/storage/object-key'
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

export async function listPage<T>(
  result: Promise<ServiceResult<T[]>>,
  limit: number,
  cursor?: string
) {
  const resolved = await result
  return resolved.ok ? ok(paginate(resolved.data, limit, cursor)) : resolved
}

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

// 이미지 필드는 해당 접두사의 우리 R2 URL만 받는다. 외부 호스트는 공개 이미지가 깨질 수 있다.
// 다른 항목의 공유 객체는 그 항목 수정 시 deleteRemovedImages가 지울 수 있다.
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
