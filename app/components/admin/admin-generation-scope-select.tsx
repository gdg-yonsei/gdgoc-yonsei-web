'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setAdminGenerationScopeAction } from '@/app/components/admin/admin-generation-scope-actions'

type GenerationOption = {
  id: number
  name: string
}

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
        <span className={'text-xs font-semibold text-neutral-500'}>{label}</span>
      )}
      <select
        aria-label={label}
        className={
          'w-full max-w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 outline-none transition focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-100'
        }
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
      <span className={'text-xs text-neutral-500'}>
        {isPending ? pendingLabel : ''}
      </span>
    </label>
  )
}
