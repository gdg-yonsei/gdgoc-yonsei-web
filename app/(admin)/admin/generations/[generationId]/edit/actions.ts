'use server'

import db from '@/db'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { requirePermission } from '@/lib/server/permission/require-permission'
import { generations } from '@/db/schema/generations'
import { generationValidation } from '@/lib/validations/generation'
import getGenerationFormData from '@/lib/server/form-data/get-generation-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { invalidateGenerationPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import { parseActionInput } from '@/lib/server/actions/admin'

/**
 * Update Generation Action
 * @param generationId - generation id
 * @param prevState - previous state for form error
 * @param formData - generation data
 */
export async function updateGenerationAction(
  generationId: string,
  _prevState: { error: string },
  formData: FormData
) {
  // 사용자 권한 확인
  await requirePermission('put', 'generations', generationId)

  // form data 에서 generation data 추출 후 검증
  const parsed = parseActionInput(
    generationValidation,
    getGenerationFormData(formData)
  )
  if (!parsed.ok) {
    return { error: parsed.error }
  }

  const parsedGenerationData = parsed.data

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
