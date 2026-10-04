/**
 * 세션 생성·수정·삭제 서비스.
 *
 * 웹 Server Action과 MCP 도구가 함께 쓴다. 권한 확인 → 입력 검증 → DB 쓰기 →
 * 공개 캐시 무효화 순서로 동작하며, R2 이미지 정리와 알림 메일도 여기서 처리한다.
 */
import 'server-only'

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { parts } from '@/db/schema/parts'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import {
  insertRowsIfAny,
  replaceRelationRows,
  stripHtmlCharacters,
} from '@/lib/server/services/admin/shared'
import { deleteRemovedImages } from '@/lib/server/storage/r2'
import { invalidateSessionPublicCache } from '@/lib/server/cache'
import { runAfterResponse } from '@/lib/server/after-response'
import { logger } from '@/lib/server/logger'
import { withDbErrors } from '@/lib/server/services/admin/db-errors'
import { isUuid } from '@/lib/server/queries/public/uuid'
import { cleanupDeletedResource } from '@/lib/server/services/admin/deleted-resource-cleanup'
import {
  authorize,
  canAccessGeneration,
} from '@/lib/server/services/admin/authorize'
import {
  fail,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import {
  getGenerationNameForPartId,
  getSessionCacheContext,
} from '@/lib/server/services/admin/cache-context'
import { sessionWallClockNow } from '@/lib/format/datetime'
import {
  NOT_FOUND,
  parseSessionInput,
} from '@/lib/server/services/admin/sessions/shared'
import { sendNewSessionEmails } from '@/lib/server/services/admin/sessions/notifications'

/**
 * 세션과 참가자를 한 트랜잭션으로 만든다. 고른 파트의 기수에 접근할 수 있어야 한다.
 * 멤버 내부 신청이 열린 미래 세션이면 응답 뒤에 같은 기수 멤버에게 안내 메일을 보낸다.
 *
 * @param options.expectedGenerationId - 웹 폼이 선택한 기수. 파트가 다른 기수면 거절한다.
 */
export async function createSession(
  actor: Actor,
  input: unknown,
  options: {
    /** 웹 폼은 선택된 기수에서만 만든다. 파트가 그 기수가 아니면 거절한다. */
    expectedGenerationId?: number
  } = {}
): Promise<ServiceResult<{ id: string }>> {
  const authorization = authorize(actor, 'post', 'sessions')
  if (!authorization.ok) return authorization

  const parsed = parseSessionInput(input)
  if (!parsed.ok) return parsed

  const {
    name,
    nameKo,
    description,
    descriptionKo,
    mainImage,
    contentImages,
    startAt,
    endAt,
    location,
    locationKo,
    maxCapacity,
    internalOpen,
    publicOpen,
    partId,
    participantId,
    type,
    category,
    displayOnWebsite,
  } = parsed.data

  const created = await withDbErrors('admin.sessions.create', async () => {
    const [selectedPart, nextGenerationName] = await Promise.all([
      db.query.parts.findFirst({
        where: eq(parts.id, Number(partId)),
        columns: {
          generationsId: true,
          name: true,
        },
      }),
      getGenerationNameForPartId(Number(partId)),
    ])

    if (
      selectedPart?.generationsId &&
      options.expectedGenerationId !== undefined &&
      selectedPart.generationsId !== options.expectedGenerationId
    ) {
      return fail(
        'VALIDATION',
        'The selected part does not belong to the current generation scope.'
      )
    }

    if (
      !selectedPart?.generationsId ||
      !(await canAccessGeneration(actor, selectedPart.generationsId))
    ) {
      return fail(
        'FORBIDDEN',
        'The selected part does not belong to the current generation scope.'
      )
    }

    // 세션 행과 참가자 목록은 함께 저장되거나 함께 실패해야 한다.
    const createdSession = await db.transaction(async (tx) => {
      const created = (
        await tx
          .insert(sessions)
          .values({
            name,
            nameKo,
            description: stripHtmlCharacters(description),
            descriptionKo: stripHtmlCharacters(descriptionKo),
            authorId: actor.userId,
            images: contentImages,
            // mainImage 는 nullable 이지만 컬럼은 NOT NULL 이므로,
            // 값이 없으면 넘기지 않고 컬럼 기본값을 그대로 쓴다.
            ...(mainImage ? { mainImage } : {}),
            startAt,
            endAt,
            location,
            locationKo,
            maxCapacity,
            internalOpen,
            publicOpen,
            partId: Number(partId),
            displayOnWebsite,
            type,
            category,
          })
          .returning({ id: sessions.id })
      )[0]
      if (!created) {
        throw new Error('Failed to create session')
      }

      await insertRowsIfAny(
        participantId.map((id) => ({
          userId: id,
          sessionId: created.id,
        })),
        (rows) => tx.insert(userToSession).values(rows)
      )
      return created
    })

    invalidateSessionPublicCache({
      sessionId: createdSession.id,
      nextGenerationName,
    })
    return ok(createdSession.id)
  })
  if (!created.ok) return created
  const sessionId = created.data

  // endAt 은 Seoul 벽시계를 UTC 라벨로 저장한 값이다.
  if (internalOpen && endAt > sessionWallClockNow()) {
    // 세션은 이미 만들어졌으므로 메일은 응답 뒤에 보낸다. 메일 실패를 생성 실패로
    // 처리하면 호출자가 재시도해 세션이 중복되므로 로그만 남긴다.
    runAfterResponse(
      'admin.sessions.create.email',
      () =>
        sendNewSessionEmails({
          sessionId,
          partId: Number(partId),
          participantId,
          name,
          locationKo,
          startAt,
          endAt,
          maxCapacity,
        }),
      { sessionId }
    )
  }

  return ok({ id: sessionId })
}

/**
 * 세션을 고친다. 기수(파트의 기수)는 바꿀 수 없다.
 * 작성자는 기수와 무관하게 자기 세션을 고칠 수 있다. 커밋 뒤에 쓰지 않는 이미지를 지운다.
 */
export async function updateSession(
  actor: Actor,
  sessionId: string,
  input: unknown
): Promise<ServiceResult<{ id: string }>> {
  if (!isUuid(sessionId)) return fail('NOT_FOUND', NOT_FOUND)

  const existingSession = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    columns: { id: true, authorId: true },
    with: { part: { columns: { generationsId: true } } },
  })
  if (!existingSession) return fail('NOT_FOUND', NOT_FOUND)

  // dataOwnerId 는 세션 작성자 id 여야 한다 (sessionId 가 아니라).
  const authorization = authorize(
    actor,
    'put',
    'sessions',
    existingSession.authorId
  )
  if (!authorization.ok) return authorization

  // 작성자는 자기 세션을 기수와 무관하게 고칠 수 있다(프로젝트와 같은 규칙).
  if (
    existingSession.authorId !== actor.userId &&
    !(await canAccessGeneration(actor, existingSession.part?.generationsId))
  ) {
    return fail('FORBIDDEN', 'You cannot manage sessions of this generation.')
  }

  const parsed = parseSessionInput(input)
  if (!parsed.ok) return parsed

  const {
    name,
    nameKo,
    description,
    descriptionKo,
    contentImages,
    mainImage,
    startAt,
    endAt,
    internalOpen,
    publicOpen,
    location,
    locationKo,
    maxCapacity,
    partId,
    participantId,
    type,
    category,
    displayOnWebsite,
  } = parsed.data

  return withDbErrors(
    'admin.sessions.update',
    async () => {
      const [previousSession, selectedPart] = await Promise.all([
        getSessionCacheContext(sessionId),
        db.query.parts.findFirst({
          where: eq(parts.id, Number(partId)),
          columns: {
            generationsId: true,
          },
        }),
      ])

      if (
        !existingSession.part?.generationsId ||
        existingSession.part.generationsId !== selectedPart?.generationsId
      ) {
        return fail(
          'VALIDATION',
          'Session generation cannot be changed from this screen.'
        )
      }

      const prevImages = (
        await db
          .select({ images: sessions.images, mainImage: sessions.mainImage })
          .from(sessions)
          .where(eq(sessions.id, sessionId))
          .limit(1)
      )[0]

      if (!prevImages) {
        return fail('NOT_FOUND', NOT_FOUND)
      }

      // 세션 행과 참가자 교체는 하나의 트랜잭션으로 처리한다.
      await db.transaction(async (tx) => {
        await tx
          .update(sessions)
          .set({
            name,
            nameKo,
            description: stripHtmlCharacters(description),
            descriptionKo: stripHtmlCharacters(descriptionKo),
            images: contentImages,
            // mainImage 는 nullable 이지만 컬럼은 NOT NULL 이므로,
            // 값이 없으면 넘기지 않고 기존 값을 유지한다.
            ...(mainImage ? { mainImage } : {}),
            updatedAt: new Date(),
            location,
            locationKo,
            maxCapacity,
            internalOpen,
            publicOpen,
            partId: Number(partId),
            startAt,
            endAt,
            type,
            category,
            displayOnWebsite,
          })
          .where(eq(sessions.id, sessionId))

        await replaceRelationRows({
          deleteRows: () =>
            tx
              .delete(userToSession)
              .where(eq(userToSession.sessionId, sessionId)),
          rows: participantId.map((participant) => ({
            userId: participant,
            sessionId,
          })),
          insertRows: (rows) => tx.insert(userToSession).values(rows),
        })
      })

      // R2는 트랜잭션에 묶을 수 없으므로 커밋이 끝난 뒤 지운다. 실패해도 쓰지 않는
      // 이미지가 남을 뿐이라 수정은 성공으로 처리한다.
      await deleteRemovedImages({
        previousImages: prevImages.images,
        nextImages: contentImages,
        previousMainImage: prevImages.mainImage,
        nextMainImage: mainImage,
        prefix: 'sessions',
      }).catch((error: unknown) =>
        logger.error('admin.sessions.update.r2-cleanup', error, { sessionId })
      )

      const nextGenerationName = await getGenerationNameForPartId(
        Number(partId)
      )

      invalidateSessionPublicCache({
        sessionId,
        previousGenerationName: previousSession.generationName,
        nextGenerationName,
      })
      return ok({ id: sessionId })
    },
    { sessionId }
  )
}

/** 세션을 지운다. 행을 먼저 지우고, 커밋 뒤에 R2 이미지를 지운다. */
export async function deleteSession(
  actor: Actor,
  sessionId: string
): Promise<ServiceResult<{ id: string }>> {
  const authorization = authorize(actor, 'delete', 'sessions')
  if (!authorization.ok) return authorization
  if (!isUuid(sessionId)) return fail('NOT_FOUND', 'Data not found')

  const sessionImageList = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    columns: {
      images: true,
      mainImage: true,
    },
    with: { part: { columns: { generationsId: true } } },
  })

  if (!sessionImageList) {
    return fail('NOT_FOUND', 'Data not found')
  }

  if (
    !(await canAccessGeneration(actor, sessionImageList.part?.generationsId))
  ) {
    return fail('FORBIDDEN', 'You cannot manage sessions of this generation.')
  }

  return withDbErrors(
    'admin.delete-resource',
    async () => {
      const sessionCacheContext = await getSessionCacheContext(sessionId)
      await db.delete(sessions).where(eq(sessions.id, sessionId))
      await cleanupDeletedResource({
        dataType: 'sessions',
        dataId: sessionId,
        images: sessionImageList.images,
        mainImage: sessionImageList.mainImage,
        invalidateCache: () =>
          invalidateSessionPublicCache({
            sessionId,
            previousGenerationName: sessionCacheContext.generationName,
          }),
      })

      return ok({ id: sessionId })
    },
    { dataType: 'sessions', dataId: sessionId },
    'DB Delete Error'
  )
}
