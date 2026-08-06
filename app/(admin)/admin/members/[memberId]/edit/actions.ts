'use server'

import db from '@/db'
import { users } from '@/db/schema/users'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import handlePermission from '@/lib/server/permission/handle-permission'
import { requirePermission } from '@/lib/server/permission/require-permission'
import { memberValidation } from '@/lib/validations/member'
import { parseActionInput } from '@/lib/server/actions/admin'
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
export async function updateMemberAction(
  memberId: string,
  _prev: { error: string },
  formData: FormData
) {
  // 사용자가 member 를 수정할 권한이 있는지 확인.
  // 반환된 세션은 아래에서 역할 변경 권한까지 있는지 판단할 때 재사용한다.
  const session = await requirePermission('put', 'members', memberId)

  // form data 에서 member data 추출 후 검증
  const parsed = parseActionInput(
    memberValidation,
    getMemberFormData(formData),
    'Validation failed'
  )
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
    role,
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
        ...((await handlePermission(session?.user?.id, 'put', 'membersRole')) &&
        role
          ? { role: role }
          : {}),
        isForeigner,
        image: profileImage,
      })
      .where(eq(users.id, memberId))

    invalidateMemberPublicCache({
      memberId,
      generationNames,
    })
  } catch (e) {
    logger.error('admin.members.update', e, {
      memberId,
    })
    return { error: 'DB Update Error' }
  }

  // 성공 시 해당 member 페이지로 이동
  redirect(await getLocalizedAdminPath(`/admin/members/${memberId}`))
}
