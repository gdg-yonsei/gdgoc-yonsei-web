'use client'

/**
 * MCP 연결 끊기 버튼(클라이언트 컴포넌트). 실수로 누르지 않도록 확인한 뒤 제출한다.
 */
import { useFormStatus } from 'react-dom'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/** 제출 중에는 비활성화되는 끊기 버튼. */
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

/**
 * 연결 끊기 폼.
 * @param action `disconnectMcpClientAction`
 * @param clientId 끊을 클라이언트
 * @param clientName 접근 가능한 이름에 넣을 클라이언트 이름
 */
export default function DisconnectButton({
  action,
  clientId,
  clientName,
}: {
  action: (formData: FormData) => Promise<void>
  clientId: string
  clientName: string
}) {
  const { messages: t } = useAdminI18n()

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(t.mcpDisconnectConfirm)) {
          event.preventDefault()
        }
      }}
    >
      <input type={'hidden'} name={'clientId'} value={clientId} />
      <SubmitDisconnect
        text={t.mcpDisconnect}
        label={`${t.mcpDisconnect}: ${clientName}`}
      />
    </form>
  )
}
