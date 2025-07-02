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
        'col-span-1 flex w-full flex-col gap-2 sm:col-span-3 lg:col-span-3 xl:col-span-4'
      }
    >
      <div className={'member-data-title'}>{title}</div>
      <div className={'flex flex-col items-start gap-2 lg:flex-row'}>
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
              'member-data-input h-auto min-h-96 resize-none overflow-hidden'
            }
          />
        </div>
        <div className={'w-full'}>
          <div>Preview</div>
          <div
            className={
              'prose min-h-96 w-full rounded-lg border-2 border-sky-900 p-4'
            }
          >
            <Markdown>{content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  )
}
