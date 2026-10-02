/**
 * 홈의 프로그램 섹션(서버 컴포넌트): 정기 세션, 해커톤, Solution Challenge 등.
 */
import type { CSSProperties } from 'react'
import type { Locale } from '@/lib/i18n'
import SectionTag from '@/app/components/site/section-tag'
import { activitySectionContents } from '@/lib/contents/activity-section'
import { landingCopy, type ProgramKey } from '@/lib/contents/site-copy'
import type { Hue } from '@/lib/site/labels'
import BridgeFlags from './bridge-flags'
import DemoDayCrests from './demo-day-crests'
import ProgramStackFit from './program-stack-fit'
import ScFunnel from './sc-funnel'

/** 명세 순서대로, 프로그램마다 GDG 색 하나. */
const PROGRAMS: ReadonlyArray<{ key: ProgramKey; hue: Hue }> = [
  { key: 'T19', hue: 'red' },
  { key: 'Part Session', hue: 'green' },
  { key: 'oTP', hue: 'blue' },
  { key: 'Solution Challenge', hue: 'yellow' },
  { key: 'Yonsei X Korea Demo Day', hue: 'red' },
  { key: 'The Bridge Hackathon', hue: 'green' },
]

const DESCRIPTIONS = new Map(
  activitySectionContents.map((activity) => [activity.key, activity.content])
)

/**
 * `<programs>` 섹션. 넓고 충분히 높은 화면에서는 테두리 스티커 카드가 스크롤에 따라 쌓이고(site-home.css)
 * 카드마다 자기 자리가 있다. 휴대폰과 움직임 줄이기에서는 일반 목록이다.
 */
export default function Programs({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].programs

  return (
    <section
      aria-labelledby="programs-title"
      data-scene="programs"
      className="home-section"
    >
      <div className="home-section-head">
        <SectionTag>{copy.tag}</SectionTag>
        <h2 id="programs-title" className="home-section-title">
          {copy.title}
        </h2>
        <p className="home-section-intro">{copy.intro}</p>
      </div>
      <ProgramStackFit>
        {PROGRAMS.map(({ key, hue }, index) => (
          <li
            key={key}
            className="program-card"
            data-hue={hue}
            style={{ '--i': index } as CSSProperties}
          >
            <article className="program-inner">
              <div className="program-copy">
                <p className="program-kicker">{copy.kickers[key]}</p>
                <h3 className="program-title">{copy.titles[key]}</h3>
                <p className="program-body">{DESCRIPTIONS.get(key)?.[lang]}</p>
              </div>
              {key === 'Solution Challenge' && <ScFunnel lang={lang} />}
              {key === 'Yonsei X Korea Demo Day' && (
                <DemoDayCrests lang={lang} />
              )}
              {key === 'The Bridge Hackathon' && <BridgeFlags lang={lang} />}
              <span aria-hidden="true" className="program-index">
                {String(index + 1).padStart(2, '0')}
              </span>
            </article>
          </li>
        ))}
      </ProgramStackFit>
    </section>
  )
}
