'use client'

import { ChangeEvent, useRef, useState } from 'react'
import Markdown from 'react-markdown'

export default function MDXEditor({
  title,
  name,
  placeholder,
  defaultValue = '',
}: {
  title: string
  name: string
  placeholder: string
  defaultValue?: string
}) {
  const [content, setContent] = useState<string>(defaultValue)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const handleTextareaHeight = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.currentTarget.value)
    // textarea 높이 조절
    if (textareaRef && textareaRef.current) {
      textareaRef.current.style.height = '0px'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = scrollHeight + 'px'
    }
  }

  return (
    <div
      className={
        'col-span-1 sm:col-span-3 lg:col-span-3 xl:col-span-4 w-full flex flex-col gap-2'
      }
    >
      <div className={'member-data-title'}>{title}</div>
      <div className={'flex flex-col lg:flex-row items-start gap-2 '}>
        <div className={'w-full'}>
          <div>Editor</div>
          <textarea
            ref={textareaRef}
            name={name}
            placeholder={placeholder}
            onChange={(event) => {
              handleTextareaHeight(event)
            }}
            defaultValue={defaultValue}
            className={
              'min-h-96 member-data-input resize-none overflow-hidden h-auto'
            }
          />
        </div>
        <div className={'w-full'}>
          <div>Preview</div>
          <div className={'ring-2 min-h-96 w-full rounded-lg ring-sky-900 p-4'}>
            <Markdown className={'w-full prose'}>{content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  )
}
