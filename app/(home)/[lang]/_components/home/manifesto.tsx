import type { CSSProperties } from 'react'
import type { Locale } from '@/i18n-config'
import ExternalLink from '@/app/components/site/external-link'
import SectionTag from '@/app/components/site/section-tag'
import GDGLogo from '@/app/components/svg/gdg-logo'
import aboutSectionContents from '@/lib/contents/about-section'
import { landingCopy } from '@/lib/contents/site-copy'
import { CHANNELS } from '@/lib/site/channels'
import PillarGlyph from './pillar-glyph'

const PILLAR_BODY = {
  community: aboutSectionContents.gdgCommunity,
  tech: aboutSectionContents.gdgTech,
  growth: aboutSectionContents.gdgSustainableGrowth,
}

/**
 * `<about>`: the chapter's statement at display size, lit word by word as it
 * crosses the viewport (site-home.css), the longer introduction, a "What is
 * GDG on Campus?" aside and the three pillars.
 */
export default function Manifesto({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].manifesto
  const words = copy.statement.split(' ')

  return (
    <section
      aria-labelledby="manifesto-title"
      data-scene="manifesto"
      className="home-section"
    >
      <div className="home-section-head">
        <SectionTag>{copy.tag}</SectionTag>
        <h2 id="manifesto-title" className="manifesto-kicker">
          {copy.title}
        </h2>
      </div>
      <p
        className="manifesto-statement"
        style={{ '--n': words.length } as CSSProperties}
      >
        {words.map((word, index) => (
          <span
            key={index}
            className="manifesto-word"
            style={{ '--i': index } as CSSProperties}
          >
            {word}{' '}
          </span>
        ))}
      </p>
      <div className="manifesto-body reveal">
        <p className="manifesto-lede">{aboutSectionContents.gdgYonsei[lang]}</p>
        <aside aria-labelledby="gdg-aside-title" className="manifesto-aside">
          <GDGLogo
            svgKey="manifesto"
            aria-hidden="true"
            className="h-7 w-auto self-start"
          />
          <h3 id="gdg-aside-title" className="manifesto-aside-title">
            {copy.asideTitle}
          </h3>
          <p>{aboutSectionContents.gdg[lang]}</p>
          <ExternalLink href={CHANNELS.chapter} className="home-more">
            {copy.asideLink}
          </ExternalLink>
        </aside>
      </div>
      <ul className="pillars reveal">
        {copy.pillars.map((pillar) => (
          <li key={pillar.key} className="pillar">
            <PillarGlyph kind={pillar.key} />
            <h3 className="pillar-title">{pillar.title}</h3>
            <p className="pillar-body">{PILLAR_BODY[pillar.key][lang]}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
