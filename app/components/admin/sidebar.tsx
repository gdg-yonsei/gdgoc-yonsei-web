import { NavigationItem } from '@/app/(admin)/admin/navigation-list'
import SidebarContent, {
  AdminBrand,
} from '@/app/components/admin/sidebar-content'
import ThemeToggle from '@/app/components/admin/theme-toggle'
import { Locale } from '@/lib/i18n'
import { type ResolvedAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import type { AdminTheme } from '@/lib/admin-theme'

/** DESIGN.md의 surface·canvas를 hairline으로 나눈다.
 * 사이드바 w-64와 admin/layout의 lg:pl-64는 본문이 가리지 않게 반드시 같아야 한다. */
export default function Sidebar({
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
    <div
      className={
        'border-hairline bg-surface fixed top-0 left-0 z-20 hidden h-dvh w-64 flex-col border-r lg:flex'
      }
    >
      <div
        className={
          'border-hairline flex h-14 shrink-0 items-center justify-between border-b pr-2 pl-4'
        }
      >
        <AdminBrand locale={locale} />
        <ThemeToggle theme={theme} />
      </div>
      <SidebarContent
        navigations={navigations}
        locale={locale}
        resolvedScope={resolvedScope}
      />
    </div>
  )
}
