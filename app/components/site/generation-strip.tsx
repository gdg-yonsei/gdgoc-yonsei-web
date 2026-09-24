import Link from 'next/link'
import type { Locale } from '@/i18n-config'
import type { StripGeneration } from '@/lib/site/generations'

/**
 * Every generation as a pill. Ones with public records link to their page
 * (prefetched, so the click is instant); empty ones stay visible but muted.
 */
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
                href={`/${lang}/${basePath}/${name}`}
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
                <span className="sr-only"> — {emptyLabel}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
