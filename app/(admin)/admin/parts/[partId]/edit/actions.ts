'use server'

import db from '@/db'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { parts } from '@/db/schema/parts'
import { usersToParts } from '@/db/schema/users-to-parts'
import { partValidation } from '@/lib/validations/part'
import getPartFormData from '@/lib/server/form-data/get-part-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { invalidatePartPublicCache } from '@/lib/server/cache'
import { parseActionInput } from '@/lib/server/actions/admin'
import { requirePermission } from '@/lib/server/permission/require-permission'
import { logger } from '@/lib/server/logger'
import {
  getGenerationNameById,
  getGenerationNameForPartId,
} from '@/lib/server/services/cache-context'

/**
 * Update Part Action
 * @param partId - part id
 * @param prevState - previous state for form error
 * @param formData - part data
 */
export async function updatePartAction(
  partId: string,
  _prevState: { error: string },
  formData: FormData
) {
  // 사용자가 part 를 수정할 권한이 있는지 확인
  await requirePermission('put', 'parts', partId)

  // form data 에서 part data 추출
  const parsed = parseActionInput(partValidation, getPartFormData(formData))
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
    const partIdNumber = Number(partId)
    const existingPart = await db.query.parts.findFirst({
      where: eq(parts.id, partIdNumber),
      columns: {
        generationsId: true,
      },
    })

    if (!existingPart || existingPart.generationsId !== generationId) {
      return { error: 'Part generation cannot be changed from this screen.' }
    }

    const previousGenerationName =
      await getGenerationNameForPartId(partIdNumber)
    const nextGeneration = await getGenerationNameById(generationId)

    // part 정보 업데이트 쿼리
    await db
      .update(parts)
      .set({
        name,
        description: description,
        generationsId: generationId,
        updatedAt: new Date(),
      })
      .where(eq(parts.id, partIdNumber))
    // 파트에 연결된 모든 멤버 정보 삭제
    await db.delete(usersToParts).where(eq(usersToParts.partId, partIdNumber))

    const userToPartData: {
      userId: string
      partId: number
      userType: 'Core' | 'Primary' | 'Secondary'
    }[] = []

    for (const member of membersList) {
      userToPartData.push({
        userId: member,
        partId: partIdNumber,
        userType: 'Primary',
      })
    }

    for (const doubleMember of doubleBoardMembersList) {
      userToPartData.push({
        userId: doubleMember,
        partId: partIdNumber,
        userType: 'Secondary',
      })
    }

    // 파트에 멤버 정보 새로 추가
    if (userToPartData.length > 0) {
      await db.insert(usersToParts).values(userToPartData)
    }

    invalidatePartPublicCache(
      [previousGenerationName, nextGeneration?.name].filter(Boolean) as string[]
    )
  } catch (e) {
    logger.error('admin.parts.update', e, {
      partId,
    })
    return { error: 'DB Update Error' }
  }

  redirect(await getLocalizedAdminPath(`/admin/parts/${partId}`))
}
