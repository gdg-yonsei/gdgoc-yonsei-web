'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/admin/handle-permission'
import { forbidden, redirect } from 'next/navigation'
import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import db from '@/db'
import { projects } from '@/db/schema/projects'
import getSessionFormData from '@/lib/admin/get-session-form-data'
import { sessionValidation } from '@/lib/validations/session'
import { sessions } from '@/db/schema/sessions'
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
  const { name, description, mainImage, contentImages } =
    getSessionFormData(formData)

  try {
    // zod validation
    sessionValidation.parse({
      name,
      description,
      mainImage,
      contentImages,
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
    await db
      .insert(sessions)
      .values({
        name: name,
        description: description!,
        authorId: session.user.id,
        images: contentImages,
        mainImage: mainImage!,
      })
      .returning({ id: projects.id })

    // 캐시 업데이트
    revalidateTag('sessions')
  } catch (e) {
    // DB 에러 처리
    console.error(e)
    return { error: 'DB Update Error' }
  }

  redirect(`/admin/sessions`)
}
