'use client'

import { Bars2Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAtom } from 'jotai'
import { menuBarState } from '@/lib/atoms'

/**
 * 모바일 화면 상단 바 토글 버튼
 * @constructor
 */
export default function ToggleMenubarButton() {
  const [isOpen, setIsOpen] = useAtom(menuBarState)

  return (
    <button type={'button'} onClick={() => setIsOpen(!isOpen)}>
      {isOpen ? (
        <XMarkIcon className={'size-8'} />
      ) : (
        <Bars2Icon className={'size-8'} />
      )}
    </button>
  )
}
