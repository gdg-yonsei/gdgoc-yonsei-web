'use client'

import { usePathname } from 'next/navigation'
import type { Locale } from '@/lib/i18n'
import { carryQueryString } from '@/lib/site/carry-query'
import LocaleSwitch from './locale-switch'

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
