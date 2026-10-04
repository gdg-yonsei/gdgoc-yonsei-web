'use client'

/**
 * Markdown 편집기와 실시간 미리보기(클라이언트 컴포넌트). 세션·프로젝트 본문 입력에 쓴다.
 */
import { ChangeEvent, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * 왼쪽은 `<textarea>`, 오른쪽은 `react-markdown` 미리보기. 입력에 맞춰 높이가 늘어난다.
 *
 * @param name 폼 필드 이름(제출 값은 textarea 원문)
 * @param defaultValue 기존 본문
 */
export default function MDXEditor({
  title,
  name,
  placeholder,
  defaultValue = '',
}: {
  title: string
  name: string
  placeholder: string
  defaultValue?: string | null | undefined
}) {
  const { t } = useAdminI18n()
  const [content, setContent] = useState<string | null>(defaultValue)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const handleTextareaHeight = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.currentTarget.value)
    // 높이를 0으로 줄였다가 scrollHeight로 다시 맞춰, 줄어든 내용에도 높이가 따라간다.
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = '0px'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = scrollHeight + 'px'
    }
  }

  return (
    <div className={'admin-form-grid-full flex w-full flex-col gap-2'}>
      <div className={'admin-field-label'}>{title}</div>
      <div className={'flex flex-col items-start gap-2 lg:flex-row'}>
        <div className={'w-full'}>
          <div>{t('editor')}</div>
          <textarea
            ref={textareaRef}
            name={name}
            placeholder={placeholder}
            onChange={(event) => {
              handleTextareaHeight(event)
            }}
            defaultValue={defaultValue ? defaultValue : ''}
            className={
              'admin-input h-auto min-h-96 resize-none overflow-hidden'
            }
          />
        </div>
        <div className={'w-full'}>
          <div>{t('preview')}</div>
          <div
            className={
              'prose border-hairline min-h-96 w-full rounded-lg border-2 p-4'
            }
          >
            <Markdown>{content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  )
}
