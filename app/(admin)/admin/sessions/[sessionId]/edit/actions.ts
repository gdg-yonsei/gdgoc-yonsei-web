'use server'

import { redirect } from 'next/navigation'
import db from '@/db'
import { sessions } from '@/db/schema/sessions'
import { eq } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'
import { sessionValidation } from '@/lib/validations/session'
import getSessionFormData from '@/lib/server/form-data/get-session-form-data'
import { userToSession } from '@/db/schema/user-to-session'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { invalidateSessionPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import {
  getGenerationNameForPartId,
  getSessionCacheContext,
} from '@/lib/server/services/cache-context'
import {
  authorizeAdminAction,
  deleteRemovedR2Images,
  getZodActionError,
  replaceRelationRows,
  stripHtmlCharacters,
} from '@/lib/server/actions/admin'

export async function updateSessionAction(
  sessionId: string,
  _prevState: { error: string },
  formData: FormData
) {
  const authorization = await authorizeAdminAction({
    action: 'put',
    resource: 'sessions',
    dataOwnerId: sessionId,
  })

  if (!authorization.ok) {
    return authorization.response
  }

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
    displayOnWebsite,
  } = getSessionFormData(formData)

  try {
    sessionValidation.parse({
      name,
      nameKo,
      description,
      descriptionKo,
      contentImages,
      mainImage,
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

  try {
    const [previousSession, existingSession, selectedPart] = await Promise.all([
      getSessionCacheContext(sessionId),
      db.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
        columns: {
          id: true,
        },
        with: {
          part: {
            columns: {
              generationsId: true,
            },
          },
        },
      }),
      db.query.parts.findFirst({
        where: eq(parts.id, Number(partId)),
        columns: {
          generationsId: true,
        },
      }),
    ])

    if (
      !existingSession?.part?.generationsId ||
      existingSession.part.generationsId !== selectedPart?.generationsId
    ) {
      return { error: 'Session generation cannot be changed from this screen.' }
    }

    const prevImages = (
      await db
        .select({ images: sessions.images, mainImage: sessions.mainImage })
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1)
    )[0]

    if (!prevImages) {
      return { error: 'Session not found' }
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
        name: name!,
        nameKo: nameKo!,
        description: stripHtmlCharacters(description),
        descriptionKo: stripHtmlCharacters(descriptionKo),
        images: contentImages,
        mainImage: mainImage!,
        updatedAt: new Date(),
        location,
        locationKo,
        maxCapacity,
        internalOpen: internalOpen,
        publicOpen: publicOpen,
        partId: Number(partId)!,
        startAt: startAt!,
        endAt: endAt!,
        type: type,
        displayOnWebsite: displayOnWebsite,
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
    return { error: 'DB Update Error' }
  }

  redirect(await getLocalizedAdminPath(`/admin/sessions/${sessionId}`))
}
