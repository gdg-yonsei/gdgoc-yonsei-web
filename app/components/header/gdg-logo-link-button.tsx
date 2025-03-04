'use client'

import GDGoCYonseiLogo from '@/app/components/svg/gdgoc-yonsei-logo'
import Link from 'next/link'
import { homeMenuBarState } from '@/lib/atoms'
import { useAtom } from 'jotai'
import GDGLogo from '@/app/components/svg/gdg-logo'

export default function GDGLogoLinkButton() {
  const [, setIsMenuOpen] = useAtom(homeMenuBarState)

  return (
    <Link href={'/'} onClick={() => setIsMenuOpen(false)}>
      <GDGoCYonseiLogo className={'not-md:hidden'} />
      <GDGLogo className={'w-16 md:w-24 md:hidden'} svgKey={'header'} />
    </Link>
  )
}
