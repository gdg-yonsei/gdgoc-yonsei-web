import WelcomePage from '@/app/(home)/[lang]/welcome-page'
import AboutPage from '@/app/(home)/[lang]/about-page'
import ActivitiesPage from '@/app/(home)/[lang]/activities-page'
import PartsPage from '@/app/(home)/[lang]/parts-page'
import languageParamChecker from '@/lib/language-param-checker'

// SSG를 위해 params 값 지정
export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ko' }]
}

export const dynamicParams = true
export const dynamic = 'force-static'

/**
 * GDGoC Yonsei 웹사이트 첫 페이지
 * @param params
 * @constructor
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  // 사용자 언어
  const lang = languageParamChecker((await params).lang)

  return (
    <div className={'flex w-full flex-col overflow-x-hidden'}>
      <WelcomePage />
      <AboutPage lang={lang} />
      <ActivitiesPage lang={lang} />
      <PartsPage lang={lang} />
    </div>
  )
}
