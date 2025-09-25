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
import { eq } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'
import { generations } from '@/db/schema/generations'
import { Resend } from 'resend'
import NewSession from '@/emails/new-session'

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

  try {
    // zod validation
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
    // zod validation 에러 처리
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0].message }
    }
  }

  let sessionId = ''
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
        description: description.replaceAll('<', '').replaceAll('>', ''),
        descriptionKo: descriptionKo
          ? descriptionKo.replaceAll('<', '').replaceAll('>', '')
          : '',
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

    // 참가자 생성 쿼리
    await db.insert(userToSession).values(
      participantId.map((id) => ({
        userId: id,
        sessionId: createSession[0].id,
      }))
    )

    sessionId = createSession[0].id

    // 캐시 업데이트
    revalidateCache('sessions')
  } catch (e) {
    // DB 에러 처리
    console.error(e)
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

    const resend = new Resend(process.env.RESEND_API_KEY)

    for (let i = 0; i < userEmailList.length; i++) {
      await resend.emails.send({
        from: 'GDGoC Yonsei <gdgoc.yonsei@moveto.kr>',
        to: userEmailList[i],
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
          registerUrl: `https://gdgoc.yonsei.ac.kr/admin/sessions/${sessionId}/register`,
        }),
      })
    }
  }

  redirect(`/admin/sessions`)
}
