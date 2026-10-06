import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import type { StripGeneration } from '@/lib/site/generations'
import { generationPath, localeHref } from '@/lib/site/routes'

/** 공개 기록이 있는 기수는 prefetch하는 링크로, 기록이 없는 기수는 비활성 표시와 보조기술 문구로 남긴다. */
export default function GenerationStrip({
  basePath,
  lang,
  generations,
  current,
  label,
  emptyLabel,
}: {
  basePath: 'session' | 'project'
  lang: Locale
  generations: readonly StripGeneration[]
  current?: string
  label: string
  emptyLabel: string
}) {
  if (generations.length === 0) return null

  return (
    <nav aria-label={label} className="generation-strip">
      <ul>
        {generations.map(({ name, count }) => (
          <li key={name}>
            {count > 0 ? (
              <Link
                href={localeHref(lang, generationPath(basePath, name))}
                prefetch={true}
                transitionTypes={['nav-forward']}
                aria-current={name === current ? 'page' : undefined}
                className="generation-pill"
              >
                {name}
                <span className="generation-pill-count">{count}</span>
              </Link>
            ) : (
              <span className="generation-pill" data-empty="">
                {name}
                <span className="sr-only">, {emptyLabel}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
