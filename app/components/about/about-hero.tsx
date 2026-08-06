'use client'

import { m, useReducedMotion } from 'motion/react'
import type { Locale } from '@/i18n-config'
import aboutPageContents from '@/lib/contents/about-page'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const lineVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
} as const

export default function AboutHero({ lang }: { lang: Locale }) {
  const shouldReduce = useReducedMotion()

  return (
    <section className={'w-full px-6 pt-32 pb-20'}>
      <m.div
        variants={containerVariants}
        initial={shouldReduce ? 'visible' : 'hidden'}
        animate={'visible'}
        className={'mx-auto flex max-w-4xl flex-col gap-6'}
      >
        <m.p
          variants={lineVariants}
          className={'text-yonsei-blue font-mono text-xs tracking-widest'}
        >
          ABOUT US
        </m.p>
        <h1
          className={
            'text-ink text-4xl leading-tight font-bold text-balance md:text-6xl'
          }
        >
          {aboutPageContents.hero.lines[lang].map((line) => (
            <m.span key={line} variants={lineVariants} className={'block'}>
              {line}
            </m.span>
          ))}
        </h1>
        <m.p variants={lineVariants} className={'text-ink/70 max-w-2xl text-lg'}>
          {aboutPageContents.hero.sub[lang]}
        </m.p>
      </m.div>
    </section>
  )
}
