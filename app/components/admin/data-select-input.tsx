'use client'

import { useEffect, useRef, useState } from 'react'

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
    <div
      className={
        'flex gap-2 flex-col col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4'
      }
    >
      <div className={'member-data-title'}>{title}</div>
      <input name={name} hidden={true} ref={inputRef} />
      <div className={'member-data-grid gap-2'}>
        {data?.map((d, i) => (
          <button
            type={'button'}
            key={i}
            className={`p-2 rounded-xl px-4 ${value === d.value ? 'bg-neutral-900 text-white' : 'bg-white '}`}
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
