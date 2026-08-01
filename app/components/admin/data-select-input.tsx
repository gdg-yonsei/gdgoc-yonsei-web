'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * Data Single Select Input Component
 * @param data - data list
 * @param name - input name
 * @param title - input title
 * @param defaultValue - default value
 * @constructor
 */
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
  // input ref
  const inputRef = useRef<HTMLInputElement>(null)
  // value state
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    if (inputRef.current) {
      // is value is changed, set value to input
      inputRef.current.value = value
    }
  }, [value])

  return (
    <div className={'admin-form-grid-full flex flex-col gap-2'}>
      <div className={'admin-field-label'}>{title}</div>
      <input name={name} hidden={true} ref={inputRef} />
      <div className={'admin-form-grid gap-2'}>
        {data?.map((d, i) => (
          <button
            type={'button'}
            key={i}
            aria-pressed={value === d.value}
            className={cn(
              'admin-btn justify-start text-left',
              value === d.value
                ? 'bg-primary text-on-primary'
                : 'border-hairline bg-surface text-ink hover:bg-canvas border'
            )}
            onClick={() => {
              setValue(d.value)
            }}
          >
            {d.name}
          </button>
        ))}
      </div>
    </div>
  )
}
