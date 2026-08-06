import { Metadata } from 'next'
import languageParamChecker from '@/lib/language-param-checker'
import FreshmanOTPresentation from './presentation'
import { createLocalizedMetadata } from '@/lib/seo/metadata'

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

/* ── Metadata ───────────────────────────────────────────────────────────── */

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = languageParamChecker((await params).lang)

  if (lang === 'ko') {
    return createLocalizedMetadata({
      locale: lang,
      path: '/2026-freshman-ot',
      title: '2026 신입생 OT',
      description:
        'GDGoC Yonsei가 연세대학교 첨단컴퓨팅학부 2026학번 신입생에게 커뮤니티, 기술 세션, 프로젝트, 해커톤과 지원 분야를 소개합니다.',
    })
  }

  return createLocalizedMetadata({
    locale: lang,
    path: '/2026-freshman-ot',
    title: '2026 Freshman Orientation',
    description:
      'GDGoC Yonsei introduces the community, technical sessions, projects, hackathons, future plans, and recruitment tracks to the 2026 School of Computing class.',
  })
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default async function FreshmanOTPage({ params }: Props) {
  const lang = languageParamChecker((await params).lang)
  return <FreshmanOTPresentation lang={lang} />
}
