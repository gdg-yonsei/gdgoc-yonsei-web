/** 클릭한 링크를 핵심 이벤트(CTA), 연락처, 다운로드, 외부 링크로 나눈다. 쿼리는 개인정보가 섞일 수 있어 보내지 않는다. */
import type { ClickKind } from '@/lib/analytics/events'

export type ClassifiedClick = {
  kind: ClickKind
  label?: string
  targetUrl?: string
}

const DOWNLOAD_PATTERN =
  /\.(pdf|zip|pptx?|docx?|xlsx?|csv|hwpx?|key|dmg|apk|ics)$/i

function parse(href: string, base: string) {
  try {
    return new URL(href, base)
  } catch {
    return null
  }
}

function describeTarget(url: URL, pageOrigin: string) {
  if (url.protocol === 'mailto:' || url.protocol === 'tel:')
    return url.href.split('?')[0]
  if (url.origin === pageOrigin) return url.pathname
  return `${url.protocol === 'webcal:' ? 'webcal://' + url.host : url.origin}${url.pathname}`
}

/** 집계할 필요가 없는 내부 링크는 null. */
export function classifyClick(
  link: { href: string | null; ctaLabel: string | null; download: boolean },
  pageOrigin: string
): ClassifiedClick | null {
  const url = link.href ? parse(link.href, pageOrigin) : null
  const targetUrl = url ? describeTarget(url, pageOrigin) : undefined
  const label = link.ctaLabel?.trim().slice(0, 100)

  if (label) return { kind: 'cta', label, targetUrl }
  if (!url) return null
  if (url.protocol === 'mailto:' || url.protocol === 'tel:')
    return { kind: 'contact', targetUrl }
  if (link.download || DOWNLOAD_PATTERN.test(url.pathname))
    return { kind: 'download', targetUrl }
  if (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    url.origin !== pageOrigin
  ) {
    return { kind: 'outbound', targetUrl }
  }
  return null
}
