'use client'

import { KeyboardEvent, useId, useRef, useState } from 'react'
import {
  CheckIcon,
  ClipboardDocumentIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import {
  getMcpInstallGuides,
  McpClientId,
} from '@/app/components/admin/mcp-install-guides'

function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useAdminI18n()
  const [copied, setCopied] = useState(false)

  return (
    <button
      type={'button'}
      className={'admin-btn-ghost min-h-8 px-2 py-1'}
      aria-label={`${t('copy')}: ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } catch {
          // 클립보드 권한이 없으면 사용자가 직접 선택해 복사할 수 있다.
        }
      }}
    >
      {copied ? (
        <CheckIcon className={'text-success size-4'} aria-hidden={'true'} />
      ) : (
        <ClipboardDocumentIcon className={'size-4'} aria-hidden={'true'} />
      )}
      <span className={'type-caption'} aria-live={'polite'}>
        {copied ? t('copied') : t('copy')}
      </span>
    </button>
  )
}

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div
      className={
        'bg-surface-sunken flex items-start justify-between gap-2 rounded-md p-2'
      }
    >
      <pre
        className={
          'type-caption text-ink min-w-0 flex-1 overflow-x-auto py-1.5 pl-1 font-mono whitespace-pre'
        }
      >
        <code>{code}</code>
      </pre>
      <CopyButton value={code} label={label} />
    </div>
  )
}

/**
 * GYMS 홈의 MCP 연결 안내. 클라이언트별 탭으로 설치 방법을 보여준다.
 */
export default function McpInstallGuide({ mcpUrl }: { mcpUrl: string }) {
  const { t, locale } = useAdminI18n()
  const guides = getMcpInstallGuides(locale, mcpUrl)
  const [selected, setSelected] = useState<McpClientId>('claude-code')
  const tabRefs = useRef<Map<McpClientId, HTMLButtonElement>>(new Map())
  const baseId = useId()
  const guide = guides.find((g) => g.id === selected)

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = guides.findIndex((g) => g.id === selected)
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % guides.length
    else if (event.key === 'ArrowLeft')
      next = (index - 1 + guides.length) % guides.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = guides.length - 1
    else return
    event.preventDefault()
    const nextId = guides[next]?.id
    if (!nextId) return
    setSelected(nextId)
    tabRefs.current.get(nextId)?.focus()
  }

  if (!guide) return null

  return (
    <div className={'admin-card flex flex-col gap-4 lg:col-span-2'}>
      <div className={'flex flex-col gap-1'}>
        <h3 className={'type-title text-ink flex items-center gap-2'}>
          <CpuChipIcon
            className={'text-ink-muted size-5'}
            aria-hidden={'true'}
          />
          {t('mcpConnect')}
        </h3>
        <p className={'type-caption text-ink-muted'}>{t('mcpConnectHint')}</p>
      </div>

      <div className={'flex flex-col gap-1.5'}>
        <p className={'admin-field-label'}>{t('mcpServerUrl')}</p>
        <CodeBlock code={mcpUrl} label={t('mcpServerUrl')} />
      </div>

      <div
        role={'tablist'}
        aria-label={t('mcpClient')}
        className={'border-hairline flex flex-wrap gap-1 border-b pb-2'}
      >
        {guides.map((g) => {
          const isSelected = g.id === selected
          return (
            <button
              key={g.id}
              ref={(el) => {
                if (el) tabRefs.current.set(g.id, el)
                else tabRefs.current.delete(g.id)
              }}
              type={'button'}
              role={'tab'}
              id={`${baseId}-tab-${g.id}`}
              aria-selected={isSelected}
              aria-controls={`${baseId}-panel`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelected(g.id)}
              onKeyDown={onTabKeyDown}
              className={
                isSelected
                  ? 'admin-btn bg-primary-soft text-primary min-h-9 px-3 py-1.5'
                  : 'admin-btn-ghost min-h-9 px-3 py-1.5'
              }
            >
              {g.name}
            </button>
          )
        })}
      </div>

      <div
        role={'tabpanel'}
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${guide.id}`}
        className={'flex flex-col gap-3'}
      >
        <ol className={'flex flex-col gap-3'}>
          {guide.steps.map((step, index) => (
            <li key={index} className={'flex gap-3'}>
              <span
                className={
                  'bg-surface-sunken text-ink-muted type-caption flex size-6 shrink-0 items-center justify-center rounded-full font-semibold'
                }
                aria-hidden={'true'}
              >
                {index + 1}
              </span>
              <div className={'flex min-w-0 flex-1 flex-col gap-1.5'}>
                <p className={'type-body-sm text-ink'}>{step.text}</p>
                {step.code && (
                  <CodeBlock
                    code={step.code}
                    label={`${guide.name} ${index + 1}`}
                  />
                )}
              </div>
            </li>
          ))}
        </ol>
        {guide.note && (
          <p className={'type-caption text-ink-muted'}>{guide.note}</p>
        )}
        <p
          className={
            'type-caption text-ink-muted border-hairline border-t pt-3'
          }
        >
          {t('mcpPermissionNote')}
        </p>
      </div>
    </div>
  )
}
