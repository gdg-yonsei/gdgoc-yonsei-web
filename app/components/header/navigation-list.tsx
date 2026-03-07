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

/**
 * `NavigationList` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
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
