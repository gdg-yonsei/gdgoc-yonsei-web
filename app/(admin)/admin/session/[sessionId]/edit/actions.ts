'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import { forbidden, redirect } from 'next/navigation'
import { z } from 'zod'
import db from '@/db'
import { sessions } from '@/db/schema/sessions'
import { eq } from 'drizzle-orm'
import { revalidateTag } from 'next/cache'
import r2Client from '@/lib/admin/r2-client'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { sessionValidation } from '@/lib/validations/session'
import getSessionFormData from '@/lib/admin/get-session-form-data'

/**
 * Update Project Action
 * @param sessionId - project id
 * @param prevState - previous state for form error
 * @param formData - project data
 */
export async function updateSessionAction(
  sessionId: string,
  prevState: { error: string },
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
    generationId,
    eventDate,
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
      generationId,
      eventDate,
    })
  } catch (err) {
    // zod validation 에러 처리
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0].message }
    }
  }

  try {
    // 삭제된 이미지 R2에서 삭제
    const prevImages = (
      await db
        .select({ images: sessions.images, mainImage: sessions.mainImage })
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1)
    )[0]

    const toDeleteImages = prevImages.images.filter(
      (prevImage) => !contentImages.includes(prevImage)
    )
    const deleteImagePromises = []

    if (prevImages.mainImage !== mainImage) {
      toDeleteImages.push(prevImages.mainImage)
    }

    for (const imageUrl of toDeleteImages) {
      deleteImagePromises.push(
        r2Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: imageUrl.replace(process.env.NEXT_PUBLIC_IMAGE_URL!, ''),
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
        description: description!,
        descriptionKo: descriptionKo!,
        images: contentImages,
        mainImage: mainImage!,
        updatedAt: new Date(),
        generationId: Number(generationId),
        eventDate: eventDate!,
      })
      .where(eq(sessions.id, sessionId))

    // 캐시 업데이트
    revalidateTag('sessions')
  } catch (e) {
    // DB 업데이트 오류 발생 시 오류 반환
    console.error(e)
    return { error: 'DB Update Error' }
  }
  // 성공 시 해당 project 로 이동
  redirect(`/admin/session/${sessionId}`)
}
