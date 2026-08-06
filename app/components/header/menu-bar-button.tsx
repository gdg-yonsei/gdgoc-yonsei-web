'use client'

import { Bars2Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAtom } from 'jotai'
import { homeMenuBarState } from '@/lib/atoms'
import type { Locale } from '@/i18n-config'

export default function MenuBarButton({ lang }: { lang: Locale }) {
  const [isMenuOpen, setIsMenuOpen] = useAtom(homeMenuBarState)
  const label =
    lang === 'ko'
      ? isMenuOpen
        ? '탐색 메뉴 닫기'
        : '탐색 메뉴 열기'
      : isMenuOpen
        ? 'Close navigation menu'
        : 'Open navigation menu'

  return (
    <button
      type={'button'}
      onClick={() => setIsMenuOpen(!isMenuOpen)}
      className="pressable focus-ring flex size-12 items-center justify-center rounded-full hover:bg-neutral-200/80 md:hidden"
      aria-expanded={isMenuOpen}
      aria-controls="mobile-primary-navigation"
      aria-label={label}
    >
      {isMenuOpen ? (
        <XMarkIcon className={'size-8 text-neutral-950'} aria-hidden="true" />
      ) : (
        <Bars2Icon className={'size-8 text-neutral-950'} aria-hidden="true" />
      )}
    </button>
  )
}
