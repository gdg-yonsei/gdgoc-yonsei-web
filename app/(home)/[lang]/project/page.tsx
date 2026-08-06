import type { Metadata } from 'next'
import languageParamChecker from '@/lib/language-param-checker'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { createLocalizedMetadata } from '@/lib/seo/metadata'
import GenerationIndexPage from '@/app/(home)/[lang]/generation-index-page'

type Props = { params: Promise<{ lang: string }> }

const descriptions = {
  en: 'Browse GDGoC Yonsei student projects by generation and discover how Yonsei University developers turn technical learning into collaborative, practical solutions.',
  ko: '기수별 GDGoC Yonsei 학생 프로젝트를 살펴보고 연세대학교 개발자들이 기술 학습을 협업과 실용적인 해결책으로 발전시키는 과정을 확인하세요.',
} as const

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)

  return createLocalizedMetadata({
    locale,
    path: '/project',
    title: locale === 'ko' ? '기수별 프로젝트' : 'Projects by Generation',
    description: descriptions[locale],
  })
}

export default async function ProjectIndex({ params }: Props) {
  const lang = languageParamChecker((await params).lang)
  const generations = await getGenerationSummaries(lang)

  return (
    <GenerationIndexPage
      basePath="project"
      description={descriptions[lang]}
      emptyLabel={
        lang === 'ko'
          ? '아직 공개된 프로젝트 기수가 없습니다.'
          : 'No project generations are available yet.'
      }
      generations={generations}
      lang={lang}
      title={lang === 'ko' ? '기수별 프로젝트' : 'Projects by Generation'}
    />
  )
}
