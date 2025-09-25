import WelcomePage from '@/app/(home)/[lang]/welcome-page'
import AboutPage from '@/app/components/home/about-page'
import ActivitiesPage from '@/app/components/home/activities-page'
import PartsPage from '@/app/components/home/parts-page'
import languageParamChecker from '@/lib/language-param-checker'

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
