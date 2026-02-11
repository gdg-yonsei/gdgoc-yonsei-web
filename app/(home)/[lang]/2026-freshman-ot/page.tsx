import { Metadata } from 'next'
import languageParamChecker from '@/lib/language-param-checker'
import FreshmanOTPresentation from './presentation'

/* ── Static Generation ──────────────────────────────────────────────────── */

export const dynamic = 'force-static'
export const dynamicParams = true

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

/* ── Metadata ───────────────────────────────────────────────────────────── */

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = (await params).lang

  if (lang === 'ko') {
    return {
      title: '2026 신입생 OT | GDGoC Yonsei',
      description:
        'GDGoC Yonsei 2026 첨단컴퓨팅학부 신입생 OT 프레젠테이션',
    }
  }

  return {
    title: '2026 Freshman Orientation | GDGoC Yonsei',
    description:
      'GDGoC Yonsei 2026 School of Advanced Computing Freshman Orientation',
  }
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default async function FreshmanOTPage({ params }: Props) {
  const lang = languageParamChecker((await params).lang)
  return <FreshmanOTPresentation lang={lang} />
}
