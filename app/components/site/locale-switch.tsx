/**
 * 영어/한국어 전환 링크 묶음. 서버·클라이언트 어디서든 쓸 수 있는 순수 렌더링 컴포넌트다.
 */
import type { SyntheticEvent } from 'react'
import type { Locale } from '@/lib/i18n'
import { localizedPath } from '@/lib/i18n'

/** 전환 대상 언어(약어, 언어 이름). */
const LOCALES: ReadonlyArray<{ code: Locale; short: string; name: string }> = [
  { code: 'en', short: 'EN', name: 'English' },
  { code: 'ko', short: 'KO', name: '한국어' },
]

/**
 * 일부러 `next/link`가 아닌 일반 `<a>`를 쓴다. 언어를 바꾸면 루트 레이아웃의
 * `<html lang>`이 바뀌므로 어차피 문서 전체를 다시 불러온다.
 * @param pathname 현재 경로. null이면(경로를 아직 모름) 각 언어의 홈으로 연결한다.
 * @param onIntent 링크에 마우스를 올리거나 포커스·클릭할 때 이동 전에 호출(쿼리 문자열 유지 등)
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
