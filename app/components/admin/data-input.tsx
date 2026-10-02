'use client'

/**
 * 관리자 폼의 기본 입력 필드(클라이언트 컴포넌트). 텍스트·숫자·날짜·체크박스 등 `<input>` 하나와 라벨을 그린다.
 */
import { HTMLInputTypeAttribute, useId } from 'react'
import { cn } from '@/lib/cn'

/**
 * 라벨이 붙은 `<input>`.
 *
 * 라벨을 `<label htmlFor>`로 연결해, 라벨을 눌러 포커스할 수 있고 스크린리더가 필드
 * 이름을 읽는다. e2e는 `getByRole('textbox', { name })`으로 이 라벨을 찾는다.
 * @param defaultValue 초깃값(null이면 빈 문자열)
 * @param name 폼 필드 이름
 * @param placeholder 입력 안내 문구
 * @param title 라벨
 * @param type input type(기본 `text`)
 * @param isChecked 체크박스 초기 선택 여부
 * @param required 필수 여부(라벨에 `*` 표시)
 * @param readOnly 값은 제출되지만 고칠 수 없다(disabled와 달리 폼에 포함된다)
 */
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
          isCheckbox && 'mr-auto ml-0.5 size-6 w-auto p-0',
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
    </div>
  )
}
