'use server'

import { revalidateTag } from 'next/cache'
import db from '@/db'
import { forbidden, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import handlePermission from '@/lib/admin/handle-permission'
import { auth } from '@/auth'
import { generations } from '@/db/schema/generations'
import { generationValidation } from '@/lib/validations/generation'
import { z } from 'zod'
import getGenerationFormData from '@/lib/admin/get-generation-form-data'

/**
 * Update Generation Action
 * @param generationId - generation id
 * @param prevState - previous state for form error
 * @param formData - generation data
 */
export async function updateGenerationAction(
  generationId: string,
  prevState: { error: string },
  formData: FormData
) {
  // 사용자 권한 확인
  const session = await auth()
  if (
    !(await handlePermission(
      session?.user?.id,
      'put',
      'generations',
      generationId
    ))
  ) {
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

  // generation data 업데이트
  try {
    await db
      .update(generations)
      .set({
        name: name!,
        startDate: startDate!,
        endDate: endDate ? endDate : null,
      })
      .where(eq(generations.id, Number(generationId)))

    // 캐시 업데이트
    revalidateTag('generations')
    revalidateTag('parts')
  } catch (e) {
    // DB 업데이트 오류 발생 시 오류 반환
    console.error(e)
    return { error: 'DB Update Error' }
  }

  // 성공 시 해당 generation 페이지로 이동
  redirect(`/admin/generations/${generationId}`)
}
