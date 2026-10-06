'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'
import { menuBarState } from '@/lib/admin/atoms'
import { NAV_ICONS, isNavItemActive } from '@/app/components/admin/nav-item'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import type { NavigationItem } from '@/app/(admin)/admin/navigation-list'
import { cn } from '@/lib/cn'

const MAX_TABS = 4

/** 엄지가 닿는 하단에 목적지를 두며, navigations는 이미 권한으로 걸러진 목록이다. */
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
    // 사이드바·드로어와 다른 랜드마크 이름을 써 보조기술과 테스트에서 중복을 피한다.

    <nav
      aria-label={t('menu')}
      className={
        'border-hairline bg-surface fixed inset-x-0 bottom-0 z-20 border-t lg:hidden'
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
