'use client'

/** 보고서 탭. 탭을 옮겨도 필터 쿼리를 그대로 들고 간다. */
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useAdminI18n } from '@/app/components/admin/admin-i18n-provider'
import { localizeAdminHref, type AdminMessageKey } from '@/lib/admin-i18n'
import { cn } from '@/lib/cn'

export const ANALYTICS_TABS: Array<{ path: string; label: AdminMessageKey }> = [
  { path: '/admin/analytics', label: 'analyticsTabOverview' },
  { path: '/admin/analytics/acquisition', label: 'analyticsTabAcquisition' },
  { path: '/admin/analytics/engagement', label: 'analyticsTabEngagement' },
  { path: '/admin/analytics/audience', label: 'analyticsTabAudience' },
  { path: '/admin/analytics/performance', label: 'analyticsTabPerformance' },
  { path: '/admin/analytics/search', label: 'analyticsTabSearch' },
  { path: '/admin/analytics/explore', label: 'analyticsTabExplore' },
]

function stripLocale(pathname: string) {
  return pathname.replace(/^\/(en|ko)(?=\/admin)/, '')
}

export default function AnalyticsTabs() {
  const { t, locale } = useAdminI18n()
  const pathname = stripLocale(usePathname())
  const query = useSearchParams().toString()

  return (
    <nav
      aria-label={t('analyticsTabsLabel')}
      className={'-mx-1 overflow-x-auto'}
    >
      <ul className={'flex min-w-max gap-1 px-1'}>
        {ANALYTICS_TABS.map((tab) => {
          const active =
            tab.path === '/admin/analytics'
              ? pathname === tab.path
              : pathname.startsWith(tab.path)
          return (
            <li key={tab.path}>
              <Link
                href={`${localizeAdminHref(tab.path, locale)}${query ? `?${query}` : ''}`}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'type-body-sm inline-flex min-h-11 items-center rounded-md px-3 font-medium transition-colors',
                  'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
                  active
                    ? 'bg-primary-soft text-primary'
                    : 'text-ink-muted hover:bg-canvas hover:text-ink'
                )}
              >
                {t(tab.label)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
