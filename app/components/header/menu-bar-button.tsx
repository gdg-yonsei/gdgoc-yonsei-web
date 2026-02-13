'use client'

import { Bars2Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAtom } from 'jotai'
import { homeMenuBarState } from '@/lib/atoms'

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
export default function MenuBarButton() {
  const [isMenuOpen, setIsMenuOpen] = useAtom(homeMenuBarState)

  return (
    <button
      type={'button'}
      onClick={() => setIsMenuOpen(!isMenuOpen)}
      className={'md:hidden'}
      aria-expanded={isMenuOpen}
      aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
    >
      {isMenuOpen ? (
        <XMarkIcon className={'size-8 text-neutral-950'} />
      ) : (
        <Bars2Icon className={'size-8 text-neutral-950'} />
      )}
    </button>
  )
}
