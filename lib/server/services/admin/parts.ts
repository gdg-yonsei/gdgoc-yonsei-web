/**
 * 파트 관리 서비스(목록, 상세, 생성, 수정, 삭제).
 *
 * 서비스 함수는 웹 Server Action과 MCP 도구가 함께 쓴다. 모두 같은 순서로 동작한다:
 * 권한 확인(`authorize`, 기수 접근) → 입력 검증(zod) → DB 쓰기 → 공개 캐시 무효화.
 * 결과는 예외 대신 `ServiceResult`(성공 `ok` / 실패 `fail`)로 돌려준다.
 */
import 'server-only'

import { and, eq, inArray } from 'drizzle-orm'
import type { z } from 'zod'
import { db } from '@/db'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'
import { invalidatePartPublicCache } from '@/lib/server/cache'
import { getPart } from '@/lib/server/fetcher/admin/get-part'
import {
  getParts,
  type AdminPartListItem,
} from '@/lib/server/fetcher/admin/get-parts'
import { uniqueStrings } from '@/lib/server/cache/utils'
import { logger } from '@/lib/server/logger'
import {
  authorize,
  canAccessGeneration,
} from '@/lib/server/services/admin/authorize'
import { resolveRequestedGenerationScope } from '@/lib/server/services/admin/generation-scope'
import { toPublicUser } from '@/lib/server/services/admin/public-user'
import {
  fail,
  fromZodError,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import {
  getGenerationNameById,
  getGenerationNameForPartId,
} from '@/lib/server/services/admin/cache-context'
import { partValidation } from '@/lib/validations/part'

/** 파트 입력(검증 전) 타입. */
export type PartInput = z.input<typeof partValidation>

const NOT_FOUND = 'Part not found'

type PartMembership = {
  userId: string
  partId: number
  userType: 'Core' | 'Primary' | 'Secondary'
}

function parsePartInput(input: unknown) {
  const parsed = partValidation.safeParse(input)
  return parsed.success ? ok(parsed.data) : fromZodError(parsed.error)
}

function buildMemberships(
  partId: number,
  membersList: string[],
  doubleBoardMembersList: string[],
  preservedIds: ReadonlySet<string> = new Set()
): PartMembership[] {
  return [
    ...membersList
      .filter((member) => !preservedIds.has(member))
      .map((userId) => ({ userId, partId, userType: 'Primary' as const })),
    ...doubleBoardMembersList
      .filter((member) => !preservedIds.has(member))
      .map((userId) => ({ userId, partId, userType: 'Secondary' as const })),
  ]
}

/** 범위(기수)의 파트 목록. */
export async function listParts(
  actor: Actor,
  { generation }: { generation?: number | 'all' } = {}
): Promise<ServiceResult<AdminPartListItem[]>> {
  const authorization = authorize(actor, 'get', 'partsPage')
  if (!authorization.ok) return authorization

  const resolved = await resolveRequestedGenerationScope(actor, generation)
  if (!resolved.ok) return resolved
  const scope = resolved.data
  if (!scope) return ok([])

  return ok(await getParts(scope))
}

async function loadPartDetail(partId: number) {
  const part = await getPart(partId)
  if (!part) return null

  const { usersToParts: memberships, generation, ...fields } = part
  return {
    ...fields,
    generationName: generation?.name ?? null,
    members: memberships.map((row) => ({
      ...toPublicUser(row.user),
      userType: row.userType,
    })),
  }
}

/** 파트 상세(기수, 구성원). */
export type PartDetail = NonNullable<Awaited<ReturnType<typeof loadPartDetail>>>

/** 파트 상세. 접근할 수 없는 기수의 파트면 FORBIDDEN. */
export async function getPartDetail(
  actor: Actor,
  partId: number
): Promise<ServiceResult<PartDetail>> {
  const authorization = authorize(actor, 'get', 'partsPage')
  if (!authorization.ok) return authorization

  const detail = await loadPartDetail(partId)
  if (!detail) return fail('NOT_FOUND', NOT_FOUND)
  if (!(await canAccessGeneration(actor, detail.generationsId))) {
    return fail('FORBIDDEN', 'You cannot view parts of this generation.')
  }
  return ok(detail)
}

/** 상세를 파트 입력 형태로 되돌린다(MCP 부분 수정 병합용). */
export function partToInput(detail: PartDetail): PartInput {
  return {
    name: detail.name,
    description: detail.description,
    displayOrder: detail.displayOrder,
    generationId: detail.generationsId ?? 0,
    membersList: detail.members
      .filter((member) => member.userType === 'Primary')
      .map((member) => member.id),
    doubleBoardMembersList: detail.members
      .filter((member) => member.userType === 'Secondary')
      .map((member) => member.id),
  }
}

/** 파트와 구성원 소속을 한 트랜잭션으로 만든다. */
export async function createPart(
  actor: Actor,
  input: unknown
): Promise<ServiceResult<{ id: number }>> {
  const authorization = authorize(actor, 'post', 'parts')
  if (!authorization.ok) return authorization

  const parsed = parsePartInput(input)
  if (!parsed.ok) return parsed

  const {
    name,
    description,
    generationId,
    displayOrder,
    membersList,
    doubleBoardMembersList,
  } = parsed.data

  if (!(await canAccessGeneration(actor, generationId))) {
    return fail('FORBIDDEN', 'You cannot create parts in this generation.')
  }

  try {
    const generation = await getGenerationNameById(generationId)

    // 파트 행과 구성원 소속은 함께 저장되거나 함께 실패해야 한다.
    const createdPart = await db.transaction(async (tx) => {
      const created = (
        await tx
          .insert(parts)
          .values({
            name,
            description,
            generationsId: generationId,
            displayOrder: displayOrder ?? 10,
          })
          .returning({ id: parts.id })
      )[0]

      if (!created) {
        throw new Error('Failed to create part')
      }

      const memberships = buildMemberships(
        created.id,
        membersList,
        doubleBoardMembersList
      )
      if (memberships.length > 0) {
        await tx.insert(usersToParts).values(memberships)
      }
      return created
    })

    invalidatePartPublicCache(generation?.name ? [generation.name] : [])

    return ok({ id: createdPart.id })
  } catch (e) {
    logger.error('admin.parts.create', e)
    return fail('INTERNAL', 'DB Update Error')
  }
}

/**
 * 파트 정보와 구성원을 고친다. 기수는 바꿀 수 없다.
 * 관리 화면에서 다루지 않는 Core 소속은 보존하고, 주 소속·겸임만 교체한다.
 */
export async function updatePart(
  actor: Actor,
  partId: number,
  input: unknown
): Promise<ServiceResult<{ id: number }>> {
  if (!Number.isInteger(partId)) return fail('NOT_FOUND', NOT_FOUND)

  const existingPart = await db.query.parts.findFirst({
    where: eq(parts.id, partId),
    columns: {
      generationsId: true,
    },
    with: { usersToParts: { columns: { userId: true, userType: true } } },
  })
  if (!existingPart) return fail('NOT_FOUND', NOT_FOUND)

  const authorization = authorize(actor, 'put', 'parts')
  if (!authorization.ok) return authorization

  if (!(await canAccessGeneration(actor, existingPart.generationsId))) {
    return fail('FORBIDDEN', 'You cannot manage parts of this generation.')
  }

  const parsed = parsePartInput(input)
  if (!parsed.ok) return parsed

  const {
    name,
    description,
    generationId,
    displayOrder,
    membersList,
    doubleBoardMembersList,
  } = parsed.data

  if (existingPart.generationsId !== generationId) {
    return fail(
      'VALIDATION',
      'Part generation cannot be changed from this screen.'
    )
  }

  try {
    const preservedIds = new Set(
      (existingPart.usersToParts ?? [])
        .filter(
          (membership) =>
            membership.userType !== 'Primary' &&
            membership.userType !== 'Secondary'
        )
        .map((membership) => membership.userId)
    )

    const previousGenerationName = await getGenerationNameForPartId(partId)
    const nextGeneration = await getGenerationNameById(generationId)

    // 파트 정보와 구성원 교체(삭제 후 재삽입)는 하나의 트랜잭션으로 처리한다.
    // 중간에 실패하면 구성원이 비어 버린 파트가 남지 않는다.
    await db.transaction(async (tx) => {
      await tx
        .update(parts)
        .set({
          name,
          description: description,
          generationsId: generationId,
          ...(displayOrder === undefined ? {} : { displayOrder }),
          updatedAt: new Date(),
        })
        .where(eq(parts.id, partId))
      // Core 및 관리 화면에서 편집하지 않는 소속은 보존한다.
      await tx
        .delete(usersToParts)
        .where(
          and(
            eq(usersToParts.partId, partId),
            inArray(usersToParts.userType, ['Primary', 'Secondary'])
          )
        )

      const memberships = buildMemberships(
        partId,
        membersList,
        doubleBoardMembersList,
        preservedIds
      )
      if (memberships.length > 0) {
        await tx.insert(usersToParts).values(memberships)
      }
    })

    invalidatePartPublicCache(
      uniqueStrings([previousGenerationName, nextGeneration?.name])
    )
  } catch (e) {
    logger.error('admin.parts.update', e, {
      partId,
    })
    return fail('INTERNAL', 'DB Update Error')
  }

  return ok({ id: partId })
}

/** 파트를 지운다(LEAD 전용). */
export async function deletePart(
  actor: Actor,
  partId: number
): Promise<ServiceResult<{ id: number }>> {
  const authorization = authorize(actor, 'delete', 'parts')
  if (!authorization.ok) return authorization
  if (!Number.isInteger(partId) || partId < 1) {
    return fail('NOT_FOUND', 'Data not found')
  }

  const existingPart = await db.query.parts.findFirst({
    where: eq(parts.id, partId),
    columns: { generationsId: true },
  })
  if (!existingPart) return fail('NOT_FOUND', 'Data not found')

  if (!(await canAccessGeneration(actor, existingPart.generationsId))) {
    return fail('FORBIDDEN', 'You cannot manage parts of this generation.')
  }

  try {
    const previousPartGenerationName = await getGenerationNameForPartId(partId)

    await db.delete(parts).where(eq(parts.id, partId))
    invalidatePartPublicCache(
      previousPartGenerationName ? [previousPartGenerationName] : []
    )
  } catch (err) {
    logger.error('admin.delete-resource', err, {
      dataType: 'parts',
      dataId: partId,
    })
    return fail('INTERNAL', 'DB Delete Error')
  }

  return ok({ id: partId })
}
