'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Data Multiple Select Input Component
 *
 * input 데이터는 리스트 형태를 JSON 문자열로 변환하여 input 에 저장
 *
 * 이후 활용할 때 JSON.parse 를 통해 데이터를 추출하여 사용 필요
 * @param data - data list
 * @param name - input name
 * @param title - input title
 * @param defaultValue - default value
 * @constructor
 */
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
  // input ref
  const inputRef = useRef<HTMLInputElement>(null)
  // multiple value state
  const [value, setValue] = useState(defaultValue)

  // handle click event
  function handleClick(data: string) {
    // if value includes data, remove data from value
    if (value.includes(data)) {
      setValue(value.filter((v) => v !== data))
    } else {
      // if value does not include data, add data to value
      setValue([...value, data])
    }
  }

  useEffect(() => {
    // if input ref exists, set value to input
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
