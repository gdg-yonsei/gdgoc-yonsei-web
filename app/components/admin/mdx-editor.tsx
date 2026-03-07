'use client'

import { ChangeEvent, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'

/**
 * `MDXEditor` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
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
  defaultValue?: string | null
}) {
  const { locale } = useAdminI18n()
  const [content, setContent] = useState<string | null>(defaultValue)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  /**
   * `handleTextareaHeight` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
   *
   * 구동 원리:
   * 1. 입력값(`e`)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
   * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
   * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
   *
   * 작동 결과:
   * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
   * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
   */
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
        'col-span-1 flex w-full flex-col gap-2 sm:col-span-2 lg:col-span-4 xl:col-span-5'
      }
    >
      <div className={'member-data-title'}>{title}</div>
      <div className={'flex flex-col items-start gap-2 lg:flex-row'}>
          <div className={'w-full'}>
          <div>{locale === 'ko' ? '에디터' : 'Editor'}</div>
          <textarea
            ref={textareaRef}
            name={name}
            placeholder={placeholder}
            onChange={(event) => {
              handleTextareaHeight(event)
            }}
            defaultValue={defaultValue ? defaultValue : ''}
            className={
              'member-data-input h-auto min-h-96 resize-none overflow-hidden'
            }
          />
        </div>
        <div className={'w-full'}>
          <div>{locale === 'ko' ? '미리보기' : 'Preview'}</div>
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
