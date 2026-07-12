import Link from 'next/link'
import Reveal from '@/app/components/motion/reveal'
import type { Locale } from '@/i18n-config'
import aboutPageContents from '@/lib/contents/about-page'
import partsSectionContent, { bentoParts } from '@/lib/contents/parts-section'

export default function PartsDeepdiveSection({ lang }: { lang: Locale }) {
  const organizer = bentoParts.find((part) => part.key === 'organizer')!
  const allParts = [
    { title: organizer.title, content: organizer.content },
    ...partsSectionContent,
  ]

  return (
    <div className={'flex flex-col gap-8'}>
      <div className={'grid grid-cols-1 gap-4 md:grid-cols-2'}>
        {allParts.map((part) => (
          <Reveal key={part.title}>
            <article
              className={'bg-surface-raised h-full rounded-2xl p-6'}
              style={{ contain: 'layout style paint' }}
            >
              <h3 className={'text-ink text-lg font-semibold'}>
                {part.title}
              </h3>
              <p className={'text-ink/70 mt-2 text-sm leading-relaxed'}>
                {part.content[lang]}
              </p>
            </article>
          </Reveal>
        ))}
      </div>
      <Reveal
        className={
          'bg-yonsei-blue flex flex-col items-start gap-4 rounded-3xl p-8 text-white md:flex-row md:items-center md:justify-between'
        }
      >
        <div>
          <h3 className={'text-2xl font-bold'}>
            {aboutPageContents.joinCta.title[lang]}
          </h3>
          <p className={'mt-1 text-white/80'}>
            {aboutPageContents.joinCta.body[lang]}
          </p>
        </div>
        <Link
          href={`/${lang}/recruit`}
          className={
            'text-yonsei-blue rounded-full bg-white px-6 py-2.5 font-semibold'
          }
        >
          {aboutPageContents.joinCta.button[lang]}
        </Link>
      </Reveal>
    </div>
  )
}
