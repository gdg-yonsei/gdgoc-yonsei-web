'use client'

/**
 * 버튼 모양 단일 선택 입력(클라이언트 컴포넌트). 선택지가 적을 때 `<select>` 대신 쓴다.
 */
import { useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * 버튼 목록에서 하나를 고르는 단일 선택 입력.
 * 선택한 값은 숨은 입력(`name`)으로 폼에 실린다.
 */
export default function DataSelectInput({
  data,
  name,
  title,
  defaultValue,
}: {
  /** 선택지. `name`은 버튼에 보일 이름, `value`는 폼에 실릴 값이다. */
  data: { name: string; value: string }[]
  name: string
  title: string
  defaultValue: string
}) {
  const [value, setValue] = useState(defaultValue)

  return (
    <div className={'admin-form-grid-full flex flex-col gap-2'}>
      <div className={'admin-field-label'}>{title}</div>
      <input type={'hidden'} name={name} value={value} />
      <div className={'admin-form-grid gap-2'}>
        {data.map((option) => (
          <button
            type={'button'}
            key={option.value}
            aria-pressed={value === option.value}
            className={cn(
              'admin-btn justify-start text-left',
              value === option.value
                ? 'bg-primary text-on-primary'
                : 'border-hairline bg-surface text-ink hover:bg-canvas border'
            )}
            onClick={() => setValue(option.value)}
          >
            {option.name}
          </button>
        ))}
      </div>
    </div>
  )
}
