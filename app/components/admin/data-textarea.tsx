'use client'

import { useId } from 'react'

/**
 * Textarea input component
 * @param defaultValue - 기본값
 * @param name - input name
 * @param placeholder - input placeholder
 * @constructor
 */
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
