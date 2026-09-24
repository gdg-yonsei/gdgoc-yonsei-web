import type { SyntheticEvent } from 'react'
import type { Locale } from '@/i18n-config'
import { localizedPath } from '@/lib/site/localized-path'

const LOCALES: ReadonlyArray<{ code: Locale; short: string; name: string }> = [
  { code: 'en', short: 'EN', name: 'English' },
  { code: 'ko', short: 'KO', name: '한국어' },
]

/**
 * Plain anchors on purpose: changing locale swaps the root layout's
 * `<html lang>`, so it is a full document navigation either way.
 */
export default function LocaleSwitch({
  lang,
  pathname,
  label,
  className,
  onIntent,
}: {
  lang: Locale
  pathname: string | null
  label: string
  className?: string
  /** Runs when a link is hovered, focused or clicked, before it navigates. */
  onIntent?: (event: SyntheticEvent<HTMLElement>) => void
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={className ? `locale-switch ${className}` : 'locale-switch'}
      onPointerOver={onIntent}
      onFocus={onIntent}
      onClick={onIntent}
    >
      {LOCALES.map(({ code, short, name }) =>
        code === lang ? (
          <span
            key={code}
            className="locale-switch-item"
            data-current=""
            aria-current="true"
          >
            {short}
            <span className="sr-only"> {name}</span>
          </span>
        ) : (
          // The visible abbreviation starts the accessible name ("KO 한국어")
          // so voice-control users can say what they see (WCAG 2.5.3).
          <a
            key={code}
            href={localizedPath(pathname, code)}
            hrefLang={code}
            lang={code}
            className="locale-switch-item"
          >
            {short}
            <span className="sr-only"> {name}</span>
          </a>
        )
      )}
    </div>
  )
}
