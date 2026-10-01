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

/** 가입 대기 사용자를 승인하고 역할을 부여한다. */
export async function acceptMemberAction(
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: (actor) => approveMember(actor, parseAcceptMemberForm(formData)),
    redirectTo: '/admin/members/accept',
  })
}

/** 가입 대기 사용자를 거절(계정 삭제)한다. */
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
