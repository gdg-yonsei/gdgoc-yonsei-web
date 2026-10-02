/**
 * Solution Challenge 결과를 깔때기 모양으로 보여 주는 그림(서버 컴포넌트).
 */
import type { CSSProperties } from 'react'
import type { Locale } from '@/lib/i18n'
import { landingCopy } from '@/lib/contents/site-copy'

/**
 * 2023 Solution Challenge를 좁아지는 괄호로 표현한다. 단계마다 앞 단계보다 조금 좁은 `< >` 모양 띠다.
 * @param lang 문구 언어
 */
export default function ScFunnel({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].funnel

  return (
    // 이름을 명시한다. 모든 접근성 API가 figure 이름을 figcaption에서 가져오지는 않는다. 깔때기는
    // 페이지에 한 번만 그려진다.
    <figure aria-labelledby="sc-funnel-caption" className="sc-funnel">
      <figcaption id="sc-funnel-caption" className="sc-funnel-caption">
        {copy.caption}
      </figcaption>
      <ol className="sc-funnel-steps">
        {copy.steps.map((step, index) => (
          <li
            key={step.value}
            className="sc-funnel-step"
            style={{ '--step': index } as CSSProperties}
          >
            <span className="sc-funnel-value">{step.value}</span>
            <span className="sc-funnel-label">{step.label}</span>
          </li>
        ))}
      </ol>
    </figure>
  )
}
