/**
 * 프로그램 카드(Demo Day)의 두 주최 대학 상징 그림(서버 컴포넌트).
 */
import type { Locale } from '@/lib/i18n'
import StaticImage from '@/app/components/site/static-image'
import { landingCopy } from '@/lib/contents/site-copy'

/**
 * 두 주최 대학 상징을 나란히: 연세 × 고려.
 * @param lang 대체 텍스트 언어
 */
export default function DemoDayCrests({ lang }: { lang: Locale }) {
  const copy = landingCopy[lang].programArt

  return (
    <div className="program-art program-crests">
      <StaticImage
        src="/logos/yonsei-university.svg"
        alt={copy.yonsei}
        width={262}
        height={262}
        className="program-crest"
      />
      <span aria-hidden="true" className="program-crests-cross">
        ×
      </span>
      <StaticImage
        src="/logos/korea-university.svg"
        alt={copy.korea}
        width={200}
        height={269}
        className="program-crest"
      />
    </div>
  )
}
