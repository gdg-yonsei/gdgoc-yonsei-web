import Link from 'next/link'
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/lib/i18n'
import type { GenerationRef } from '@/lib/site/generations'
import { generationPath, localeHref } from '@/lib/site/routes'

/** 다른 기수로 이동할 때 크로스페이드한다.
 * 화살표 문자는 Google Sans Flex 기호 서브셋을 추가 다운로드하므로 SVG를 쓴다. */
export default function GenerationPager({
  basePath,
  lang,
  older,
  newer,
  label,
  olderLabel,
  newerLabel,
}: {
  basePath: 'session' | 'project' | 'member'
  lang: Locale
  older: GenerationRef | null
  newer: GenerationRef | null
  label: string
  olderLabel: string
  newerLabel: string
}) {
  if (!older && !newer) return null

  return (
    <nav aria-label={label} className="generation-pager">
      {newer && (
        <Link
          href={localeHref(lang, generationPath(basePath, newer.name))}
          transitionTypes={['generation-switch']}
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          {newerLabel} · {newer.name}
        </Link>
      )}
      {older && (
        <Link
          href={localeHref(lang, generationPath(basePath, older.name))}
          transitionTypes={['generation-switch']}
        >
          {olderLabel} · {older.name}
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      )}
    </nav>
  )
}
