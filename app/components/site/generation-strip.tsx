/**
 * 허브 상단의 기수 목록 알약 띠(서버 컴포넌트).
 */
import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import type { StripGeneration } from '@/lib/site/generations'
import { generationPath, localeHref } from '@/lib/site/routes'

/**
 * 모든 기수를 알약 모양으로 보여 준다. 공개 기록이 있는 기수는 해당 기수 페이지로
 * 연결하고(prefetch해 즉시 열림), 기록이 없는 기수는 흐리게 남겨 둔다.
 * @param current 현재 보고 있는 기수 이름(`aria-current` 표시)
 * @param emptyLabel 기록 없는 기수에 붙는 스크린리더 문구
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
                <span className="sr-only"> — {emptyLabel}</span>
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
