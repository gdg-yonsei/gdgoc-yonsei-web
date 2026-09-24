import Link from 'next/link'
import type { Locale } from '@/i18n-config'
import SectionTag from '@/app/components/site/section-tag'
import partsSectionContent from '@/lib/contents/parts-section'
import { landingCopy } from '@/lib/contents/site-copy'
import { fillTemplate } from '@/lib/site/format'
import { partHue } from '@/lib/site/labels'
import PartGlyph, { type PartGlyphKind } from './part-glyph'

const GLYPHS: Record<string, PartGlyphKind> = {
  'Front-End': 'layout',
  'Back-End': 'layers',
  'ML/AI': 'graph',
  Cloud: 'mesh',
  'UI/UX': 'curve',
  DevRel: 'rings',
}

/**
 * `<parts>`: one module per part with its description in the HTML and a
 * link into the Session Log filtered by that part (no prefetch: six query
 * variants of one route would spend the prefetch budget).
 */
export default function Parts({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].parts

  return (
    <section aria-labelledby="parts-title" className="home-section">
      <div className="home-section-head">
        <SectionTag>{copy.tag}</SectionTag>
        <h2 id="parts-title" className="home-section-title">
          {copy.title}
        </h2>
        <p className="home-section-intro">{copy.intro}</p>
      </div>
      <ul className="part-grid">
        {partsSectionContent.map((part) => (
          <li
            key={part.title}
            className="part-module reveal"
            data-hue={partHue(part.title)}
          >
            <PartGlyph kind={GLYPHS[part.title] ?? 'layout'} />
            <h3 className="part-title">{part.title}</h3>
            <p className="part-body">{part.content[lang]}</p>
            <Link
              href={`/${lang}/session?part=${encodeURIComponent(part.title)}`}
              prefetch={false}
              className="part-link"
            >
              {fillTemplate(copy.partLink, { part: part.title })}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
