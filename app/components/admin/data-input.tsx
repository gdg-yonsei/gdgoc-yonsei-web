'use client'

import { HTMLInputTypeAttribute, useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * Data input component
 *
 * 라벨은 `<p>`가 아니라 `<label htmlFor>`로 연결됩니다. 라벨을 눌러 입력에
 * 포커스할 수 있고, 스크린리더가 필드 이름을 확실히 읽습니다.
 * (보이는 라벨 텍스트는 그대로 유지되므로 기존 e2e의
 *  `getByRole('textbox', { name })`은 계속 동작합니다.)
 *
 * @param defaultValue - 기본값
 * @param name - input name
 * @param placeholder - input placeholder
 * @param title - input title
 * @param type - input type
 * @param isChecked - input checked 여부
 * @param required - is Essential
 * @constructor
 */
export default function DataInput({
  defaultValue,
  name,
  placeholder,
  title,
  type,
  isChecked,
  required = false,
}: {
  defaultValue: string | number | undefined | null
  name: string
  placeholder: string
  title: string
  type?: HTMLInputTypeAttribute
  isChecked?: boolean
  required?: boolean
}) {
  const inputId = useId()
  const isCheckbox = type === 'checkbox'

  return (
    <div className={'flex flex-col gap-1'}>
      <label htmlFor={inputId} className={'admin-field-label px-0.5'}>
        {title}
        {required && (
          <span aria-hidden={'true'} className={'text-danger pl-0.5'}>
            *
          </span>
        )}
      </label>
      <input
        id={inputId}
        type={type ? type : 'text'}
        className={cn(
          'admin-input',
          isCheckbox && 'mr-auto ml-0.5 size-6 w-auto p-0'
        )}
        defaultValue={defaultValue ? defaultValue : ''}
        name={name}
        placeholder={placeholder}
        defaultChecked={isChecked}
        required={required}
        aria-required={required || undefined}
      />
    </div>
  )
}
