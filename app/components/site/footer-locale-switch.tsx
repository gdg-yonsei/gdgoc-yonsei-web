'use client'

/**
 * 푸터의 언어 전환(클라이언트 컴포넌트). 현재 경로를 읽어 같은 페이지의 다른 언어로 보낸다.
 */
import { usePathname } from 'next/navigation'
import type { Locale } from '@/lib/i18n'
import { carryQueryString } from '@/lib/site/carry-query'
import LocaleSwitch from './locale-switch'

/** 현재 경로와 쿼리 문자열을 유지한 채 언어만 바꾸는 링크. */
export default function FooterLocaleSwitch({
  lang,
  label,
}: {
  lang: Locale
  label: string
}) {
  return (
    <LocaleSwitch
      lang={lang}
      pathname={usePathname()}
      label={label}
      onIntent={carryQueryString}
    />
  )
}
