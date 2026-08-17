'use client'

import { Bars2Icon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type KeyboardEvent, useRef, useState } from 'react'
import type { Locale } from '@/i18n-config'
import { getHeaderNavigationLinks } from './navigation-links'

function isCurrentPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavigationForPath({
  lang,
  pathname,
}: {
  lang: Locale
  pathname: string
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const links = getHeaderNavigationLinks(lang)
  const menuLabel =
    lang === 'ko'
      ? isMenuOpen
        ? '탐색 메뉴 닫기'
        : '탐색 메뉴 열기'
      : isMenuOpen
        ? 'Close navigation menu'
        : 'Open navigation menu'

  return (
    <>
      <button
        type="button"
        ref={toggleRef}
        onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && isMenuOpen) {
            event.preventDefault()
            setIsMenuOpen(false)
          }
        }}
        className="pressable focus-ring flex size-12 items-center justify-center rounded-full hover:bg-neutral-200/80 md:hidden"
        aria-expanded={isMenuOpen}
        aria-controls="mobile-primary-navigation"
        aria-label={menuLabel}
      >
        {isMenuOpen ? (
          <XMarkIcon className="size-8 text-neutral-950" aria-hidden="true" />
        ) : (
          <Bars2Icon className="size-8 text-neutral-950" aria-hidden="true" />
        )}
      </button>

      <nav
        aria-label={lang === 'ko' ? '주 메뉴' : 'Primary navigation'}
        className="flex items-center gap-1 text-base not-md:hidden lg:text-lg"
      >
        {links.map(({ href, label, prefetch }) => {
          const isCurrent = isCurrentPath(pathname, href)

          return (
            <Link
              key={href}
              href={href}
              prefetch={prefetch}
              aria-current={isCurrent ? 'page' : undefined}
              className={`navigation-link pressable focus-ring ${
                isCurrent ? 'bg-neutral-200 font-semibold text-neutral-950' : ''
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {isMenuOpen && (
        <nav
          id="mobile-primary-navigation"
          aria-label={
            lang === 'ko' ? '모바일 주 메뉴' : 'Mobile primary navigation'
          }
          onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
            if (event.key === 'Escape') {
              event.preventDefault()
              toggleRef.current?.focus()
              setIsMenuOpen(false)
            }
          }}
          className="mobile-navigation absolute top-full left-0 w-full border-t border-neutral-200 bg-neutral-100/95 p-2 text-lg shadow-sm backdrop-blur-md md:hidden"
        >
          <div className="grid gap-1">
            {links.map(({ href, label, prefetch }) => {
              const isCurrent = isCurrentPath(pathname, href)

              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={prefetch}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`pressable focus-ring flex min-h-12 w-full items-center rounded-xl px-4 ${
                    isCurrent
                      ? 'bg-neutral-200 font-semibold'
                      : 'hover:bg-neutral-200/70'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </>
  )
}

export default function HeaderNavigation({ lang }: { lang: Locale }) {
  const pathname = usePathname()

  return <NavigationForPath key={pathname} lang={lang} pathname={pathname} />
}
