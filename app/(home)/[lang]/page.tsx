import MainPage from '@/app/components/home/main-page'
import AboutPage from '@/app/components/home/about-page'
import ActivitiesPage from '@/app/components/home/activities-page'
import PartsPage from '@/app/components/home/parts-page'

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const lang = (await params).lang
  return (
    <div className={'flex w-full flex-col overflow-x-hidden'}>
      <MainPage />
      <AboutPage lang={lang} />
      <ActivitiesPage lang={lang} />
      <PartsPage lang={lang} />
    </div>
  )
}
