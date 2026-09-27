'use server'

import { forbidden, redirect } from 'next/navigation'
import getAcceptMemberFormData from '@/lib/server/form-data/get-accept-member-form-data'
import getDeleteMemberFormData from '@/lib/server/form-data/get-delete-member-form-data'
import { getLocalizedAdminPath } from '@/lib/admin-i18n/server'
import {
  approveMember,
  deleteMember,
} from '@/lib/server/services/admin/members'
import {
  getWebActor,
  toActionError,
} from '@/lib/server/services/admin/web-actor'

export default async function acceptMemberAction(
  _prev: { error: string },
  formData: FormData
) {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result = await approveMember(actor, getAcceptMemberFormData(formData))
  if (!result.ok) {
    return toActionError(result)
  }

  redirect(await getLocalizedAdminPath('/admin/members/accept'))
}

export async function deleteUserAction(
  _prev: { error: string },
  formData: FormData
) {
  const actor = await getWebActor()
  if (!actor) {
    return forbidden()
  }

  const result = await deleteMember(
    actor,
    getDeleteMemberFormData(formData).userId ?? ''
  )
  if (!result.ok) {
    return toActionError(result)
  }

  redirect(await getLocalizedAdminPath('/admin/members/accept'))
}
