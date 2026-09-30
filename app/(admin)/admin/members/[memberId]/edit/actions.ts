'use server'

import { forbidden, redirect } from 'next/navigation'
import getMemberFormData from '@/lib/server/form-data/get-member-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { updateMember } from '@/lib/server/services/admin/members'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

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
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result = await updateMember(
    actor,
    memberId,
    getMemberFormData(formData)
  )
  if (!result.ok) {
    return toActionError(result)
  }

  // 성공 시 해당 member 페이지로 이동
  redirect(await getLocalizedAdminPath(`/admin/members/${memberId}`))
}
