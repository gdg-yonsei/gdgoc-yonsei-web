import { PartCard } from '@/app/(home)/[lang]/part-card'
import { Locale } from '@/i18n-config'
import partsSectionContent from '@/lib/contents/parts-section'

/**
 * 각 파트를 소개하는 section
 * @param lang
 * @constructor
 */
export default function PartsPage({ lang }: { lang: Locale }) {
  return (
    <section
      className={
        'bg-gdg-white flex min-h-screen w-full items-center justify-center'
      }
    >
      <div className={'w-full max-w-6xl p-4 py-12'}>
        <h2 className={'py-2 text-3xl font-semibold md:text-5xl'}>
          {lang === 'ko' ? '파트' : 'Parts'}
        </h2>
        <div
          className={
            'mx-auto grid w-full max-w-xs grid-cols-1 items-start gap-4 md:max-w-none md:grid-cols-3'
          }
        >
          {partsSectionContent.map((part, index) => (
            <PartCard
              key={index}
              title={part.title}
              content={
                part.content[lang as keyof typeof part.content] ??
                part.content.en
              }
            />
          ))}
        </div>
      </div>
    </section>
  )
}
