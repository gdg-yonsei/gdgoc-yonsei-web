'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { menuBarState } from '@/lib/atoms'
import { NAV_ICONS, isNavItemActive } from '@/app/components/admin/nav-item'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { NavigationItem } from '@/app/(admin)/admin/navigation-list'
import { cn } from '@/lib/cn'

/** 하단 탭에 노출할 최대 개수. 나머지는 '더보기' 드로어로 넘깁니다. */
const MAX_TABS = 4

/**
 * 모바일 하단 탭 바.
 *
 * 관리자 화면 대부분이 한 손 조작이라, 자주 쓰는 목적지를 엄지 도달 범위인
 * 화면 하단에 고정합니다. `navigations`는 이미 권한 필터링을 거친 목록이므로
 * 사용자가 접근 못 하는 탭은 애초에 들어오지 않습니다.
 */
export default function MobileTabBar({
  navigations,
}: {
  navigations: NavigationItem[]
}) {
  const pathname = usePathname()
  const setMenuOpen = useSetAtom(menuBarState)
  const { t } = useAdminI18n()

  const tabs = navigations.slice(0, MAX_TABS)
  const hasOverflow = navigations.length > MAX_TABS

  if (tabs.length === 0) return null

  return (
    // 사이드바/드로어의 `mainNavigation`과 다른 이름을 씁니다. 같은 이름이면
    // 랜드마크가 중복되어 보조기술과 테스트 모두에서 모호해집니다.
    <nav
      aria-label={t('menu')}
      className={
        'border-hairline bg-surface/90 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur-md lg:hidden'
      }
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className={'flex items-stretch'}>
        {tabs.map((item) => {
          const active = isNavItemActive(pathname, item.path)
          const Icon = NAV_ICONS[item.key]
          return (
            <li key={item.key} className={'flex-1'}>
              <Link
                href={item.path}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition-colors',
                  'focus-visible:outline-primary focus-visible:outline-2 focus-visible:-outline-offset-2',
                  active ? 'text-primary' : 'text-ink-muted'
                )}
              >
                <Icon
                  className={cn('size-6', active && 'stroke-2')}
                  aria-hidden={'true'}
                />
                <span
                  className={'type-eyebrow max-w-full truncate font-medium'}
                >
                  {item.name}
                </span>
              </Link>
            </li>
          )
        })}
        {hasOverflow && (
          <li className={'flex-1'}>
            <button
              type={'button'}
              onClick={() => setMenuOpen(true)}
              className={
                'text-ink-muted hover:text-ink focus-visible:outline-primary flex min-h-14 w-full cursor-pointer flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2'
              }
            >
              <EllipsisHorizontalIcon
                className={'size-6'}
                aria-hidden={'true'}
              />
              <span className={'type-eyebrow max-w-full truncate font-medium'}>
                {t('more')}
              </span>
            </button>
          </li>
        )}
      </ul>
    </nav>
  )
}
