import { HTMLInputTypeAttribute } from 'react'

/**
 * Data input component
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
  return (
    <div className={'flex flex-col'}>
      <p className={'px-1 text-sm font-semibold text-neutral-700'}>{title}</p>
      <input
        type={type ? type : 'text'}
        className={`member-data-input ${type === 'checkbox' && 'mt-1 mr-auto ml-1 size-6'}`}
        defaultValue={defaultValue ? defaultValue : ''}
        name={name}
        placeholder={placeholder}
        defaultChecked={isChecked}
        required={required}
      />
    </div>
  )
}
