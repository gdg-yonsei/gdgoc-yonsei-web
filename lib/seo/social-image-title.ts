import type { Locale } from '@/i18n-config'

const TITLE_WIDTH_PX = 1_050
const TITLE_WIDTH_SAFETY_FACTOR = 0.94
const ELLIPSIS = '…'

export type SocialTitleLayout = {
  fontSize: 48 | 58 | 70
  lines: readonly [string] | readonly [string, string]
  truncated: boolean
}

function segmentGraphemes(value: string, locale: Locale): string[] {
  const segmenter = new Intl.Segmenter(locale === 'ko' ? 'ko-KR' : 'en-US', {
    granularity: 'grapheme',
  })

  return Array.from(segmenter.segment(value), ({ segment }) => segment)
}

function graphemeWidth(grapheme: string): number {
  if (/^\s$/u.test(grapheme)) return 0.34
  if (/^[ilI.,'`:;|!]$/u.test(grapheme)) return 0.3
  if (/^[MW@#%&]$/u.test(grapheme)) return 0.88
  if (/^[A-Z]$/u.test(grapheme)) return 0.68
  if (/^[a-z]$/u.test(grapheme)) return 0.56
  if (/^[0-9]$/u.test(grapheme)) return 0.6
  if (/^[\-–—_/+()[\]{}]$/u.test(grapheme)) return 0.48

  // Hangul, CJK and emoji are approximately square in Pretendard.
  return 1
}

function measure(graphemes: readonly string[]): number {
  return graphemes.reduce(
    (width, grapheme) => width + graphemeWidth(grapheme),
    0
  )
}

function lineCapacity(fontSize: number): number {
  return (TITLE_WIDTH_PX / fontSize) * TITLE_WIDTH_SAFETY_FACTOR
}

function fontSizeFor(graphemes: readonly string[]): 48 | 58 | 70 {
  const width = measure(graphemes)

  if (width <= lineCapacity(70) * 2 * 0.92) return 70
  if (width <= lineCapacity(58) * 2 * 0.96) return 58
  return 48
}

function takeLine(
  graphemes: readonly string[],
  capacity: number,
  preferWordBoundary: boolean
): { line: string[]; consumed: number } {
  let width = 0
  let consumed = 0

  while (consumed < graphemes.length) {
    const nextWidth = width + graphemeWidth(graphemes[consumed]!)
    if (nextWidth > capacity) break
    width = nextWidth
    consumed += 1
  }

  if (preferWordBoundary && consumed < graphemes.length) {
    const lastWhitespace = graphemes
      .slice(0, consumed)
      .findLastIndex((grapheme) => /^\s$/u.test(grapheme))

    if (lastWhitespace >= Math.floor(consumed * 0.55)) {
      consumed = lastWhitespace + 1
    }
  }

  const line = graphemes.slice(0, consumed)
  while (line.at(-1) && /^\s$/u.test(line.at(-1)!)) line.pop()

  return { line, consumed }
}

/**
 * Creates at most two explicit no-wrap lines. Satori does not implement every
 * browser line-clamp rule, so doing the line breaking here prevents long Korean,
 * English, or emoji titles from overflowing the 1200×630 social card.
 */
export function layoutSocialTitle(
  title: string,
  locale: Locale
): SocialTitleLayout {
  const normalized = title.replace(/\s+/gu, ' ').trim() || 'GDGoC Yonsei'
  const graphemes = segmentGraphemes(normalized, locale)
  const fontSize = fontSizeFor(graphemes)
  const capacity = lineCapacity(fontSize)
  const first = takeLine(graphemes, capacity, true)
  const remaining = graphemes.slice(first.consumed)

  while (remaining[0] && /^\s$/u.test(remaining[0])) remaining.shift()

  if (remaining.length === 0) {
    return { fontSize, lines: [first.line.join('')], truncated: false }
  }

  const second = takeLine(remaining, capacity, false)
  const truncated = second.consumed < remaining.length

  if (truncated) {
    while (
      second.line.length > 0 &&
      measure([...second.line, ELLIPSIS]) > capacity
    ) {
      second.line.pop()
    }
    while (second.line.at(-1) && /^\s$/u.test(second.line.at(-1)!)) {
      second.line.pop()
    }
    second.line.push(ELLIPSIS)
  }

  return {
    fontSize,
    lines: [first.line.join(''), second.line.join('')],
    truncated,
  }
}
