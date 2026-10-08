'use server'

import {
  runAdminFormAction,
  type AdminFormState,
} from '@/lib/server/actions/admin-form-action'
import { parseAnnouncementForm } from '@/lib/server/form-data/admin-forms'
import { createAnnouncement } from '@/lib/server/services/admin/announcements'

export async function createAnnouncementAction(
  _prev: AdminFormState,
  formData: FormData
) {
  return runAdminFormAction({
    run: (actor) => createAnnouncement(actor, parseAnnouncementForm(formData)),
    redirectTo: '/admin/announcements',
  })
}
