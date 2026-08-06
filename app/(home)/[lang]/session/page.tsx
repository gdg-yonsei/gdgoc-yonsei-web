import type { Metadata } from 'next'
import languageParamChecker from '@/lib/language-param-checker'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { createLocalizedMetadata } from '@/lib/seo/metadata'
import GenerationIndexPage from '@/app/(home)/[lang]/generation-index-page'

type Props = { params: Promise<{ lang: string }> }

const descriptions = {
  en: 'Browse GDGoC Yonsei technical sessions by generation, including talks where student developers share practical knowledge, project experience, and emerging technology.',
  ko: '기수별 GDGoC Yonsei 기술 세션을 살펴보고 학생 개발자들이 공유한 실무 지식, 프로젝트 경험과 새로운 기술을 확인하세요.',
} as const

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)

  return createLocalizedMetadata({
    locale,
    path: '/session',
    title: locale === 'ko' ? '기수별 기술 세션' : 'Sessions by Generation',
    description: descriptions[locale],
  })
}

export default async function SessionIndex({ params }: Props) {
  const lang = languageParamChecker((await params).lang)
  const generations = await getGenerationSummaries(lang)

  return (
    <GenerationIndexPage
      basePath="session"
      description={descriptions[lang]}
      emptyLabel={
        lang === 'ko'
          ? '아직 공개된 세션 기수가 없습니다.'
          : 'No session generations are available yet.'
      }
      generations={generations}
      lang={lang}
      title={lang === 'ko' ? '기수별 기술 세션' : 'Sessions by Generation'}
    />
  )
}
