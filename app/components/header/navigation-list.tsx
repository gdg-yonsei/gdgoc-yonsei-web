'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useAtom } from 'jotai'
import { homeMenuBarState } from '@/lib/atoms'
import { ReactNode } from 'react'
import { Locale } from '@/i18n-config'

/**
 * Link 컴포넌트에 애니메이션을 주기 위한 컴포넌트
 * @param children - Link 컴포넌트
 * @param state - 애니메이션 상태
 * @constructor
 */
function MotionLink({
  children,
  state,
}: {
  children: ReactNode
  state: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: state ? 1 : 0 }}
      className={'flex w-full p-1 px-4 last:pb-4'}
    >
      {children}
    </motion.div>
  )
}

export default function NavigationList({
  lang,
  lastGeneration,
  isMember,
}: {
  lang: Locale
  lastGeneration: string | undefined
  isMember: boolean
}) {
  const [isMenuOpen, setIsMenuOpen] = useAtom(homeMenuBarState)

  return (
    <motion.div
      initial={{ height: 0, visibility: 'hidden' }}
      animate={{
        height: isMenuOpen ? 'auto' : 0,
        visibility: isMenuOpen ? 'visible' : 'hidden',
      }}
      transition={{ duration: 0.2 }}
      className={'flex w-full flex-col gap-2 text-lg md:hidden'}
    >
      <MotionLink state={isMenuOpen}>
        <Link
          href={`/${lang}/project${lastGeneration ? '/' + lastGeneration : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={'w-full'}
        >
          {lang === 'ko' ? '프로젝트' : 'Projects'}
        </Link>
      </MotionLink>
      <MotionLink state={isMenuOpen}>
        <Link
          href={`/${lang}/session${lastGeneration ? '/' + lastGeneration : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={'w-full'}
        >
          {lang === 'ko' ? '세션' : 'Sessions'}
        </Link>
      </MotionLink>
      <MotionLink state={isMenuOpen}>
        <Link
          href={`/${lang}/calendar`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={'w-full'}
        >
          {lang === 'ko' ? '캘린더' : 'Calendar'}
        </Link>
      </MotionLink>
      <MotionLink state={isMenuOpen}>
        <Link
          href={`/${lang}/member${lastGeneration ? '/' + lastGeneration : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={'w-full'}
        >
          {lang === 'ko' ? '구성원' : 'Members'}
        </Link>
      </MotionLink>
      {isMember && (
        <MotionLink state={isMenuOpen}>
          <Link
            href={'/admin'}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={'w-full'}
          >
            GYMS
          </Link>
        </MotionLink>
      )}
      {/*<MotionLink state={isMenuOpen}>*/}
      {/*  <Link*/}
      {/*    href={'/recruit'}*/}
      {/*    onClick={() => setIsMenuOpen(!isMenuOpen)}*/}
      {/*    className={'w-full'}*/}
      {/*  >*/}
      {/*    Recruit*/}
      {/*  </Link>*/}
      {/*</MotionLink>*/}
    </motion.div>
  )
}
