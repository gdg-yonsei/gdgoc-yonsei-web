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

/** 앱 바 높이는 56px이며, 드로어와 데스크톱 사이드바는 같은 SidebarContent로 메뉴 구성을 공유한다. */
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
      {}
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
