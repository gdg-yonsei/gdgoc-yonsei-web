import Link from 'next/link'
import Reveal from '@/app/components/motion/reveal'
import type { Locale } from '@/i18n-config'
import aboutSectionContents from '@/lib/contents/about-section'

const TEASER_COPY = {
  title: {
    en: 'Connect · Learn · Grow at Yonsei',
    ko: '연세에서 Connect · Learn · Grow',
  },
  cta: { en: 'Learn more →', ko: '자세히 보기 →' },
} as const

export default function AboutTeaser({ lang }: { lang: Locale }) {
  return (
    <section className={'w-full px-6 py-24'}>
      <Reveal className={'mx-auto flex max-w-4xl flex-col gap-5'}>
        <p className={'text-yonsei-blue font-mono text-xs tracking-widest'}>
          ABOUT
        </p>
        <h2 className={'text-ink text-3xl font-bold md:text-4xl'}>
          {TEASER_COPY.title[lang]}
        </h2>
        <p className={'text-ink/70 max-w-2xl leading-relaxed'}>
          {aboutSectionContents.gdgCommunity[lang]}
        </p>
        <Link
          href={`/${lang}/about`}
          className={'text-yonsei-blue font-semibold hover:underline'}
        >
          {TEASER_COPY.cta[lang]}
        </Link>
      </Reveal>
    </section>
  )
}
