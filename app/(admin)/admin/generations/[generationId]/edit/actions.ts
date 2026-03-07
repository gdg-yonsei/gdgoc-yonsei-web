'use server'

import db from '@/db'
import { forbidden, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import handlePermission from '@/lib/server/permission/handle-permission'
import { auth } from '@/auth'
import { generations } from '@/db/schema/generations'
import { generationValidation } from '@/lib/validations/generation'
import getGenerationFormData from '@/lib/server/form-data/get-generation-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { invalidateGenerationPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'

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

  // zod validation
  const parsedGenerationDataResult = generationValidation.safeParse({
    name,
    startDate,
    endDate,
  })

  if (!parsedGenerationDataResult.success) {
    console.log(parsedGenerationDataResult.error.issues)
    return { error: parsedGenerationDataResult.error.issues[0].message }
  }

  const parsedGenerationData = parsedGenerationDataResult.data

  // generation data 업데이트
  try {
    const previousGeneration = await db.query.generations.findFirst({
      where: eq(generations.id, Number(generationId)),
      columns: {
        name: true,
      },
    })

    await db
      .update(generations)
      .set({
        name: parsedGenerationData.name,
        startDate: parsedGenerationData.startDate,
        endDate: parsedGenerationData.endDate,
        updatedAt: new Date(),
      })
      .where(eq(generations.id, Number(generationId)))

    invalidateGenerationPublicCache({
      previousGenerationName: previousGeneration?.name,
      nextGenerationName: parsedGenerationData.name,
    })
  } catch (e) {
    logger.error('admin.generations.update', e, {
      generationId,
    })
    return { error: 'DB Update Error' }
  }

  // 성공 시 해당 generation 페이지로 이동
  redirect(await getLocalizedAdminPath(`/admin/generations/${generationId}`))
}
