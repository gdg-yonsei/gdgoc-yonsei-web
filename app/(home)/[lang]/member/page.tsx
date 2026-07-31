import type { Metadata } from 'next'
import languageParamChecker from '@/lib/language-param-checker'
import { getGenerationSummaries } from '@/lib/server/queries/public/generations'
import { createLocalizedMetadata } from '@/lib/seo/metadata'
import GenerationIndexPage from '@/app/(home)/[lang]/generation-index-page'

type Props = { params: Promise<{ lang: string }> }

const descriptions = {
  en: 'Meet GDGoC Yonsei organizers and members by generation and explore the student community building technology together at Yonsei University.',
  ko: '기수별 GDGoC Yonsei 운영진과 구성원을 만나고 연세대학교에서 함께 기술을 만드는 학생 개발자 커뮤니티를 확인하세요.',
} as const

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)

  return createLocalizedMetadata({
    locale,
    path: '/member',
    title: locale === 'ko' ? '기수별 구성원' : 'Members by Generation',
    description: descriptions[locale],
  })
}

/**
 * 만약 사용자가 Member 페이지에 generation path 없이 들어올 경우 가장 최근 generation으로 redirect 하는 페이지
 * @param params
 * @constructor
 */
export default async function MemberIndex({ params }: Props) {
  const lang = languageParamChecker((await params).lang)
  const generations = await getGenerationSummaries(lang)

  return (
    <GenerationIndexPage
      basePath="member"
      description={descriptions[lang]}
      emptyLabel={
        lang === 'ko'
          ? '아직 공개된 구성원 기수가 없습니다.'
          : 'No member generations are available yet.'
      }
      generations={generations}
      lang={lang}
      title={lang === 'ko' ? '기수별 구성원' : 'Members by Generation'}
    />
  )
}
