'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, type CSSProperties } from 'react'
import { Bars2Icon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Locale } from '@/i18n-config'
import LocaleSwitch from '@/app/components/site/locale-switch'
import type {
  HeaderNavigationCopy,
  HeaderNavigationLink,
} from './navigation-links'

/*
 * Links and strings arrive as props from the server Header so this client
 * module never bundles the bilingual copy dictionary or tailwind-merge.
 */
type NavigationProps = {
  lang: Locale
  links: HeaderNavigationLink[]
  copy: HeaderNavigationCopy
}

function isCurrentPath(pathname: string | null, href: string) {
  if (!pathname) return false
  return pathname === href || pathname.startsWith(`${href}/`)
}

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
          prefetch={prefetch}
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
                  prefetch={link.prefetch}
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
          <LocaleSwitch lang={lang} pathname={pathname} label={copy.language} />
        </div>
      </dialog>
    </>
  )
}

export function NavigationFallback({ lang, links, copy }: NavigationProps) {
  return (
    <div className="flex items-center gap-1">
      <DesktopNavigation links={links} copy={copy} pathname={null} />
      <LocaleSwitch
        lang={lang}
        pathname={null}
        label={copy.language}
        className="not-md:hidden"
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
      />
      <MobileMenu lang={lang} links={links} copy={copy} pathname={pathname} />
    </div>
  )
}

export default function HeaderNavigation(props: NavigationProps) {
  const pathname = usePathname()

  // Remounting per path closes the menu after any navigation.
  return <NavigationForPath key={pathname} {...props} pathname={pathname} />
}
