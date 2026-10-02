'use client'

/**
 * MCP 클라이언트 연결 동의 폼(클라이언트 컴포넌트). 동의 화면 문구는 외부 클라이언트 사용자를 위해 영어로 둔다.
 */
import { useState, useTransition } from 'react'
import { authClient } from '@/lib/auth-client'

/** GYMS MCP 스코프별 이름과 설명(`lib/mcp/scopes` 참고). */
const SCOPE_LABELS: Record<string, { title: string; detail: string }> = {
  'gyms:read': {
    title: 'Read',
    detail: 'View sessions, projects, parts, generations and members.',
  },
  'gyms:write': {
    title: 'Write',
    detail: 'Create and edit data, register for sessions and upload images.',
  },
  'gyms:admin': {
    title: 'Admin',
    detail: 'Delete data, approve members and change roles.',
  },
}

/** 동의 API 응답. Better Auth 버전에 따라 이동 주소 필드 이름이 다르다. */
type ConsentResponse = { redirect_uri?: string; url?: string } | null

/** 동의 응답에서 이동할 주소(인가 코드가 붙은 redirect_uri)를 꺼낸다. */
function redirectTarget(data: ConsentResponse): string | undefined {
  return data?.redirect_uri ?? data?.url
}

/**
 * 동의 폼.
 * 역할로 실제 권한이 생기는 스코프만 체크박스로 보여 주고, 승인하면 인가 서버가
 * 돌려준 redirect_uri(인가 코드 포함)로 이동한다.
 */
export default function ConsentForm({
  clientName,
  redirectHost,
  requestedScopes,
  selectableScopes,
}: {
  clientName: string
  redirectHost: string
  requestedScopes: string[]
  selectableScopes: string[]
}) {
  const offered = requestedScopes.filter((scope) =>
    selectableScopes.includes(scope)
  )
  const unavailable = requestedScopes.filter(
    (scope) => scope.startsWith('gyms:') && !selectableScopes.includes(scope)
  )
  const [selected, setSelected] = useState<string[]>(offered)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(accept: boolean) {
    setError(null)
    startTransition(async () => {
      const scope = [
        ...offered.filter((item) => selected.includes(item)),
        ...(requestedScopes.includes('offline_access')
          ? ['offline_access']
          : []),
      ].join(' ')
      const result = await authClient.oauth2.consent(
        accept ? { accept, scope } : { accept }
      )
      const target = redirectTarget(result.data as ConsentResponse)
      if (result.error || !target) {
        setError(result.error?.message ?? 'The authorization request failed.')
        return
      }
      window.location.assign(target)
    })
  }

  return (
    <div className={'flex flex-col gap-6'}>
      <div className={'flex flex-col gap-1'}>
        <h1 className={'type-heading-2 text-ink'}>Connect {clientName}</h1>
        <p className={'type-body-sm text-ink-muted'}>
          This app wants to use GYMS on your behalf through MCP. After you allow
          it, you will be sent back to{' '}
          <span className={'text-ink font-medium'}>{redirectHost}</span>.
        </p>
      </div>

      <fieldset className={'flex flex-col gap-3'}>
        <legend className={'type-title text-ink mb-2'}>Permissions</legend>
        {offered.map((scope) => (
          <label
            key={scope}
            className={
              'border-hairline flex items-start gap-3 rounded-lg border p-3'
            }
          >
            <input
              type={'checkbox'}
              className={'mt-1 size-4'}
              checked={selected.includes(scope)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, scope]
                    : current.filter((item) => item !== scope)
                )
              }
            />
            <span className={'flex flex-col'}>
              <span className={'type-body text-ink'}>
                {SCOPE_LABELS[scope]?.title ?? scope}{' '}
                <code className={'type-caption text-ink-faint'}>{scope}</code>
              </span>
              <span className={'type-caption text-ink-muted'}>
                {SCOPE_LABELS[scope]?.detail}
              </span>
            </span>
          </label>
        ))}
        {unavailable.length > 0 && (
          <p className={'type-caption text-ink-faint'}>
            Not available for your role: {unavailable.join(', ')}
          </p>
        )}
        <p className={'type-caption text-ink-faint'}>
          Everything the app does is limited to what your role can do on the
          admin page.
        </p>
      </fieldset>

      {error && (
        <p role={'alert'} className={'type-body-sm text-danger'}>
          {error}
        </p>
      )}

      <div className={'flex flex-col gap-2 sm:flex-row sm:justify-end'}>
        <button
          type={'button'}
          className={'admin-btn-secondary'}
          disabled={isPending}
          onClick={() => submit(false)}
        >
          Deny
        </button>
        <button
          type={'button'}
          className={'admin-btn-primary'}
          disabled={isPending || selected.length === 0}
          onClick={() => submit(true)}
        >
          Allow
        </button>
      </div>
    </div>
  )
}
