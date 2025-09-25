import GDGLogo from '@/app/components/svg/gdg-logo'
import aboutSectionContents from '@/lib/contents/about-section'
import { Locale } from '@/i18n-config'

export default function AboutPage({ lang }: { lang: Locale }) {
  return (
    <section
      className={
        'flex min-h-screen w-full flex-col items-center justify-center bg-neutral-200 p-4 pt-16 md:gap-12 md:py-24'
      }
    >
      <div
        className={
          'flex w-full max-w-4xl flex-col-reverse items-center gap-4 md:flex-row'
        }
      >
        <div className={'flex w-full max-w-4xl flex-col gap-4 md:w-1/2'}>
          <h2 className={'text-2xl font-semibold md:text-4xl'}>
            Google Developer Group
          </h2>
          <p className={'rounded-lg bg-white p-4'}>
            {aboutSectionContents.gdg[lang]}
          </p>
        </div>
        <div className={'flex w-1/2 items-center justify-center'}>
          <GDGLogo className={'w-36 md:w-64'} />
        </div>
      </div>
      <div className={'flex w-full max-w-4xl flex-col gap-8 py-24'}>
        <div className={'flex items-center gap-4'}>
          <GDGLogo className={'w-24 md:w-36'} />
          <h2 className={'text-2xl font-semibold md:text-4xl'}>
            <p>Google Developer Group</p>
            <p className={'text-logo-blue text-xl font-light md:text-2xl'}>
              Yonsei University
            </p>
          </h2>
        </div>
        <div className={'grid grid-cols-1 gap-4 md:grid-cols-3'}>
          <div className={'ring-gdg-red-300 rounded-lg bg-white p-4 ring-2'}>
            <h3 className={'text-xl font-semibold'}>Community</h3>
            <p>{aboutSectionContents.gdgCommunity[lang]}</p>
          </div>
          <div className={'ring-gdg-green-300 rounded-lg bg-white p-4 ring-2'}>
            <h3 className={'text-xl font-semibold'}>Tech</h3>
            <p>{aboutSectionContents.gdgTech[lang]}</p>
          </div>
          <div className={'ring-gdg-blue-300 rounded-lg bg-white p-4 ring-2'}>
            <h3 className={'text-xl font-semibold'}>Sustainable Growth</h3>
            <p>{aboutSectionContents.gdgSustainableGrowth[lang]}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
