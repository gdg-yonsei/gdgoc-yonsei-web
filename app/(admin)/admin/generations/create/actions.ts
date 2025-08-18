'use server'

import { auth } from '@/auth'
import handlePermission from '@/lib/server/permission/handle-permission'
import { generationValidation } from '@/lib/validations/generation'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { forbidden, redirect } from 'next/navigation'
import { z } from 'zod'
import getGenerationFormData from '@/lib/server/form-data/get-generation-form-data'
import { revalidateCache } from '@/lib/server/cache'

export async function createGenerationAction(
  prev: { error: string },
  formData: FormData
) {
  // 사용자 generation 을 추가할 권한이 있는지 확인
  const session = await auth()
  if (!(await handlePermission(session?.user?.id, 'post', 'generations'))) {
    return forbidden()
  }

  // form data 에서 generation data 추출
  const { name, startDate, endDate } = getGenerationFormData(formData)

  try {
    // zod validation
    generationValidation.parse({ name, startDate, endDate })
  } catch (err) {
    // 데이터 형식이 맞지 않을 경우 오류 반환
    if (err instanceof z.ZodError) {
      console.log(err.issues)
      return { error: err.issues[0].message }
    }
  }

  // generation data 쿼리
  try {
    await db
      .insert(generations)
      .values({
        name,
        startDate,
        endDate,
      })
      .returning({
        id: generations.id,
      })

    // 캐시 업데이트
    revalidateCache(['generations', 'parts'])
  } catch (e) {
    // DB 업데이트 오류
    console.error(e)
    return { error: 'DB Update Error' }
  }

  // generation 페이지로 이동
  redirect(`/admin/generations`)
}
