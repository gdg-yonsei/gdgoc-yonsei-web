'use client'

import { ChangeEvent, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/** textarea 원문을 폼 값으로 제출하며, 미리보기는 react-markdown으로 렌더링한다. */
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
