'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import {
  parseAcceptMemberForm,
  parseDeleteMemberForm,
} from '@/lib/server/form-data/admin-forms'
import {
  approveMember,
  deleteMember,
} from '@/lib/server/services/admin/members'

export async function acceptMemberAction(
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: (actor) => approveMember(actor, parseAcceptMemberForm(formData)),
    redirectTo: '/admin/members/accept',
  })
}

export async function deleteMemberAction(
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: (actor) =>
      deleteMember(actor, parseDeleteMemberForm(formData).userId ?? ''),
    redirectTo: '/admin/members/accept',
  })
}
