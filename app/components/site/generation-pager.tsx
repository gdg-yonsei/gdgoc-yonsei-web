/**
 * 기수 페이지 하단의 이전/다음 기수 이동 링크(서버 컴포넌트).
 */
import Link from 'next/link'
import ArrowLeftIcon from '@heroicons/react/24/outline/ArrowLeftIcon'
import ArrowRightIcon from '@heroicons/react/24/outline/ArrowRightIcon'
import type { Locale } from '@/lib/i18n'
import type { GenerationRef } from '@/lib/site/generations'
import { generationPath, localeHref } from '@/lib/site/routes'

/**
 * 같은 페이지의 다른 기수로 가는 링크. 이동할 때 크로스페이드 전환(`PAGE_TRANSITIONS`)을 쓴다.
 *
 * 화살표는 SVG 아이콘으로 그린다. 화살표 문자를 쓰면 Google Sans Flex의 기호 서브셋
 * 폰트를 추가로 내려받게 된다(`tests/components/common-components.test.tsx` 참고).
 * @param basePath 어느 기록의 기수 페이지인지
 * @param older/newer 이전·다음 기수(없으면 그 방향 링크를 숨김)
 */
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
