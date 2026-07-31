'use client'

import { Bars2Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAtom } from 'jotai'
import { homeMenuBarState } from '@/lib/atoms'
import type { Locale } from '@/i18n-config'

/**
 * `MenuBarButton` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
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
