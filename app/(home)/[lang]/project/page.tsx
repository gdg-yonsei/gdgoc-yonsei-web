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

/**
 * `ProjectRedirect` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 *
 * 구동 원리:
 * 1. 입력값(`구조 분해된 입력값`)을 읽고 필요한 계산/조건 분기 로직을 수행합니다.
 * 2. 이벤트 핸들러와 상태 변화를 반영하여 어떤 UI를 보여줄지 결정합니다.
 * 3. 최종 JSX를 반환해 호출 위치의 화면에 결과를 렌더링합니다.
 *
 * 작동 결과:
 * - 사용자에게 현재 데이터/상태에 맞는 인터페이스를 제공합니다.
 * - 상위 컴포넌트와 props를 통해 연결되어 페이지 상호작용 흐름을 완성합니다.
 */
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
