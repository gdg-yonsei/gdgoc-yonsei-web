import Link from 'next/link'
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/i18n-config'
import type { GenerationRef } from '@/lib/site/generations'

/* Same page, another generation: links crossfade (PAGE_TRANSITIONS). Arrows
   are SVG icons: arrow glyphs would pull Google Sans Flex's symbols subset
   (see tests/components/common-components.test.tsx). */
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
          href={`/${lang}/${basePath}/${newer.name}`}
          transitionTypes={['generation-switch']}
        >
          <ArrowLeftIcon aria-hidden="true" className="size-4" />
          {newerLabel} · {newer.name}
        </Link>
      )}
      {older && (
        <Link
          href={`/${lang}/${basePath}/${older.name}`}
          transitionTypes={['generation-switch']}
        >
          {olderLabel} · {older.name}
          <ArrowRightIcon aria-hidden="true" className="size-4" />
        </Link>
      )}
    </nav>
  )
}
