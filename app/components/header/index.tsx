import GDGLogoLinkButton from '@/app/components/header/gdg-logo-link-button'
import MenuBarButton from './menu-bar-button'
import DesktopNavigationList from '@/app/components/header/desktop-navigation-list'
import NavigationList from '@/app/components/header/navigation-list'
import { auth } from '@/auth'
import type { Locale } from '@/i18n-config'
import { getLatestGeneration } from '@/lib/server/queries/public/generations'

/**
 * `Header` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`lang`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
export default async function Header({ lang }: { lang: Locale }) {
  const lastGeneration = await getLatestGeneration(lang)
  const isMember = !!(await auth())?.user?.id

  return (
    <div className={'fixed top-0 left-0 z-10 w-full bg-neutral-100'}>
      <div className={'flex items-center justify-between p-4'}>
        <GDGLogoLinkButton />
        <MenuBarButton />
        <DesktopNavigationList lang={lang} />
      </div>
      <NavigationList
        lang={lang}
        lastGeneration={lastGeneration?.name}
        isMember={isMember}
      />
    </div>
  )
}
