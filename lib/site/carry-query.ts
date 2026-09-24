import type { SyntheticEvent } from 'react'

/**
 * Locale links are rendered from the pathname; the Session Log and project
 * hubs keep their filters in the query string. Just before a locale link is
 * used (hover, focus, click), copy the current query onto it so a filtered
 * page stays filtered in the other language.
 */
export function carryQueryString(event: SyntheticEvent<HTMLElement>) {
  const { target } = event
  if (!(target instanceof Element)) return
  const link = target.closest('a[hreflang]')
  if (!(link instanceof HTMLAnchorElement)) return

  const url = new URL(link.getAttribute('href') ?? '/', window.location.origin)
  url.search = window.location.search
  link.setAttribute('href', `${url.pathname}${url.search}`)
}
