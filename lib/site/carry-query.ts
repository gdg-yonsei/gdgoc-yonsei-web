import type { SyntheticEvent } from 'react'

// 언어 전환 직전 현재 쿼리를 복사해 세션·프로젝트 필터를 다른 언어에서도 유지한다.
export function carryQueryString(event: SyntheticEvent<HTMLElement>) {
  const { target } = event
  if (!(target instanceof Element)) return
  const link = target.closest('a[hreflang]')
  if (!(link instanceof HTMLAnchorElement)) return

  const url = new URL(link.getAttribute('href') ?? '/', window.location.origin)
  url.search = window.location.search
  link.setAttribute('href', `${url.pathname}${url.search}`)
}
