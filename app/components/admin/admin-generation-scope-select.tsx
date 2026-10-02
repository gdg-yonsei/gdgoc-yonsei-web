'use client'

/**
 * 기수 범위 선택 드롭다운(클라이언트 컴포넌트). 바꾸면 Server Action으로 쿠키를 저장하고 화면을 새로 고친다.
 */
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { setAdminGenerationScopeAction } from '@/app/components/admin/admin-generation-scope-actions'

/** 드롭다운 선택지 하나. */
type GenerationOption = {
  id: number
  name: string
}

/**
 * 기수 범위 `<select>`.
 *
 * `useTransition`으로 쿠키 저장과 `router.refresh()`를 묶어, 새로 고치는 동안
 * "갱신 중" 문구를 보여 주고 중복 선택을 막는다.
 * @param canAccessAll "전체 기수" 선택지를 보여 줄지(전체 접근 권한)
 * @param selectedValue 현재 범위의 직렬화 값
 * @param showLabel 라벨·진행 문구 표시 여부
 */
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
      {/*
        네이티브 <select>를 유지합니다. e2e 헬퍼가 `aria-label`로 이 요소를 찾아
        `selectOption()`을 호출하므로 커스텀 리스트박스로 대체하면 안 됩니다.
      */}
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
