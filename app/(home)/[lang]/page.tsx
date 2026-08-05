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
