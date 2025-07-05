import MainPage from '@/app/components/home/main-page'
import AboutPage from '@/app/components/home/about-page'
import ActivitiesPage from '@/app/components/home/activities-page'
import PartsPage from '@/app/components/home/parts-page'

export default function HomePage() {
  return (
    <div className={'flex w-full flex-col overflow-x-hidden'}>
      <MainPage />
      <AboutPage />
      <ActivitiesPage />
      <PartsPage />
    </div>
  )
}
