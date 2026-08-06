'use client'

import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import Link from 'next/link'
import { homeMenuBarState } from '@/lib/atoms'
import type { Locale } from '@/i18n-config'
import { useAtom } from 'jotai'
import GDGLogo from '@/app/components/svg/gdg-logo'

export default function GDGLogoLinkButton({ lang }: { lang: Locale }) {
  const [, setIsMenuOpen] = useAtom(homeMenuBarState)

  return (
    <Link
      href={`/${lang}`}
      onClick={() => setIsMenuOpen(false)}
      aria-label={lang === 'ko' ? 'GDGoC Yonsei 홈' : 'GDGoC Yonsei home'}
      className="pressable focus-ring rounded-xl"
    >
      <GDGoCYonseiLogo className={'not-md:hidden'} />
      <GDGLogo className={'w-16 md:hidden md:w-24'} svgKey={'header'} />
    </Link>
  )
}
