'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { useAtom } from 'jotai'
import { homeMenuBarState } from '@/lib/atoms'
import { ReactNode } from 'react'
import { Locale } from '@/i18n-config'
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion'

function MotionLink({
  children,
  state,
}: {
  children: ReactNode
  state: boolean
}) {
  const shouldReduce = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: state ? 1 : 0 }}
      transition={shouldReduce ? { duration: 0 } : undefined}
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
    <div
      className={
        'grid w-full flex-col gap-2 text-lg transition-[grid-template-rows] duration-200 md:hidden'
      }
      style={{
        gridTemplateRows: isMenuOpen ? '1fr' : '0fr',
      }}
    >
      <div className="min-h-0 overflow-hidden">
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
            href={`/${lang}/project${lastGeneration ? '/' + lastGeneration : ''}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={'w-full'}
          >
            {lang === 'ko' ? '프로젝트' : 'Projects'}
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
              href={`/${lang}/admin`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={'w-full'}
            >
              GYMS
            </Link>
          </MotionLink>
        )}
      </div>
    </div>
  )
}
