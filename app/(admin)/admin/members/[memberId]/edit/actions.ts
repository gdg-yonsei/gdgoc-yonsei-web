'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseMemberForm } from '@/lib/server/form-data/admin-forms'
import { updateMember } from '@/lib/server/services/admin/members'

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
