'use client'

import { Bars2Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAtom } from 'jotai'
import { homeMenuBarState } from '@/lib/atoms'

export default function MenuBarButton() {
  const [isMenuOpen, setIsMenuOpen] = useAtom(homeMenuBarState)

  return (
    <button type={'button'} onClick={() => setIsMenuOpen(!isMenuOpen)}>
      {isMenuOpen ? (
        <XMarkIcon className={'size-8 text-neutral-950'} />
      ) : (
        <Bars2Icon className={'size-8 text-neutral-950'} />
      )}
    </button>
  )
}
