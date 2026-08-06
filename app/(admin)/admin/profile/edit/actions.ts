'use server'

import db from '@/db'
import { users } from '@/db/schema/users'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { memberValidation } from '@/lib/validations/member'
import { parseActionInput } from '@/lib/server/actions/admin'
import { requirePermission } from '@/lib/server/permission/require-permission'
import getMemberFormData from '@/lib/server/form-data/get-member-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { invalidateMemberPublicCache } from '@/lib/server/cache'
import { logger } from '@/lib/server/logger'
import { getGenerationNamesForUserId } from '@/lib/server/services/cache-context'

/**
 * Update Member Action
 * @param memberId - member id
 * @param prev - previous state for form error
 * @param formData - member data
 */
export async function updateProfileAction(
  memberId: string,
  _prev: { error: string },
  formData: FormData
) {
  // 사용자가 member 를 수정할 권한이 있는지 확인
  await requirePermission('put', 'members', memberId)

  // form data 에서 member data 추출 후 검증.
  // 본인 프로필 수정에서는 역할을 바꿀 수 없으므로 role 은 항상 null 로 고정한다.
  const parsed = parseActionInput(memberValidation, {
    ...getMemberFormData(formData),
    role: null,
  })
  if (!parsed.ok) {
    return { error: parsed.error }
  }

  const {
    name,
    firstName,
    firstNameKo,
    lastName,
    lastNameKo,
    email,
    githubId,
    instagramId,
    linkedInId,
    major,
    studentId,
    telephone,
    isForeigner,
    profileImage,
  } = parsed.data

  // member data 업데이트 쿼리
  try {
    const generationNames = await getGenerationNamesForUserId(memberId)

    await db
      .update(users)
      .set({
        name,
        firstName,
        firstNameKo,
        lastName,
        lastNameKo,
        email,
        githubId,
        instagramId,
        linkedInId,
        major,
        studentId: studentId ? Number(studentId) : null,
        telephone: telephone?.replaceAll('-', '').replaceAll(' ', ''),
        isForeigner,
        image: profileImage,
      })
      .where(eq(users.id, memberId))

    invalidateMemberPublicCache({
      memberId,
      generationNames,
    })
  } catch (e) {
    logger.error('admin.profile.update', e, {
      memberId,
    })
    return { error: 'DB Update Error' }
  }

  // 성공 시 해당 member 페이지로 이동
  redirect(await getLocalizedAdminPath('/admin/profile'))
}
