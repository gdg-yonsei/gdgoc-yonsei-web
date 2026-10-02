'use client'

/**
 * 관리자 폼의 여러 줄 입력 필드.
 */
import { useId } from 'react'

/**
 * 라벨이 붙은 `<textarea>`. 라벨 문구로 `placeholder`를 함께 쓴다.
 *
 * @param defaultValue 초깃값
 * @param name 폼 필드 이름
 * @param placeholder 라벨 겸 입력 안내 문구
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
