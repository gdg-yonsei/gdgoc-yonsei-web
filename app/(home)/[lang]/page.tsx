import WelcomePage from '@/app/(home)/[lang]/welcome-page'
import AboutPage from '@/app/(home)/[lang]/about-page'
import ActivitiesPage from '@/app/(home)/[lang]/activities-page'
import PartsPage from '@/app/(home)/[lang]/parts-page'
import languageParamChecker from '@/lib/language-param-checker'
import type { Metadata } from 'next'
import JsonLd from '@/app/components/json-ld'
import {
  createLocalizedMetadata,
  getLocalizedUrl,
  getSiteUrl,
} from '@/lib/seo/metadata'

type Props = {
  params: Promise<{ lang: string }>
}

const descriptions = {
  en: "Official website of GDGoC Yonsei, Yonsei University's student developer community. Explore technical sessions, collaborative projects, members, events, and activities.",
  ko: '연세대학교 학생 개발자 커뮤니티 GDGoC Yonsei의 공식 웹사이트입니다. 기술 세션, 협업 프로젝트, 구성원, 행사와 커뮤니티 활동을 확인하세요.',
} as const

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = languageParamChecker((await params).lang)
  const title =
    locale === 'ko'
      ? 'GDGoC Yonsei | 연세대학교 학생 개발자 커뮤니티'
      : 'GDGoC Yonsei | Yonsei University Developer Community'

  return createLocalizedMetadata({
    locale,
    title,
    description: descriptions[locale],
    absoluteTitle: true,
  })
}

// SSG를 위해 params 값 지정
/**
 * `generateStaticParams` 함수는 전달받은 입력값을 바탕으로 필요한 비즈니스 로직을 수행합니다.
 *
 * 구동 원리:
 * 1. 입력값(없음)을 기준으로 전처리/검증 또는 조회 조건을 구성합니다.
 * 2. 함수 본문의 조건 분기와 동기/비동기 로직을 순서대로 실행합니다.
 * 3. 계산 결과를 반환하거나 캐시/DB/리다이렉트 등 필요한 부수 효과를 반영합니다.
 *
 * 작동 결과:
 * - 호출부에서 즉시 활용 가능한 결과값 또는 실행 상태를 제공합니다.
 * - 후속 로직이 안정적으로 이어질 수 있도록 일관된 동작을 보장합니다.
 */
export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

/**
 * GDGoC Yonsei 웹사이트 첫 페이지
 * @param params
 * @constructor
 */
export default async function HomePage({ params }: Props) {
  // 사용자 언어
  const lang = languageParamChecker((await params).lang)

  const siteRoot = getSiteUrl()
  const canonical = getLocalizedUrl(lang)
  const organizationId = `${siteRoot}#organization`
  const websiteId = `${siteRoot}#website`
  const pageTitle =
    lang === 'ko'
      ? 'GDGoC Yonsei | 연세대학교 학생 개발자 커뮤니티'
      : 'GDGoC Yonsei | Yonsei University Developer Community'

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': organizationId,
      name: 'GDGoC Yonsei',
      alternateName: [
        'Google Developer Group on Campus Yonsei University',
        'GDSC Yonsei',
      ],
      url: getLocalizedUrl('en'),
      logo: getSiteUrl('/gdgoc-yonsei-logo.svg'),
      email: 'gdsc.yonsei.univ@gmail.com',
      sameAs: [
        'https://gdg.community.dev/gdg-on-campus-yonsei-university-sinchon-campus-seoul-south-korea/',
        'https://www.linkedin.com/company/gdsc-yonsei/',
        'https://www.instagram.com/gdg.yonseiuniv/',
      ],
      parentOrganization: {
        '@type': 'CollegeOrUniversity',
        name: 'Yonsei University',
        url: 'https://www.yonsei.ac.kr/',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': websiteId,
      name: 'GDGoC Yonsei',
      url: siteRoot,
      inLanguage: ['en', 'ko'],
      publisher: { '@id': organizationId },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: pageTitle,
      description: descriptions[lang],
      inLanguage: lang,
      isPartOf: { '@id': websiteId },
      about: { '@id': organizationId },
    },
  ]

  return (
    <>
      <JsonLd id="homepage-structured-data" data={structuredData} />
      <div className={'flex w-full flex-col overflow-x-hidden'}>
        <WelcomePage lang={lang} />
        <AboutPage lang={lang} />
        <ActivitiesPage lang={lang} />
        <PartsPage lang={lang} />
      </div>
    </>
  )
}
