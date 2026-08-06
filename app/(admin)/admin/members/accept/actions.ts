'use server'

import { redirect } from 'next/navigation'
import getAcceptMemberFormData from '@/lib/server/form-data/get-accept-member-form-data'
import { acceptMemberValidation } from '@/lib/validations/accept-member'
import db from '@/db'
import { users } from '@/db/schema/users'
import { eq } from 'drizzle-orm'
import getDeleteMemberFormData from '@/lib/server/form-data/get-delete-member-form-data'
import { deleteMemberValidation } from '@/lib/validations/delete-member'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { invalidateMemberPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import { requirePermission } from '@/lib/server/permission/require-permission'
import { parseActionInput } from '@/lib/server/actions/admin'
import { getGenerationNamesForUserId } from '@/lib/server/services/cache-context'

export default async function acceptMemberAction(
  _prev: { error: string },
  formData: FormData
) {
  // 사용자 역할을 변경할 권한이 있는지 확인
  await requirePermission('put', 'membersRole')
  const parsed = parseActionInput(
    acceptMemberValidation,
    getAcceptMemberFormData(formData)
  )
  if (!parsed.ok) {
    return { error: parsed.error }
  }

  const { userId, role } = parsed.data

  const userRole: 'UNVERIFIED' | 'MEMBER' | 'CORE' | 'ALUMNUS' | 'LEAD' =
    role === 'member'
      ? 'MEMBER'
      : role === 'core'
        ? 'CORE'
        : role === 'alumni'
          ? 'ALUMNUS'
          : 'UNVERIFIED'

  try {
    const generationNames = await getGenerationNamesForUserId(userId)

    await db.update(users).set({ role: userRole }).where(eq(users.id, userId))

    invalidateMemberPublicCache({
      memberId: userId,
      generationNames,
    })
  } catch (e) {
    logger.error('admin.members.accept', e, {
      userId,
    })
    return { error: 'DB Update Error' }
  }

  redirect(await getLocalizedAdminPath('/admin/members/accept'))
}

export async function deleteUserAction(
  _prev: { error: string },
  formData: FormData
) {
  await requirePermission('put', 'membersRole')
  const parsed = parseActionInput(
    deleteMemberValidation,
    getDeleteMemberFormData(formData)
  )
  if (!parsed.ok) {
    return { error: parsed.error }
  }

  const { userId } = parsed.data

  try {
    const generationNames = await getGenerationNamesForUserId(userId)

    await db.delete(users).where(eq(users.id, userId))

    invalidateMemberPublicCache({
      memberId: userId,
      generationNames,
    })
  } catch (e) {
    logger.error('admin.members.delete-pending', e, {
      userId,
    })
    return { error: 'DB Update Error' }
  }

  redirect(await getLocalizedAdminPath('/admin/members/accept'))
}
