'use server'

import db from '@/db'
import { parts } from '@/db/schema/parts'
import { redirect } from 'next/navigation'
import { usersToParts } from '@/db/schema/users-to-parts'
import { partValidation } from '@/lib/validations/part'
import getPartFormData from '@/lib/server/form-data/get-part-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { invalidatePartPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import { getGenerationNameById } from '@/lib/server/services/cache-context'
import { resolveAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import { parseActionInput } from '@/lib/server/actions/admin'
import { requirePermission } from '@/lib/server/permission/require-permission'

/**
 * Create Part Action
 * @param prev - previous state for form error
 * @param formData - part data
 */
export async function createPartAction(
  _prev: { error: string },
  formData: FormData
) {
  // 사용자가 part 를 생성할 권한이 있는지 확인
  const session = await requirePermission('post', 'parts')

  if (!session?.user?.id) {
    return { error: 'User not found' }
  }

  // form data 에서 part data 추출
  const formValues = getPartFormData(formData)

  const resolvedScope = await resolveAdminGenerationScope(session.user.id)
  if (
    resolvedScope.scope?.kind !== 'generation' ||
    resolvedScope.scope.generationId !== formValues.generationId
  ) {
    return { error: 'Select a specific generation scope before creating data.' }
  }

  const parsed = parseActionInput(partValidation, formValues)
  if (!parsed.ok) {
    return { error: parsed.error }
  }

  const {
    name,
    description,
    generationId,
    membersList,
    doubleBoardMembersList,
  } = parsed.data

  try {
    const generation = await getGenerationNameById(generationId)

    // 파트 생성 쿼리
    const createPart = await db
      .insert(parts)
      .values({
        name,
        description,
        generationsId: generationId,
      })
      .returning({ id: parts.id })

    const createdPart = createPart[0]
    if (!createdPart) {
      throw new Error('Failed to create part')
    }

    const userToPartData: {
      userId: string
      partId: number
      userType: 'Core' | 'Primary' | 'Secondary'
    }[] = []

    for (const member of membersList) {
      userToPartData.push({
        userId: member,
        partId: createdPart.id,
        userType: 'Primary',
      })
    }

    for (const doubleMember of doubleBoardMembersList) {
      userToPartData.push({
        userId: doubleMember,
        partId: createdPart.id,
        userType: 'Secondary',
      })
    }

    if (userToPartData.length > 0) {
      await db.insert(usersToParts).values(userToPartData)
    }

    invalidatePartPublicCache(generation?.name ? [generation.name] : [])
  } catch (e) {
    logger.error('admin.parts.create', e)
    return { error: 'DB Update Error' }
  }

  redirect(await getLocalizedAdminPath('/admin/parts'))
}
