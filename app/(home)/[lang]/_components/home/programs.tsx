import type { CSSProperties } from 'react'
import type { Locale } from '@/i18n-config'
import SectionTag from '@/app/components/site/section-tag'
import activitySectionContents from '@/lib/contents/activity-section'
import { landingCopy, type ProgramKey } from '@/lib/contents/site-copy'
import type { Hue } from '@/lib/site/labels'
import ProgramStackFit from './program-stack-fit'
import ScFunnel from './sc-funnel'

/** Spec order, each program with its GDG hue. */
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
 * `<programs>`: outlined sticker cards that stack as they scroll on wide,
 * tall-enough screens (site-home.css), every card in its own slot; a plain
 * list on phones and under reduced motion.
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
