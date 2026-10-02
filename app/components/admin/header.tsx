/**
 * 관리자 모바일 상단 앱 바와 메뉴 드로어(서버 컴포넌트).
 */
import ToggleMenubarButton from '@/app/components/admin/toggle-menubar-button'
import MenuBar from '@/app/components/admin/menu-bar'
import ThemeToggle from '@/app/components/admin/theme-toggle'
import { NavigationItem } from '@/app/(admin)/admin/navigation-list'
import SidebarContent, {
  AdminBrand,
} from '@/app/components/admin/sidebar-content'
import { Locale } from '@/lib/i18n'
import { type ResolvedAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import type { AdminTheme } from '@/lib/admin-theme'

/**
 * 모바일(lg 미만) 상단 앱 바.
 *
 * 바는 고정 높이(56px)이고, 메뉴는 `MenuBar`가 왼쪽에서 밀려 들어오는 드로어로 띄운다.
 * 드로어 안에는 데스크톱 사이드바와 같은 `SidebarContent`를 넣어 메뉴 구성을 한 곳에서 관리한다.
 */
export default function Header({
  navigations,
  locale,
  resolvedScope,
  theme,
}: {
  navigations: NavigationItem[]
  locale: Locale
  resolvedScope: ResolvedAdminGenerationScope
  theme: AdminTheme
}) {
  return (
    <>
      <header
        className={
          'border-hairline bg-surface/85 sticky top-0 z-20 flex h-14 w-full items-center justify-between gap-2 border-b pr-2 pl-3 backdrop-blur-md lg:hidden'
        }
      >
        <div className={'flex items-center gap-1'}>
          <ToggleMenubarButton />
          <AdminBrand locale={locale} />
        </div>
        <ThemeToggle theme={theme} />
      </header>
      {/* 드로어 본문은 서버에서 렌더한 사이드바 내용을 그대로 재사용합니다. */}
      <MenuBar>
        <SidebarContent
          navigations={navigations}
          locale={locale}
          resolvedScope={resolvedScope}
        />
      </MenuBar>
    </>
  )
}
