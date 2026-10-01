'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseMemberForm } from '@/lib/server/form-data/admin-forms'
import { updateMember } from '@/lib/server/services/admin/members'

/** 멤버 정보를 고치고 멤버 상세로 이동한다. 첫 인자는 `bind`로 고정한다. */
export async function updateMemberAction(
  memberId: string,
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: (actor) => updateMember(actor, memberId, parseMemberForm(formData)),
    redirectTo: `/admin/members/${memberId}`,
  })
}
