'use client'

import { useState } from 'react'
import { cn } from '@/lib/cn'

/** 선택 값은 숨은 입력 name으로 폼에 제출한다. */
export default function DataSelectInput({
  data,
  name,
  title,
  defaultValue,
}: {
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
