'use client'

import DataForm from '@/app/components/admin/data-form'
import SubmitButton from '@/app/components/admin/data-delete-button/submit-button'
import {
  removeParticipantAction,
  unregisterSessionAction,
} from '@/app/(admin)/admin/sessions/[sessionId]/actions'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

export function RemoveParticipantButton({
  sessionId,
  userId,
}: {
  sessionId: string
  userId: string
}) {
  const { t } = useAdminI18n()

  return (
    <DataForm action={removeParticipantAction.bind(null, sessionId, userId)}>
      <SubmitButton
        className={'admin-btn-danger min-h-7 px-2 text-xs'}
        questionText={t('deleteConfirm')}
      >
        {t('removeParticipant')}
      </SubmitButton>
    </DataForm>
  )
}

export function UnregisterButton({ sessionId }: { sessionId: string }) {
  const { t } = useAdminI18n()

  return (
    <DataForm action={unregisterSessionAction.bind(null, sessionId)}>
      <SubmitButton
        className={'admin-btn-secondary min-h-9 px-3'}
        questionText={t('deleteConfirm')}
      >
        {t('unregister')}
      </SubmitButton>
    </DataForm>
  )
}
