'use client'

import { useId } from 'react'

/** placeholder를 입력 안내와 라벨로 함께 쓴다. */
export default function DataTextarea({
  defaultValue,
  name,
  placeholder,
}: {
  defaultValue: string | number | undefined | null
  name: string
  placeholder: string
}) {
  const inputId = useId()

  return (
    <div className={'admin-form-grid-full flex flex-col gap-1'}>
      <label htmlFor={inputId} className={'admin-field-label px-0.5'}>
        {placeholder}
      </label>
      <textarea
        id={inputId}
        className={'admin-input min-h-40 resize-y'}
        defaultValue={defaultValue ? defaultValue : ''}
        name={name}
        placeholder={placeholder}
      />
    </div>
  )
}
