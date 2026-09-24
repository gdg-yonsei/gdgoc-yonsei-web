import type { CSSProperties } from 'react'
import type { Locale } from '@/i18n-config'
import SectionTag from '@/app/components/site/section-tag'
import activitySectionContents from '@/lib/contents/activity-section'
import { landingCopy, type ProgramKey } from '@/lib/contents/site-copy'
import type { Hue } from '@/lib/site/labels'
import ScFunnel from './sc-funnel'

/** Spec order, each program with its GDG hue. `long` cards (the funnel) are
    taller than many screens leave below a sticky offset, so they scroll
    through the stack instead of sticking. */
const PROGRAMS: ReadonlyArray<{ key: ProgramKey; hue: Hue; long?: boolean }> = [
  { key: 'T19', hue: 'red' },
  { key: 'Part Session', hue: 'green' },
  { key: 'oTP', hue: 'blue' },
  { key: 'Solution Challenge', hue: 'yellow', long: true },
  { key: 'Yonsei X Korea Demo Day', hue: 'red' },
  { key: 'The Bridge Hackathon', hue: 'green' },
]

const DESCRIPTIONS = new Map(
  activitySectionContents.map((activity) => [activity.key, activity.content])
)

/**
 * `<programs>`: outlined sticker cards that stack as they scroll on wide
 * screens (site-home.css); a plain list on phones and under reduced motion.
 */
export default function Programs({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].programs

  return (
    <section aria-labelledby="programs-title" className="home-section">
      <div className="home-section-head">
        <SectionTag>{copy.tag}</SectionTag>
        <h2 id="programs-title" className="home-section-title">
          {copy.title}
        </h2>
        <p className="home-section-intro">{copy.intro}</p>
      </div>
      <ol className="program-stack">
        {PROGRAMS.map(({ key, hue, long }, index) => (
          <li
            key={key}
            className="program-card"
            data-hue={hue}
            data-long={long ? '' : undefined}
            style={{ '--i': index } as CSSProperties}
          >
            <article className="program-inner">
              <p className="program-kicker">{copy.kickers[key]}</p>
              <h3 className="program-title">{copy.titles[key]}</h3>
              <p className="program-body">{DESCRIPTIONS.get(key)?.[lang]}</p>
              {key === 'Solution Challenge' && <ScFunnel lang={lang} />}
            </article>
          </li>
        ))}
      </ol>
    </section>
  )
}
