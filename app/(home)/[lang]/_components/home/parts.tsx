/**
 * 홈의 파트 소개 섹션(서버 컴포넌트). 파트 문구는 `lib/contents/parts-section.ts`에 있다.
 */
import Link from 'next/link'
import type { Locale } from '@/lib/i18n'
import SectionTag from '@/app/components/site/section-tag'
import { partsSectionContent } from '@/lib/contents/parts-section'
import { landingCopy } from '@/lib/contents/site-copy'
import { fillTemplate } from '@/lib/format/text'
import { partHue } from '@/lib/site/labels'
import PartGlyph, { type PartGlyphKind } from './part-glyph'
import { localeHref } from '@/lib/site/routes'

const GLYPHS: Record<string, PartGlyphKind> = {
  'Front-End': 'layout',
  'Back-End': 'layers',
  'ML/AI': 'graph',
  Cloud: 'mesh',
  'UI/UX': 'curve',
  DevRel: 'rings',
}

/**
 * `<parts>` 섹션. 파트마다 모듈 하나를 두고, 설명은 HTML에 그대로 넣으며, 그 파트로 필터링한 세션 로그
 * 링크를 단다(prefetch 안 함: 한 라우트의 쿼리 변형 여섯 개가 prefetch 예산을 낭비한다).
 */
export default function Parts({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].parts

  return (
    <section
      aria-labelledby="parts-title"
      data-scene="parts"
      className="home-section"
    >
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
              href={`${localeHref(lang, '/session')}?part=${encodeURIComponent(part.title)}`}
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
