import HomePageBackground from '@/app/(home)/[lang]/home-page-background'
import GDGLogo from '@/app/components/svg/gdg-logo'
import Link from 'next/link'
import { Locale } from '@/i18n-config'

export default function WelcomePage({ lang }: { lang?: Locale }) {
  return (
    <section
      className={
        'relative flex h-screen w-screen flex-col items-center justify-center gap-8 overflow-hidden p-8 pt-16'
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

      {/* 2026 Freshman OT Banner */}
      {lang && (
        <div className="relative z-10 flex flex-col items-center gap-3">
          <p className="text-center text-base font-medium text-neutral-600 md:text-lg">
            {lang === 'ko'
              ? '첨단컴퓨팅학부 26학번 신입생 여러분 모두 환영합니다!'
              : 'Welcome, Class of 2026 School of Advanced Computing freshmen!'}
          </p>
          <Link
            href={`/${lang}/2026-freshman-ot`}
            className="bg-logo-blue rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 md:px-8 md:py-3 md:text-base"
          >
            {lang === 'ko'
              ? '2026 신입생 OT 보러가기 →'
              : '2026 Freshman Orientation →'}
          </Link>
        </div>
      )}
    </section>
  )
}
