/**
 * 관리자 사이드바 본문(서버 컴포넌트): 기수 범위, 메뉴, 사용자 카드, 유틸리티 버튼.
 */
import Link from 'next/link'
import { NavigationItem } from '@/app/(admin)/admin/navigation-list'
import GDGLogo from '@/app/components/svg/gdg-logo'
import NavItem from '@/app/components/admin/nav-item'
import UserAuthControlPanel from '@/app/components/admin/user-auth-control-panel'
import AdminGenerationScopeBar from '@/app/components/admin/admin-generation-scope-bar'
import HomePageButton from '@/app/components/admin/home-page-button'
import RefreshAllDataButton from '@/app/components/admin/refresh-all-data-button'
import { Locale } from '@/lib/i18n'
import { getAdminMessages, localizeAdminHref } from '@/lib/admin-i18n'
import { type ResolvedAdminGenerationScope } from '@/lib/server/admin-generation-scope'

/**
 * 관리자 브랜드 표시(GDG 로고 + "GYMS"). 누르면 관리자 홈으로 간다.
 */
export function AdminBrand({ locale }: { locale: Locale }) {
  return (
    <Link
      href={localizeAdminHref('/admin', locale)}
      className={
        'text-ink focus-visible:outline-primary flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2'
      }
    >
      <GDGLogo className={'h-6 w-11'} />
      <span className={'type-title'}>GYMS</span>
    </Link>
  )
}

/**
 * 데스크톱 사이드바와 모바일 드로어가 공유하는 내비게이션 본문.
 *
 * 두 곳이 같은 컴포넌트를 써야 메뉴 구성과 스타일이 어긋나지 않는다.
 * @param navigations 권한으로 걸러진 메뉴 목록
 * @param resolvedScope 서버에서 해석한 기수 범위
 */
export default function SidebarContent({
  navigations,
  locale,
  resolvedScope,
}: {
  navigations: NavigationItem[]
  locale: Locale
  resolvedScope: ResolvedAdminGenerationScope
}) {
  const t = getAdminMessages(locale)

  return (
    <>
      <div className={'shrink-0 px-3 pt-3'}>
        <AdminGenerationScopeBar
          locale={locale}
          resolvedScope={resolvedScope}
          variant={'sidebar'}
        />
      </div>

      <nav
        aria-label={t.mainNavigation}
        className={'min-h-0 flex-1 overflow-y-auto px-2 py-2'}
      >
        <ul className={'flex flex-col gap-0.5'}>
          {navigations.map((item) => (
            <li key={item.key}>
              <NavItem item={item} />
            </li>
          ))}
        </ul>
      </nav>

      <div
        className={'border-hairline flex shrink-0 flex-col gap-2 border-t p-3'}
      >
        <UserAuthControlPanel />
        <div className={'flex items-center gap-2'}>
          <HomePageButton locale={locale} />
          <RefreshAllDataButton />
        </div>
      </div>
    </>
  )
}
