'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { forbidden, redirect } from 'next/navigation'
import { z } from 'zod'
import db from '@/db'
import { sessions } from '@/db/schema/sessions'
import { eq } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'
import r2Client from '@/lib/server/r2-client'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { sessionValidation } from '@/lib/validations/session'
import getSessionFormData from '@/lib/server/form-data/get-session-form-data'
import { userToSession } from '@/db/schema/user-to-session'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { getR2BucketEnv } from '@/lib/server/env'
import { invalidateSessionPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import {
  getGenerationNameForPartId,
  getSessionCacheContext,
} from '@/lib/server/services/cache-context'
import { normalizeR2ImageObjectKey } from '@/lib/server/r2-object-key'

/**
 * Update Project Action
 * @param sessionId - project id
 * @param prevState - previous state for form error
 * @param formData - project data
 */
export async function updateSessionAction(
  sessionId: string,
  _prevState: { error: string },
  formData: FormData
) {
  const session = await auth()
  // 사용자가 project 를 수정할 권한이 있는지 확인
  if (
    !(await handlePermission(session?.user?.id, 'put', 'sessions', sessionId))
  ) {
    return forbidden()
  }

  // form data 에서 session data 추출
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
    // zod validation
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
    // zod validation 에러 처리
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0]?.message ?? 'Validation error' }
    }
  }

  try {
    const bucketEnv = getR2BucketEnv()
    const previousSession = await getSessionCacheContext(sessionId)
    const existingSession = await db.query.sessions.findFirst({
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
    })

    const selectedPart = await db.query.parts.findFirst({
      where: eq(parts.id, Number(partId)),
      columns: {
        generationsId: true,
      },
    })

    if (
      !existingSession?.part?.generationsId ||
      existingSession.part.generationsId !== selectedPart?.generationsId
    ) {
      return { error: 'Session generation cannot be changed from this screen.' }
    }

    // 삭제된 이미지 R2에서 삭제
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

    const toDeleteImages = prevImages.images.filter(
      (prevImage) => !contentImages.includes(prevImage)
    )
    const deleteImagePromises = []

    if (prevImages.mainImage !== mainImage) {
      toDeleteImages.push(prevImages.mainImage)
    }

    for (const imageUrl of toDeleteImages) {
      const imageKey = normalizeR2ImageObjectKey(imageUrl, 'sessions')
      if (!imageKey) {
        continue
      }

      deleteImagePromises.push(
        r2Client.send(
          new DeleteObjectCommand({
            Bucket: bucketEnv.R2_BUCKET_NAME,
            Key: imageKey,
          })
        )
      )
    }

    await Promise.all(deleteImagePromises)

    // project 업데이트
    await db
      .update(sessions)
      .set({
        name: name!,
        nameKo: nameKo!,
        description: description
          ? description.replaceAll('<', '').replaceAll('>', '')
          : '',
        descriptionKo: descriptionKo
          ? descriptionKo.replaceAll('<', '').replaceAll('>', '')
          : '',
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

    // delete previous participants
    await db.delete(userToSession).where(eq(userToSession.sessionId, sessionId))

    // create new participants
    await db.insert(userToSession).values(
      participantId.map((participant) => ({
        userId: participant,
        sessionId: sessionId,
      }))
    )

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
  // 성공 시 해당 project 로 이동
  redirect(await getLocalizedAdminPath(`/admin/sessions/${sessionId}`))
}
