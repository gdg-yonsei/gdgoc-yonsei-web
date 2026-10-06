import type { SyntheticEvent } from 'react'
import type { Locale } from '@/lib/i18n'
import { localizedPath } from '@/lib/i18n'

const LOCALES: ReadonlyArray<{ code: Locale; short: string; name: string }> = [
  { code: 'en', short: 'EN', name: 'English' },
  { code: 'ko', short: 'KO', name: '한국어' },
]

/** 언어 변경은 루트의 html lang을 바꿔 문서를 다시 불러오므로 일반 a를 쓴다.
 * pathname이 null이면 언어별 홈으로 연결하고, onIntent는 이동 전 쿼리 보존 등에 쓰인다. */
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
          // 접근 가능한 이름이 보이는 약어로 시작하게 해("KO 한국어"), 음성 제어
          // 사용자가 화면에 보이는 글자를 그대로 말해 누를 수 있게 한다(WCAG 2.5.3).
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
