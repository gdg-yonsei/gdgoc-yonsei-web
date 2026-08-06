'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpenIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  HomeIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'
import { useSetAtom } from 'jotai'
import { menuBarState } from '@/lib/atoms'
import { i18n } from '@/i18n-config'
import type {
  NavigationItem,
  NavigationKey,
} from '@/app/(admin)/admin/navigation-list'
import { cn } from '@/lib/cn'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

/**
 * 이전에는 이모지가 `item.name` 문자열 안에 박혀 있어 라벨과 분리할 수 없었고,
 * 접근 가능한 이름에도 `"🗓️ Generations"`처럼 섞여 들어갔습니다.
 */
const NAV_ICONS: Record<NavigationKey, IconComponent> = {
  home: HomeIcon,
  members: UsersIcon,
  sessions: BookOpenIcon,
  projects: DocumentTextIcon,
  generations: CalendarDaysIcon,
  parts: CodeBracketIcon,
  booking: BuildingOffice2Icon,
  profile: UserCircleIcon,
}

/**
 * 경로 앞의 로케일 세그먼트를 제거합니다.
 * `proxy.ts`가 `/ko/admin/*`를 `/admin/*`로 rewrite하지만 브라우저 URL은 로케일이
 * 붙은 채 남아 있으므로, 두 형태를 모두 같은 값으로 정규화해 비교합니다.
 */
function stripLocale(pathname: string) {
  const segments = pathname.split('/')
  const maybeLocale = segments[1] ?? ''
  if ((i18n.locales as readonly string[]).includes(maybeLocale)) {
    return '/' + segments.slice(2).join('/')
  }
  return pathname
}

export function isNavItemActive(pathname: string, href: string) {
  const current = stripLocale(pathname).replace(/\/$/, '') || '/'
  const target = stripLocale(href).replace(/\/$/, '') || '/'

  // `/admin`은 정확히 일치할 때만 활성. 그렇지 않으면 모든 하위 페이지에서 켜집니다.
  if (target === '/admin') return current === '/admin'
  return current === target || current.startsWith(`${target}/`)
}

/**
 * 사이드바 · 드로어의 네비게이션 행.
 *
 * DESIGN.md `ex-app-shell-row`: 활성 표시는 브랜드 primary 인디케이터를 씁니다.
 */
export default function NavItem({ item }: { item: NavigationItem }) {
  const pathname = usePathname()
  const setMenuOpen = useSetAtom(menuBarState)
  const active = isNavItemActive(pathname, item.path)
  const Icon = NAV_ICONS[item.key]

  return (
    <Link
      href={item.path}
      // 모바일 드로어 안에서 눌렀을 때 스스로 닫습니다. 데스크탑에서는 무해합니다.
      onClick={() => setMenuOpen(false)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'type-body-sm relative flex min-h-10 items-center gap-3 rounded-sm px-3 py-1.5 transition-colors',
        'focus-visible:outline-primary focus-visible:outline-2 focus-visible:outline-offset-2',
        active
          ? 'bg-primary-soft text-primary font-semibold'
          : 'text-ink-secondary hover:bg-canvas hover:text-ink'
      )}
    >
      {active && (
        <span
          aria-hidden={'true'}
          className={
            'bg-primary absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-full'
          }
        />
      )}
      <Icon className={'size-5 shrink-0'} aria-hidden={'true'} />
      <span className={'truncate'}>{item.name}</span>
    </Link>
  )
}

export { NAV_ICONS }
