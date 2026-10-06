'use client'

/** 실수로 MCP 연결을 끊지 않도록 확인을 받은 뒤 제출한다. */
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

function SubmitDisconnect({ text, label }: { text: string; label: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type={'submit'}
      className={'admin-btn-secondary text-danger'}
      disabled={pending}
      aria-label={label}
    >
      {text}
    </button>
  )
}

export default function DisconnectButton({
  action,
  clientId,
  clientName,
}: {
  action: (
    previousState: { failed: boolean },
    formData: FormData
  ) => Promise<{ failed: boolean }>
  clientId: string
  clientName: string
}) {
  const { messages: t } = useAdminI18n()
  const [state, formAction] = useActionState(action, { failed: false })

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(t.mcpDisconnectConfirm)) {
          event.preventDefault()
        }
      }}
    >
      <input type={'hidden'} name={'clientId'} value={clientId} />
      {state.failed && (
        <p role="alert" className="text-danger text-sm">
          {t.mcpDisconnectFailed}
        </p>
      )}
      <SubmitDisconnect
        text={t.mcpDisconnect}
        label={`${t.mcpDisconnect}: ${clientName}`}
      />
    </form>
  )
}
