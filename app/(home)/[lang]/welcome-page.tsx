import HomePageBackground from '@/app/(home)/[lang]/home-page-background'
import GDGLogo from '@/app/components/svg/gdg-logo'

export default function WelcomePage() {
  return (
    <section
      className={
        'relative flex h-screen w-screen items-center justify-center overflow-hidden p-8 pt-16'
      }
    >
      <HomePageBackground />
      <div className={'flex items-center gap-4 p-4'}>
        <GDGLogo svgKey={'main'} className={'w-40 md:w-64'} />
        <h1 className={'flex flex-col gap-4'}>
          <span className={'text-2xl md:text-4xl'}>Welcome to</span>
          <span
            className={
              'flex flex-col gap-3 text-4xl font-semibold md:text-6xl lg:flex-row'
            }
          >
            <span>Google</span>
            <span>Developer</span>
            <span>Group</span>
          </span>
          <span className={'text-logo-blue text-2xl md:text-4xl'}>
            Yonsei University
          </span>
        </h1>
      </div>
    </section>
  )
}
