/**
 * 관리자 데스크톱 고정 사이드바(서버 컴포넌트).
 */
import { NavigationItem } from '@/app/(admin)/admin/navigation-list'
import SidebarContent, {
  AdminBrand,
} from '@/app/components/admin/sidebar-content'
import ThemeToggle from '@/app/components/admin/theme-toggle'
import { Locale } from '@/lib/i18n'
import { type ResolvedAdminGenerationScope } from '@/lib/server/admin-generation-scope'
import type { AdminTheme } from '@/lib/admin-theme'

/**
 * 데스크톱(lg 이상) 고정 사이드바.
 *
 * DESIGN.md의 figure/ground를 따라 사이드바는 `surface`(흰 면), 페이지 본문은
 * 따뜻한 `canvas`를 쓰고, 경계는 그림자 대신 hairline으로 나눈다.
 *
 * 폭 `w-64`는 `app/(admin)/admin/layout.tsx`의 `lg:pl-64`와 반드시 같아야 한다.
 * 한쪽만 바꾸면 본문이 사이드바에 가려지거나 틈이 생긴다.
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
