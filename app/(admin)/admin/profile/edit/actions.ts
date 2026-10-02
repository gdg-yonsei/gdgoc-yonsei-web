'use server'

/**
 * 내 프로필 수정 Server Action.
 */
import { forbidden } from 'next/navigation'
import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseMemberForm } from '@/lib/server/form-data/admin-forms'
import { updateMyProfile } from '@/lib/server/services/admin/profile'

/**
 * 본인 프로필을 고친다. `memberId`는 `bind`로 고정되며, 로그인한 본인과 다르면
 * 403이다(다른 사람의 프로필 폼을 재사용한 요청을 막는다).
 */
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
