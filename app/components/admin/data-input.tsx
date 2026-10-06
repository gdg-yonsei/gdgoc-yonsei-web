'use client'

import { HTMLInputTypeAttribute, useId } from 'react'
import { cn } from '@/lib/cn'

/** readOnly 입력은 disabled와 달리 폼에 제출되며, null 초깃값은 빈 문자열로 처리한다. */
export default function DataInput({
  defaultValue,
  name,
  placeholder,
  title,
  type,
  isChecked,
  required = false,
  readOnly = false,
}: {
  defaultValue: string | number | undefined | null
  name: string
  placeholder: string
  title: string
  type?: HTMLInputTypeAttribute
  isChecked?: boolean
  required?: boolean
  readOnly?: boolean
}) {
  const inputId = useId()
  const isCheckbox = type === 'checkbox'

  const input = (
    <input
      id={inputId}
      type={type ? type : 'text'}
      className={cn(
        'admin-input',
        isCheckbox && 'size-6 w-6 shrink-0 p-0',
        readOnly && 'text-ink-muted cursor-not-allowed'
      )}
      defaultValue={defaultValue ?? ''}
      name={name}
      placeholder={placeholder}
      defaultChecked={isChecked}
      required={required}
      aria-required={required || undefined}
      readOnly={readOnly}
    />
  )

  return (
    <div className={'flex flex-col gap-1'}>
      <label
        htmlFor={inputId}
        className={cn(
          'admin-field-label px-0.5',
          isCheckbox &&
            'inline-flex min-h-11 w-fit min-w-11 cursor-pointer items-center gap-2'
        )}
      >
        {isCheckbox && input}
        {title}
        {required && (
          <span aria-hidden={'true'} className={'text-danger pl-0.5'}>
            *
          </span>
        )}
      </label>
      {!isCheckbox && input}
    </div>
  )
}
