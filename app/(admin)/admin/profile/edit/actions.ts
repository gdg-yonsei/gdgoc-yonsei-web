'use server'

import { forbidden } from 'next/navigation'
import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseMemberForm } from '@/lib/server/form-data/admin-forms'
import { updateMyProfile } from '@/lib/server/services/admin/profile'

/** `bind`로 고정한 memberId가 로그인 사용자와 다르면 403으로 막는다. */
export async function updateProfileAction(
  memberId: string,
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: async (actor) =>
      actor.userId === memberId
        ? updateMyProfile(actor, parseMemberForm(formData))
        : forbidden(),
    redirectTo: '/admin/profile',
  })
}
