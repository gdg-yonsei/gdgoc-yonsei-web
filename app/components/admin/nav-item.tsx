'use client'

/**
 * 관리자 사이드바·드로어·하단 탭이 공유하는 내비게이션 항목, 아이콘 표, 활성 판정(클라이언트 컴포넌트).
 */
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
import { menuBarState } from '@/lib/admin/atoms'
import { isLocale } from '@/lib/i18n'
import type {
  NavigationItem,
  NavigationKey,
} from '@/app/(admin)/admin/navigation-list'
import { cn } from '@/lib/cn'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

/**
 * 메뉴 키별 아이콘. 아이콘을 라벨 문자열과 분리해 두어야 접근 가능한 이름에
 * 장식 기호가 섞이지 않는다.
 */
export const NAV_ICONS: Record<NavigationKey, IconComponent> = {
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
 * 경로 앞의 언어 세그먼트를 제거한다.
 * `proxy.ts`가 `/ko/admin/*`를 `/admin/*`로 rewrite하지만 브라우저 URL은 로케일이
 * 붙은 채 남아 있으므로, 두 형태를 같은 값으로 정규화해 비교한다.
 */
function stripLocale(pathname: string) {
  const segments = pathname.split('/')
  const maybeLocale = segments[1] ?? ''
  if (isLocale(maybeLocale)) {
    return '/' + segments.slice(2).join('/')
  }
  return pathname
}

/**
 * 현재 경로에서 메뉴 항목이 활성인지. 언어 접두사 유무와 끝 슬래시를 무시하고 비교한다.
 *
 * @param pathname 브라우저의 현재 경로
 * @param href 메뉴 항목 경로
 */
export function isNavItemActive(pathname: string, href: string) {
  const current = stripLocale(pathname).replace(/\/$/, '') || '/'
  const target = stripLocale(href).replace(/\/$/, '') || '/'

  // `/admin`은 정확히 일치할 때만 활성이다. 접두사로 비교하면 모든 하위 페이지에서 켜진다.
  if (target === '/admin') return current === '/admin'
  return current === target || current.startsWith(`${target}/`)
}

/**
 * 사이드바 · 드로어의 네비게이션 행.
 *
 * DESIGN.md `ex-app-shell-row`: 활성 표시는 브랜드 primary 인디케이터를 쓴다.
 */
export default function NavItem({ item }: { item: NavigationItem }) {
  const pathname = usePathname()
  const setMenuOpen = useSetAtom(menuBarState)
  const active = isNavItemActive(pathname, item.path)
  const Icon = NAV_ICONS[item.key]

  return (
    <Link
      href={item.path}
      // 모바일 드로어 안에서 눌렀을 때 드로어를 닫는다. 데스크톱에서는 영향이 없다.
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
