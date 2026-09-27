import 'server-only'

import { eq } from 'drizzle-orm'
import type { z } from 'zod'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { invalidateGenerationPublicCache } from '@/lib/server/cache'
import { getGeneration } from '@/lib/server/fetcher/admin/get-generation'
import { getGenerations } from '@/lib/server/fetcher/admin/get-generations'
import { logger } from '@/lib/server/logger'
import {
  authorize,
  canAccessGeneration,
  loadAccessibleGenerations,
} from '@/lib/server/services/admin/authorize'
import { toPublicUser } from '@/lib/server/services/admin/public-user'
import {
  fail,
  fromZodError,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import { generationValidation } from '@/lib/validations/generation'

export type GenerationInput = z.input<typeof generationValidation>

const NOT_FOUND = 'Generation not found'

function parseGenerationInput(input: unknown) {
  const parsed = generationValidation.safeParse(input)
  return parsed.success ? ok(parsed.data) : fromZodError(parsed.error)
}

/**
 * 사용자가 접근할 수 있는 기수 목록. 기수 관리 화면 권한과 별개로,
 * 다른 도구의 generationId 를 고르는 데 필요하므로 관리자 페이지 접근자 모두에게 연다.
 */
export async function listGenerations(
  actor: Actor
): Promise<ServiceResult<Awaited<ReturnType<typeof getGenerations>>>> {
  const authorization = authorize(actor, 'get', 'adminPage')
  if (!authorization.ok) return authorization

  const [accessible, rows] = await Promise.all([
    loadAccessibleGenerations(actor),
    getGenerations(),
  ])
  const accessibleIds = new Set(accessible.map((generation) => generation.id))
  return ok(rows.filter((row) => accessibleIds.has(row.id)))
}

async function loadGenerationDetail(generationId: number) {
  const generation = await getGeneration(generationId)
  if (!generation) return null

  const { parts, ...fields } = generation
  return {
    ...fields,
    parts: parts.map(({ usersToParts, ...part }) => ({
      ...part,
      members: usersToParts.map((row) => ({
        ...toPublicUser(row.user),
        userType: row.userType,
      })),
    })),
  }
}

export type GenerationDetail = NonNullable<
  Awaited<ReturnType<typeof loadGenerationDetail>>
>

export async function getGenerationDetail(
  actor: Actor,
  generationId: number
): Promise<ServiceResult<GenerationDetail>> {
  const authorization = authorize(actor, 'get', 'adminPage')
  if (!authorization.ok) return authorization

  if (!(await canAccessGeneration(actor, generationId))) {
    return fail('FORBIDDEN', 'You cannot view this generation.')
  }

  const detail = await loadGenerationDetail(generationId)
  return detail ? ok(detail) : fail('NOT_FOUND', NOT_FOUND)
}

export function generationToInput(detail: GenerationDetail): GenerationInput {
  return {
    name: detail.name,
    startDate: detail.startDate,
    endDate: detail.endDate,
  }
}

export async function createGeneration(
  actor: Actor,
  input: unknown
): Promise<ServiceResult<{ id: number }>> {
  const authorization = authorize(actor, 'post', 'generations')
  if (!authorization.ok) return authorization

  const parsed = parseGenerationInput(input)
  if (!parsed.ok) return parsed

  try {
    const created = await db
      .insert(generations)
      .values({
        name: parsed.data.name,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
      })
      .returning({
        id: generations.id,
      })

    invalidateGenerationPublicCache({
      nextGenerationName: parsed.data.name,
    })

    return ok({ id: created[0]?.id ?? 0 })
  } catch (e) {
    logger.error('admin.generations.create', e)
    return fail('INTERNAL', 'DB Update Error')
  }
}

export async function updateGeneration(
  actor: Actor,
  generationId: number,
  input: unknown
): Promise<ServiceResult<{ id: number }>> {
  const authorization = authorize(actor, 'put', 'generations')
  if (!authorization.ok) return authorization
  if (!Number.isInteger(generationId)) return fail('NOT_FOUND', NOT_FOUND)

  const parsed = parseGenerationInput(input)
  if (!parsed.ok) return parsed

  try {
    const previousGeneration = await db.query.generations.findFirst({
      where: eq(generations.id, generationId),
      columns: {
        name: true,
      },
    })
    if (!previousGeneration) return fail('NOT_FOUND', NOT_FOUND)

    await db
      .update(generations)
      .set({
        name: parsed.data.name,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        updatedAt: new Date(),
      })
      .where(eq(generations.id, generationId))

    invalidateGenerationPublicCache({
      previousGenerationName: previousGeneration.name,
      nextGenerationName: parsed.data.name,
    })
  } catch (e) {
    logger.error('admin.generations.update', e, {
      generationId,
    })
    return fail('INTERNAL', 'DB Update Error')
  }

  return ok({ id: generationId })
}

export async function deleteGeneration(
  actor: Actor,
  generationId: number
): Promise<ServiceResult<{ id: number }>> {
  const authorization = authorize(actor, 'delete', 'generations')
  if (!authorization.ok) return authorization
  if (!Number.isInteger(generationId) || generationId < 1) {
    return fail('NOT_FOUND', 'Data not found')
  }

  try {
    const previousGeneration = await db.query.generations.findFirst({
      where: eq(generations.id, generationId),
      columns: {
        name: true,
      },
    })

    await db.delete(generations).where(eq(generations.id, generationId))
    invalidateGenerationPublicCache({
      previousGenerationName: previousGeneration?.name,
    })
  } catch (err) {
    logger.error('admin.delete-resource', err, {
      dataType: 'generations',
      dataId: generationId,
    })
    return fail('INTERNAL', 'DB Delete Error')
  }

  return ok({ id: generationId })
}
