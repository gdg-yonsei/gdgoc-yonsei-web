'use client'

import { useEffect, useRef, useState } from 'react'

export default function DataSelectMultipleInput({
  data,
  name,
  title,
  defaultValue,
}: {
  data: { name: string; value: string }[]
  name: string
  title: string
  defaultValue: string[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultValue)

  function handleClick(data: string) {
    if (value.includes(data)) {
      setValue(value.filter((v) => v !== data))
    } else {
      setValue([...value, data])
    }
  }

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = JSON.stringify(value)
    }
  }, [value])

  return (
    <div
      className={
        'flex gap-2 flex-col col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4'
      }
    >
      <div className={'member-data-title'}>{title}</div>
      <input name={name} hidden={true} ref={inputRef} />
      <div className={'member-data-grid gap-2'}>
        {data.map((d, i) => (
          <button
            type={'button'}
            key={i}
            className={`p-2 rounded-xl px-4 ${value.includes(d.value) ? 'bg-neutral-900 text-white' : 'bg-white '}`}
            onClick={() => handleClick(d.value)}
          >
            {d.name}
          </button>
        ))}
      </div>
    </div>
  )
}
