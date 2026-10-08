'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpenIcon,
  CalendarDaysIcon,
  CodeBracketIcon,
  DocumentTextIcon,
  HomeIcon,
  MegaphoneIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'
import { useSetAtom } from 'jotai'
import { menuBarState } from '@/lib/admin/atoms'
import { isLocale } from '@/lib/i18n'
import type {
  NavigationItem,
  NavigationKey,
} from '@/app/(admin)/admin/navigation-list'
import { cn } from '@/lib/cn'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

/** 장식 아이콘을 라벨과 분리해 접근 가능한 이름에 기호가 섞이지 않게 한다. */
export const NAV_ICONS: Record<NavigationKey, IconComponent> = {
  home: HomeIcon,
  members: UsersIcon,
  sessions: BookOpenIcon,
  projects: DocumentTextIcon,
  generations: CalendarDaysIcon,
  parts: CodeBracketIcon,
  announcements: MegaphoneIcon,
  profile: UserCircleIcon,
}

/** proxy가 경로를 rewrite해도 브라우저에는 언어가 남아, 비교 전에 언어 접두사를 제거한다. */
function stripLocale(pathname: string) {
  const segments = pathname.split('/')
  const maybeLocale = segments[1] ?? ''
  if (isLocale(maybeLocale)) {
    return '/' + segments.slice(2).join('/')
  }
  return pathname
}

/** 활성 판정은 언어 접두사와 끝 슬래시를 무시한다. */
export function isNavItemActive(pathname: string, href: string) {
  const current = stripLocale(pathname).replace(/\/$/, '') || '/'
  const target = stripLocale(href).replace(/\/$/, '') || '/'

  // `/admin`은 정확히 일치할 때만 활성이다. 접두사로 비교하면 모든 하위 페이지에서 켜진다.
  if (target === '/admin') return current === '/admin'
  return current === target || current.startsWith(`${target}/`)
}

/** DESIGN.md ex-app-shell-row에 따라 활성 표시는 브랜드 primary 인디케이터를 쓴다. */
export default function NavItem({ item }: { item: NavigationItem }) {
  const pathname = usePathname()
  const setMenuOpen = useSetAtom(menuBarState)
  const active = isNavItemActive(pathname, item.path)
  const Icon = NAV_ICONS[item.key]

  return (
    <Link
      href={item.path}

      onClick={() => setMenuOpen(false)}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'type-body-sm relative flex min-h-11 items-center gap-3 rounded-sm px-3 py-1.5 transition-colors',
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
