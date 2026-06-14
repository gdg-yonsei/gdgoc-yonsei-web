'use server'

import { redirect } from 'next/navigation'
import db from '@/db'
import getSessionFormData from '@/lib/server/form-data/get-session-form-data'
import { sessionValidation } from '@/lib/validations/session'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { eq } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'
import { generations } from '@/db/schema/generations'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { invalidateSessionPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import { getGenerationNameForPartId } from '@/lib/server/services/cache-context'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import {
  authorizeAdminAction,
  getZodActionError,
  insertRowsIfAny,
  stripHtmlCharacters,
} from '@/lib/server/actions/admin'

export async function createSessionAction(
  _prev: { error: string },
  formData: FormData
) {
  const authorization = await authorizeAdminAction({
    action: 'put',
    resource: 'sessions',
  })

  if (!authorization.ok) {
    return authorization.response
  }

  const { session } = authorization
  if (!session?.user?.id) {
    return { error: 'User not found' }
  }

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
    displayOnWebsite,
  } = getSessionFormData(formData)

  const resolvedScope = await resolveAdminGenerationScope(session.user.id)
  if (resolvedScope.scope?.kind !== 'generation') {
    return { error: 'Select a specific generation scope before creating data.' }
  }

  try {
    sessionValidation.parse({
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
      displayOnWebsite,
    })
  } catch (err) {
    const validationError = getZodActionError(err)
    if (validationError) {
      return { error: validationError }
    }
  }

  let sessionId = ''
  try {
    if (!name || !description) {
      return { error: 'Name and Description are required' }
    }

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
      selectedPart.generationsId !== resolvedScope.scope.generationId
    ) {
      return {
        error:
          'The selected part does not belong to the current generation scope.',
      }
    }

    const createSession = await db
      .insert(sessions)
      .values({
        name: name,
        nameKo: nameKo!,
        description: stripHtmlCharacters(description),
        descriptionKo: stripHtmlCharacters(descriptionKo),
        authorId: session.user.id,
        images: contentImages,
        ...(mainImage ? { mainImage: mainImage } : {}),
        startAt: startAt,
        endAt: endAt,
        location: location!,
        locationKo: locationKo!,
        maxCapacity: maxCapacity,
        internalOpen: internalOpen,
        publicOpen: publicOpen,
        partId: Number(partId),
        displayOnWebsite: displayOnWebsite,
        type: type,
      })
      .returning({ id: sessions.id })

    const createdSession = createSession[0]
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
    return { error: 'DB Update Error' }
  }

  if (internalOpen && endAt && endAt > new Date()) {
    const partGeneration = await db.query.parts.findFirst({
      where: eq(parts.id, Number(partId)),
      with: {
        generation: true,
      },
    })

    if (!partGeneration?.generationsId) {
      return { error: 'Email Error: Cannot found Part' }
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
              name: name,
              location: locationKo!,
              startAt: startAt ? startAt?.toISOString() : 'TBD',
              endAt: endAt ? endAt?.toISOString() : 'TBD',
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

  redirect(await getLocalizedAdminPath('/admin/sessions'))
}
