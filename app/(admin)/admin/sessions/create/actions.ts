'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { forbidden, redirect } from 'next/navigation'
import { z } from 'zod'
import db from '@/db'
import getSessionFormData from '@/lib/server/form-data/get-session-form-data'
import { sessionValidation } from '@/lib/validations/session'
import { sessions } from '@/db/schema/sessions'
import { userToSession } from '@/db/schema/user-to-session'
import { revalidateCache } from '@/lib/server/cache'
/**
 * Create Session Action
 * @param prev - previous state for form error
 * @param formData - session data
 */
export async function createSessionAction(
  prev: { error: string },
  formData: FormData
) {
  const session = await auth()
  // 사용자가 session 를 수정할 권한이 있는지 확인
  if (!(await handlePermission(session?.user?.id, 'put', 'sessions'))) {
    return forbidden()
  }

  if (!session?.user?.id) {
    return { error: 'User not found' }
  }

  // form data 에서 part data 추출
  const {
    name,
    nameKo,
    description,
    descriptionKo,
    mainImage,
    contentImages,
    eventDate,
    location,
    locationKo,
    maxCapacity,
    openSession,
    partId,
    participantId,
  } = getSessionFormData(formData)

  try {
    // zod validation
    sessionValidation.parse({
      name,
      nameKo,
      description,
      descriptionKo,
      mainImage,
      contentImages,
      eventDate,
      location,
      locationKo,
      maxCapacity,
      openSession,
      partId,
      participantId,
    })
  } catch (err) {
    // zod validation 에러 처리
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0].message }
    }
  }

  try {
    if (!name || !description) {
      return { error: 'Name and Description are required' }
    }
    // session 생성 쿼리
    const createSession = await db
      .insert(sessions)
      .values({
        name: name,
        nameKo: nameKo!,
        description: description,
        descriptionKo: descriptionKo!,
        authorId: session.user.id,
        images: contentImages,
        ...(mainImage ? { mainImage: mainImage } : {}),
        eventDate: eventDate!,
        location: location!,
        locationKo: locationKo!,
        maxCapacity: maxCapacity,
        openSession: openSession,
        partId: Number(partId),
      })
      .returning({ id: sessions.id })

    // 참가자 생성 쿼리
    await db.insert(userToSession).values(
      participantId.map((id) => ({
        userId: id,
        sessionId: createSession[0].id,
      }))
    )

    // 캐시 업데이트
    revalidateCache('sessions')
  } catch (e) {
    // DB 에러 처리
    console.error(e)
    return { error: 'DB Update Error' }
  }

  redirect(`/admin/sessions`)
}
