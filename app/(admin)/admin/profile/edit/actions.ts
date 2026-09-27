'use server'

import { forbidden, redirect } from 'next/navigation'
import getMemberFormData from '@/lib/server/form-data/get-member-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import { updateMyProfile } from '@/lib/server/services/admin/profile'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

/**
 * Update Profile Action
 * @param memberId - member id (항상 로그인한 본인이어야 한다)
 * @param prev - previous state for form error
 * @param formData - member data
 */
export async function updateProfileAction(
  memberId: string,
  _prev: { error: string },
  formData: FormData
) {
  const actor = await getWebActor()
  if (!actor || actor.userId !== memberId) {
    return forbidden()
  }

  const result = await updateMyProfile(actor, getMemberFormData(formData))
  if (!result.ok) {
    return toActionError(result)
  }

  redirect(await getLocalizedAdminPath('/admin/profile'))
}
