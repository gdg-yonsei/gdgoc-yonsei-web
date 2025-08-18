'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import db from '@/db'
import { parts } from '@/db/schema/parts'
import { forbidden, redirect } from 'next/navigation'
import { z } from 'zod'
import { usersToParts } from '@/db/schema/users-to-parts'
import { partValidation } from '@/lib/validations/part'
import getPartFormData from '@/lib/server/form-data/get-part-form-data'
import { revalidateCache } from '@/lib/server/cache'

/**
 * Create Part Action
 * @param prev - previous state for form error
 * @param formData - part data
 */
export async function createPartAction(
  prev: { error: string },
  formData: FormData
) {
  const session = await auth()
  // 사용자가 part 를 수정할 권한이 있는지 확인
  if (!(await handlePermission(session?.user?.id, 'put', 'parts'))) {
    return forbidden()
  }

  // form data 에서 part data 추출
  const { name, description, generationId, membersList } =
    getPartFormData(formData)

  try {
    // zod validation
    partValidation.parse({ name, description, generationId, membersList })
  } catch (err) {
    // zod validation 에러 처리
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0].message }
    }
  }

  try {
    // 파트 생성 쿼리
    const createPart = await db
      .insert(parts)
      .values({
        name: name!,
        description: description,
        generationsId: generationId,
      })
      .returning({ id: parts.id })

    // 파트에 멤버가 있을 경우 멤버와 파트 연결 쿼리
    if (membersList.length > 0) {
      await db.insert(usersToParts).values(
        membersList.map((memberId) => ({
          userId: memberId,
          partId: createPart[0].id,
        }))
      )
    }

    // 캐시 업데이트
    revalidateCache(['parts', 'members'])
  } catch (e) {
    // DB 에러 처리
    console.error(e)
    return { error: 'DB Update Error' }
  }

  redirect(`/admin/parts`)
}
