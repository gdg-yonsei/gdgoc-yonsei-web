'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setAdminGenerationScopeAction } from '@/app/components/admin/admin-generation-scope-actions'

type GenerationOption = {
  id: number
  name: string
}

/** 쿠키 저장·router.refresh를 같은 transition에 묶어 갱신 중 중복 선택을 막는다. */
export default function AdminGenerationScopeSelect({
  canAccessAll,
  disabled,
  label,
  allGenerationsLabel,
  options,
  pendingLabel,
  selectedValue,
  showLabel = true,
}: {
  canAccessAll: boolean
  disabled?: boolean
  label: string
  allGenerationsLabel: string
  options: GenerationOption[]
  pendingLabel: string
  selectedValue: string
  showLabel?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <label className={'flex w-full min-w-0 flex-col gap-1'}>
      {showLabel && (
        <span className={'flex items-baseline justify-between gap-2'}>
          <span className={'admin-field-label'}>{label}</span>
          <span
            aria-live={'polite'}
            className={'type-eyebrow text-ink-faint font-normal'}
          >
            {isPending ? pendingLabel : ''}
          </span>
        </span>
      )}
      {/* e2e가 aria-label로 찾아 selectOption을 호출하므로 네이티브 select를 유지한다. */}
      <select
        aria-label={label}
        className={'admin-input type-body-sm cursor-pointer font-medium'}
        defaultValue={selectedValue}
        disabled={disabled || isPending}
        onChange={(event) => {
          const nextValue = event.currentTarget.value

          startTransition(() => {
            void (async () => {
              await setAdminGenerationScopeAction(nextValue)
              router.refresh()
            })()
          })
        }}
      >
        {canAccessAll && <option value={'all'}>{allGenerationsLabel}</option>}
        {options.map((option) => (
          <option key={option.id} value={String(option.id)}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  )
}
