import { NavigationItem } from '@/app/(admin)/admin/navigation-list'
import SidebarContent, {
  AdminBrand,
} from '@/app/components/admin/sidebar-content'
import ThemeToggle from '@/app/components/admin/theme-toggle'
import { Locale } from '@/i18n-config'
import { type ResolvedAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import type { AdminTheme } from '@/lib/admin-theme'

/**
 * 데스크탑(lg 이상) 고정 사이드바.
 *
 * DESIGN.md의 figure/ground를 따라 사이드바는 `surface`(흰 면),
 * 페이지 본문은 따뜻한 `canvas`를 씁니다. 경계는 그림자가 아닌 hairline입니다.
 *
 * 폭은 `w-64`로, `app/(admin)/admin/layout.tsx`의 `lg:pl-64`와 정확히 맞춥니다.
 * (이전에는 `w-60` 사이드바에 `lg:pl-64` 본문이라 16px이 어긋나 있었습니다.)
 */
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
