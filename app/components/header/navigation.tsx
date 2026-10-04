'use client'

/**
 * 공개 사이트 헤더 내비게이션(클라이언트 컴포넌트): 데스크톱 링크, 언어 전환, 모바일 메뉴.
 *
 * 링크와 문구는 서버 헤더가 props로 넘긴다. 그래서 이 모듈은 이중 언어 사전이나
 * tailwind-merge를 클라이언트 번들에 넣지 않는다.
 */
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, type CSSProperties } from 'react'
import { Bars2Icon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Locale } from '@/lib/i18n'
import LocaleSwitch from '@/app/components/site/locale-switch'
import { carryQueryString } from '@/lib/site/carry-query'
import type {
  HeaderNavigationCopy,
  HeaderNavigationLink,
} from './navigation-links'

/** 서버 헤더가 넘기는 언어, 링크, 문구. */
type NavigationProps = {
  lang: Locale
  links: HeaderNavigationLink[]
  copy: HeaderNavigationCopy
}

/** 현재 경로가 링크 경로이거나 그 하위 경로인지(`aria-current` 표시용). */
function isCurrentPath(pathname: string | null, href: string) {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** 데스크톱 가로 링크 목록. `pathname`이 null이면(대체 UI) 현재 위치 표시를 하지 않는다. */
function DesktopNavigation({
  links,
  copy,
  pathname,
}: Omit<NavigationProps, 'lang'> & { pathname: string | null }) {
  return (
    <nav
      aria-label={copy.primaryNav}
      className="flex items-center gap-0.5 not-md:hidden"
    >
      {links.map(({ href, label, prefetch, utility }) => (
        <Link
          key={href}
          href={href}
          prefetch={prefetch ?? null}
          aria-current={isCurrentPath(pathname, href) ? 'page' : undefined}
          className={
            utility ? 'site-nav-link site-nav-utility' : 'site-nav-link'
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}

/**
 * 모바일 전체 화면 메뉴. 네이티브 `<dialog>`의 `showModal()`을 써서 포커스 가두기와
 * ESC 닫기를 브라우저에 맡긴다.
 */
function MobileMenu({
  lang,
  links,
  copy,
  pathname,
}: NavigationProps & { pathname: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  const openMenu = () => {
    dialogRef.current?.showModal()
    setIsOpen(true)
  }
  const closeMenu = () => dialogRef.current?.close()

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="mobile-primary-navigation"
        aria-label={copy.openMenu}
        className="site-icon-button md:hidden"
      >
        <Bars2Icon className="size-6" aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        id="mobile-primary-navigation"
        aria-label={copy.menu}
        onClose={() => setIsOpen(false)}
        className="mobile-menu"
      >
        <div className="flex h-14 items-center justify-between pl-3">
          <span
            aria-hidden="true"
            className="font-code text-on-stage-muted text-xs tracking-[0.12em]"
          >
            {'<menu />'}
          </span>
          <button
            type="button"
            onClick={closeMenu}
            aria-label={copy.closeMenu}
            className="site-icon-button"
          >
            <XMarkIcon className="size-6" aria-hidden="true" />
          </button>
        </div>
        <nav aria-label={copy.mobileNav} className="px-3 pt-6">
          <ul>
            {links.map((link, index) => (
              <li
                key={link.href}
                className="mobile-menu-item"
                style={{ '--i': index } as CSSProperties}
              >
                <Link
                  href={link.href}
                  prefetch={link.prefetch ?? null}
                  onClick={closeMenu}
                  aria-current={
                    isCurrentPath(pathname, link.href) ? 'page' : undefined
                  }
                  className={
                    link.utility
                      ? 'mobile-menu-link mobile-menu-utility'
                      : 'mobile-menu-link'
                  }
                >
                  <span>{link.label}</span>
                  <span
                    aria-hidden="true"
                    className="font-code text-on-stage-muted text-sm"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div
          className="mobile-menu-item mt-10 px-3"
          style={{ '--i': links.length } as CSSProperties}
        >
          <LocaleSwitch
            lang={lang}
            pathname={pathname}
            label={copy.language}
            onIntent={carryQueryString}
          />
        </div>
      </dialog>
    </>
  )
}

/**
 * 경로를 읽기 전(Suspense 대체 UI)에 보여 줄 내비게이션. 모양은 같고 현재 위치 표시와
 * 모바일 메뉴 동작만 빠진다.
 */
export function NavigationFallback({ lang, links, copy }: NavigationProps) {
  return (
    <div className="flex items-center gap-1">
      <DesktopNavigation links={links} copy={copy} pathname={null} />
      <LocaleSwitch
        lang={lang}
        pathname={null}
        label={copy.language}
        className="not-md:hidden"
        onIntent={carryQueryString}
      />
      <button
        type="button"
        disabled
        aria-label={copy.loadingMenu}
        className="site-icon-button md:hidden"
      >
        <Bars2Icon className="size-6" aria-hidden="true" />
      </button>
    </div>
  )
}

/** 현재 경로를 반영한 데스크톱 링크, 언어 전환, 모바일 메뉴. */
function NavigationForPath({
  lang,
  links,
  copy,
  pathname,
}: NavigationProps & { pathname: string }) {
  return (
    <div className="flex items-center gap-1">
      <DesktopNavigation links={links} copy={copy} pathname={pathname} />
      <LocaleSwitch
        lang={lang}
        pathname={pathname}
        label={copy.language}
        className="not-md:hidden"
        onIntent={carryQueryString}
      />
      <MobileMenu lang={lang} links={links} copy={copy} pathname={pathname} />
    </div>
  )
}

/** `usePathname()`으로 현재 경로를 읽어 내비게이션을 그린다. */
export default function HeaderNavigation(props: NavigationProps) {
  const pathname = usePathname()

  // 경로마다 key를 바꿔 다시 마운트하면, 이동 후 열려 있던 모바일 메뉴가 저절로 닫힌다.
  return <NavigationForPath key={pathname} {...props} pathname={pathname} />
}
