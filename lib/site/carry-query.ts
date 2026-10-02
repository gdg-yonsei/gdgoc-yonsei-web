/**
 * 언어 전환 링크에 현재 필터(쿼리 문자열)를 이어 붙이는 클라이언트 헬퍼.
 */
import type { SyntheticEvent } from 'react'

/**
 * 언어 전환 링크는 경로만으로 만들어지지만, 세션 기록·프로젝트 허브는 필터를 쿼리
 * 문자열에 둔다. 링크를 쓰기 직전(호버, 포커스, 클릭)에 현재 쿼리를 링크에 복사해, 필터를
 * 건 페이지가 다른 언어에서도 같은 필터를 유지하게 한다.
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
