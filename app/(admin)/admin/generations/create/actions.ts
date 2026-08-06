'use server'

import { generationValidation } from '@/lib/validations/generation'
import db from '@/db'
import { generations } from '@/db/schema/generations'
import { redirect } from 'next/navigation'
import getGenerationFormData from '@/lib/server/form-data/get-generation-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { invalidateGenerationPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import { requirePermission } from '@/lib/server/permission/require-permission'
import { parseActionInput } from '@/lib/server/actions/admin'

export async function createGenerationAction(
  _prev: { error: string },
  formData: FormData
) {
  // 사용자 generation 을 추가할 권한이 있는지 확인
  await requirePermission('post', 'generations')

  // form data 에서 generation data 추출 후 검증
  const parsed = parseActionInput(
    generationValidation,
    getGenerationFormData(formData)
  )
  if (!parsed.ok) {
    return { error: parsed.error }
  }

  const parsedGenerationData = parsed.data

  // generation data 쿼리
  try {
    await db
      .insert(generations)
      .values({
        name: parsedGenerationData.name,
        startDate: parsedGenerationData.startDate,
        endDate: parsedGenerationData.endDate,
      })
      .returning({
        id: generations.id,
      })

    invalidateGenerationPublicCache({
      nextGenerationName: parsedGenerationData.name,
    })
  } catch (e) {
    logger.error('admin.generations.create', e)
    return { error: 'DB Update Error' }
  }

  // generation 페이지로 이동
  redirect(await getLocalizedAdminPath('/admin/generations'))
}
