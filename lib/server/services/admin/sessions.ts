import 'server-only'

import { and, eq, sql } from 'drizzle-orm'
import type { z } from 'zod'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { parts } from '@/db/schema/parts'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { users } from '@/db/schema/users'
import {
  deleteRemovedR2Images,
  insertRowsIfAny,
  replaceRelationRows,
  stripHtmlCharacters,
} from '@/lib/server/actions/admin'
import { invalidateSessionPublicCache } from '@/lib/server/cache'
import deleteR2Images from '@/lib/server/delete-r2-images'
import { getSession } from '@/lib/server/fetcher/admin/get-session'
import {
  getSessions,
  type AdminSessionListItem,
} from '@/lib/server/fetcher/admin/get-sessions'
import { logger } from '@/lib/server/logger'
import { isUuid } from '@/lib/server/queries/public/uuid'
import { normalizeR2ImageObjectKey } from '@/lib/server/r2-object-key'
import {
  authorize,
  canAccessGeneration,
} from '@/lib/server/services/admin/authorize'
import { resolveGenerationScope } from '@/lib/server/services/admin/generation-scope'
import { toPublicUser } from '@/lib/server/services/admin/public-user'
import {
  fail,
  fromZodError,
  ok,
  type Actor,
  type ServiceResult,
} from '@/lib/server/services/admin/types'
import {
  getGenerationNameForPartId,
  getSessionCacheContext,
} from '@/lib/server/services/cache-context'
import { sessionWallClockNow } from '@/lib/site/datetime'
import { sessionValidation } from '@/lib/validations/session'

export type SessionInput = z.input<typeof sessionValidation>

const NOT_FOUND = 'Session not found'

class SessionFullError extends Error {}

function parseSessionInput(input: unknown) {
  const parsed = sessionValidation.safeParse(input)
  return parsed.success
    ? ok(parsed.data)
    : fromZodError(parsed.error)
}

export async function listSessions(
  actor: Actor,
  { generation }: { generation?: number | 'all' } = {}
): Promise<ServiceResult<AdminSessionListItem[]>> {
  const authorization = authorize(actor, 'get', 'sessionsPage')
  if (!authorization.ok) return authorization

  const scope = await resolveGenerationScope(actor, generation)
  if (!scope) return ok([])

  return ok(await getSessions(scope))
}

async function loadSessionDetail(sessionId: string) {
  const session = await getSession(sessionId)
  if (!session) return null

  const { userToSession: participants, author, part, ...fields } = session
  return {
    ...fields,
    part: part
      ? {
          id: part.id,
          name: part.name,
          generationId: part.generationsId,
          generationName: part.generation?.name ?? null,
        }
      : null,
    author: author ? toPublicUser(author) : null,
    participants: participants.map((row) => toPublicUser(row.user)),
  }
}

export type SessionDetail = NonNullable<
  Awaited<ReturnType<typeof loadSessionDetail>>
>

export async function getSessionDetail(
  actor: Actor,
  sessionId: string
): Promise<ServiceResult<SessionDetail>> {
  const authorization = authorize(actor, 'get', 'sessionsPage')
  if (!authorization.ok) return authorization

  const detail = await loadSessionDetail(sessionId)
  return detail ? ok(detail) : fail('NOT_FOUND', NOT_FOUND)
}

/** 상세 조회 결과를 세션 검증 스키마의 입력 형태로 되돌린다(부분 수정 병합용). */
export function sessionToInput(detail: SessionDetail): SessionInput {
  return {
    name: detail.name,
    nameKo: detail.nameKo,
    description: detail.description ?? '',
    descriptionKo: detail.descriptionKo ?? '',
    mainImage: detail.mainImage,
    contentImages: detail.images,
    location: detail.location ?? '',
    locationKo: detail.locationKo ?? '',
    maxCapacity: detail.maxCapacity ?? 1,
    internalOpen: detail.internalOpen ?? false,
    publicOpen: detail.publicOpen ?? false,
    startAt: detail.startAt as Date,
    endAt: detail.endAt as Date,
    partId: String(detail.partId ?? ''),
    participantId: detail.participants.map((participant) => participant.id),
    type: detail.type ?? 'Part Session',
    category: detail.category,
    displayOnWebsite: detail.displayOnWebsite ?? true,
  }
}

async function sendNewSessionEmails({
  sessionId,
  partId,
  participantId,
  name,
  locationKo,
  startAt,
  endAt,
  maxCapacity,
}: {
  sessionId: string
  partId: number
  participantId: string[]
  name: string
  locationKo: string
  startAt: Date
  endAt: Date
  maxCapacity: number
}) {
  const partGeneration = await db.query.parts.findFirst({
    where: eq(parts.id, partId),
    with: {
      generation: true,
    },
  })

  if (!partGeneration?.generationsId) {
    return
  }

  const generationUsers = await db.query.generations.findFirst({
    where: eq(generations.id, Number(partGeneration.generationsId)),
    with: {
      parts: {
        with: {
          usersToParts: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  })

  const userEmailList: string[] = []
  generationUsers?.parts.forEach((part) => {
    part.usersToParts.forEach((userToPart) => {
      if (
        !participantId.includes(userToPart.userId) &&
        userToPart.user.email &&
        userToPart.user.sessionNotiEmail
      ) {
        userEmailList.push(userToPart.user.email)
      }
    })
  })

  const [{ Resend }, { default: NewSession }, { getResendEnv, getSiteEnv }] =
    await Promise.all([
      import('resend'),
      import('@/emails/new-session'),
      import('@/lib/server/env'),
    ])
  const resend = new Resend(getResendEnv().RESEND_API_KEY)
  const siteEnv = getSiteEnv()

  await Promise.all(
    userEmailList.map((email) =>
      resend.emails.send({
        from: 'GDGoC Yonsei <gdgoc.yonsei@moveto.kr>',
        to: email,
        subject: `[GDGoC Yonsei] ${name} 세션 참가 신청`,
        react: NewSession({
          session: {
            name,
            location: locationKo,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            leftCapacity: maxCapacity - participantId.length,
          },
          part: partGeneration.name,
          generation: generationUsers?.name || '',
          registerUrl: `${siteEnv.NEXT_PUBLIC_SITE_URL}/admin/sessions/${sessionId}/register`,
        }),
      })
    )
  )
}

export async function createSession(
  actor: Actor,
  input: unknown
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

  let sessionId = ''
  try {
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
      !selectedPart?.generationsId ||
      !(await canAccessGeneration(actor, selectedPart.generationsId))
    ) {
      return fail(
        'FORBIDDEN',
        'The selected part does not belong to the current generation scope.'
      )
    }

    const createSessionRows = await db
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

    const createdSession = createSessionRows[0]
    if (!createdSession) {
      throw new Error('Failed to create session')
    }

    await insertRowsIfAny(
      participantId.map((id) => ({
        userId: id,
        sessionId: createdSession.id,
      })),
      (rows) => db.insert(userToSession).values(rows)
    )

    sessionId = createdSession.id

    invalidateSessionPublicCache({
      sessionId,
      nextGenerationName,
    })
  } catch (e) {
    logger.error('admin.sessions.create', e)
    return fail('INTERNAL', 'DB Update Error')
  }

  // endAt 은 Seoul 벽시계를 UTC 라벨로 저장한 값이다.
  if (internalOpen && endAt > sessionWallClockNow()) {
    try {
      await sendNewSessionEmails({
        sessionId,
        partId: Number(partId),
        participantId,
        name,
        locationKo,
        startAt,
        endAt,
        maxCapacity,
      })
    } catch (e) {
      // 세션은 이미 만들어졌다 — 메일 실패로 생성을 실패 처리하면
      // 호출자가 재시도해 세션이 중복된다.
      logger.error('admin.sessions.create.email', e, { sessionId })
    }
  }

  return ok({ id: sessionId })
}

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

  if (!(await canAccessGeneration(actor, existingSession.part?.generationsId))) {
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

  try {
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

    await deleteRemovedR2Images({
      previousImages: prevImages.images,
      nextImages: contentImages,
      previousMainImage: prevImages.mainImage,
      nextMainImage: mainImage,
      prefix: 'sessions',
    })

    await db
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
        db.delete(userToSession).where(eq(userToSession.sessionId, sessionId)),
      rows: participantId.map((participant) => ({
        userId: participant,
        sessionId,
      })),
      insertRows: (rows) => db.insert(userToSession).values(rows),
    })

    const nextGenerationName = await getGenerationNameForPartId(Number(partId))

    invalidateSessionPublicCache({
      sessionId,
      previousGenerationName: previousSession.generationName,
      nextGenerationName,
    })
  } catch (e) {
    logger.error('admin.sessions.update', e, {
      sessionId,
    })
    return fail('INTERNAL', 'DB Update Error')
  }

  return ok({ id: sessionId })
}

export async function registerForSession(
  actor: Actor,
  sessionId: string
): Promise<ServiceResult<{ sessionId: string }>> {
  if (!isUuid(sessionId)) return fail('NOT_FOUND', NOT_FOUND)

  // 사용자가 session에 등록할 권한이 있는지 확인
  const authorization = authorize(actor, 'get', 'sessionsPage')
  if (!authorization.ok) return authorization

  const sessionData = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    with: {
      author: true,
      userToSession: true,
    },
  })

  if (!sessionData) return fail('NOT_FOUND', NOT_FOUND)

  // endAt 은 Seoul 벽시계를 UTC 라벨로 저장한 값이다.
  if (
    !(sessionData.internalOpen || sessionData.publicOpen) ||
    (sessionData.endAt !== null && sessionData.endAt <= sessionWallClockNow())
  ) {
    return fail('FORBIDDEN', 'This session is not open for registration.')
  }

  if (
    sessionData.userToSession.some(
      (participant) => participant.userId === actor.userId
    )
  ) {
    return fail('CONFLICT', 'Already registered')
  }

  // 세션 행을 잠가 동시 등록이 maxCapacity 를 초과하지 않도록 한다.
  try {
    await db.transaction(async (tx) => {
      const locked = await tx
        .select({ maxCapacity: sessions.maxCapacity })
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .for('update')

      const countRows = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(userToSession)
        .where(eq(userToSession.sessionId, sessionId))

      const maxCapacity = locked[0]?.maxCapacity ?? 0
      const count = countRows[0]?.count ?? 0
      if (maxCapacity <= count) {
        throw new SessionFullError()
      }

      await tx.insert(userToSession).values({
        userId: actor.userId,
        sessionId: sessionId,
      })
    })
  } catch (e) {
    if (e instanceof SessionFullError) {
      return fail('CONFLICT', 'Session is full')
    }
    logger.error('admin.sessions.register', e, {
      sessionId,
      userId: actor.userId,
    })
    return fail('INTERNAL', 'Registration failed')
  }

  // 알림 메일은 트랜잭션 커밋 뒤에 보낸다 — 트랜잭션 안에서 외부 API 를
  // 호출하면 메일 지연이 잠금을 붙잡고, 실패 시 등록이 롤백된다.
  if (sessionData.author?.email) {
    try {
      const [{ Resend }, { default: NewParticipant }, { getResendEnv }] =
        await Promise.all([
          import('resend'),
          import('@/emails/new-participant'),
          import('@/lib/server/env'),
        ])
      const userData = await db.query.users.findFirst({
        where: eq(users.id, actor.userId),
      })
      const resend = new Resend(getResendEnv().RESEND_API_KEY)
      await resend.emails.send({
        from: 'GDGoC Yonsei <gdgoc.yonsei@moveto.kr>',
        to: sessionData.author.email,
        subject: `[GDGoC Yonsei] 새로운 참가자가 등록했습니다.`,
        react: NewParticipant({
          session: {
            name: sessionData.nameKo,
            location: sessionData.locationKo!,
            startAt: sessionData.startAt
              ? sessionData.startAt?.toISOString()
              : 'TBD',
            endAt: sessionData.endAt ? sessionData.endAt?.toISOString() : 'TBD',
            leftCapacity: sessionData.maxCapacity
              ? sessionData.maxCapacity - sessionData.userToSession.length - 1
              : 0,
          },
          participantName: userData?.name ? userData?.name : '',
        }),
      })
    } catch (e) {
      // 등록은 이미 성공 — 메일 실패는 로깅만 한다.
      logger.error('admin.sessions.register.email', e, {
        sessionId,
        userId: actor.userId,
      })
    }
  }

  return ok({ sessionId })
}

/**
 * 참가자 본인이 세션 등록을 취소한다.
 * 세션이 이미 끝난 뒤에는 이력을 지울 수 없다.
 */
export async function unregisterFromSession(
  actor: Actor,
  sessionId: string
): Promise<ServiceResult<{ sessionId: string }>> {
  const authorization = authorize(actor, 'get', 'sessionsPage')
  if (!authorization.ok) return authorization
  if (!isUuid(sessionId)) return fail('NOT_FOUND', NOT_FOUND)

  const sessionData = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    columns: { endAt: true },
  })
  if (!sessionData) return fail('NOT_FOUND', NOT_FOUND)

  // endAt 은 Seoul 벽시계를 UTC 라벨로 저장한 값이다.
  if (
    sessionData.endAt !== null &&
    sessionData.endAt <= sessionWallClockNow()
  ) {
    return fail('FORBIDDEN', 'The session has already ended.')
  }

  await db
    .delete(userToSession)
    .where(
      and(
        eq(userToSession.sessionId, sessionId),
        eq(userToSession.userId, actor.userId)
      )
    )

  return ok({ sessionId })
}

/**
 * 세션 작성자·코어 이상이 특정 참가자를 명단에서 제거한다.
 */
export async function removeSessionParticipant(
  actor: Actor,
  sessionId: string,
  userId: string
): Promise<ServiceResult<{ sessionId: string; userId: string }>> {
  // users.id 는 Better Auth 가 발급하는 임의 문자열이라 UUID 가 아닐 수 있다.
  // 삭제는 (sessionId, userId) 복합키에 한정되므로 형식 검증은 sessionId 만 한다.
  if (!isUuid(sessionId) || !userId) return fail('NOT_FOUND', NOT_FOUND)

  const sessionData = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
    columns: { authorId: true },
    with: { part: { columns: { generationsId: true } } },
  })
  if (!sessionData) return fail('NOT_FOUND', NOT_FOUND)

  // 세션 작성자 또는 sessions 수정 권한자만 참가자를 제거할 수 있다.
  const authorization = authorize(
    actor,
    'put',
    'sessions',
    sessionData.authorId
  )
  if (!authorization.ok) return authorization

  if (
    sessionData.authorId !== actor.userId &&
    !(await canAccessGeneration(actor, sessionData.part?.generationsId))
  ) {
    return fail('FORBIDDEN', 'You cannot manage sessions of this generation.')
  }

  await db
    .delete(userToSession)
    .where(
      and(
        eq(userToSession.sessionId, sessionId),
        eq(userToSession.userId, userId)
      )
    )

  return ok({ sessionId, userId })
}

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

  if (!(await canAccessGeneration(actor, sessionImageList.part?.generationsId))) {
    return fail('FORBIDDEN', 'You cannot manage sessions of this generation.')
  }

  try {
    const sessionCacheContext = await getSessionCacheContext(sessionId)
    const sessionImageKeys = [
      ...sessionImageList.images
        .map((image) => normalizeR2ImageObjectKey(image, 'sessions'))
        .filter(Boolean),
      normalizeR2ImageObjectKey(sessionImageList.mainImage, 'sessions'),
    ].filter(Boolean) as string[]

    if (!(await deleteR2Images(sessionImageKeys))) {
      return fail('INTERNAL', 'R2 Image Delete Error')
    }
    await db.delete(sessions).where(eq(sessions.id, sessionId))
    invalidateSessionPublicCache({
      sessionId,
      previousGenerationName: sessionCacheContext.generationName,
    })
  } catch (err) {
    logger.error('admin.delete-resource', err, {
      dataType: 'sessions',
      dataId: sessionId,
    })
    return fail('INTERNAL', 'DB Delete Error')
  }

  return ok({ id: sessionId })
}
