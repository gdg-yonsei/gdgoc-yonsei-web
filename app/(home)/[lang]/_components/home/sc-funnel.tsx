import type { CSSProperties } from 'react'
import type { Locale } from '@/lib/i18n'
import { landingCopy } from '@/lib/contents/site-copy'

/** 2023 Solution Challenge 결과를 단계마다 좁아지는 `< >` 띠로 표현한다. */
export default function ScFunnel({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].funnel

  return (
    // figcaption을 이름으로 읽지 않는 접근성 API도 있어, 한 번만 그리는 깔때기에 이름을 명시한다.

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
