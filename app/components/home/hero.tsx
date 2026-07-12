'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { m, useReducedMotion } from 'motion/react'
import type { Locale } from '@/i18n-config'

const StarfieldCanvas = dynamic(
  () => import('@/app/components/home/starfield-canvas'),
  { ssr: false }
)

const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const heroItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
} as const

const HERO_COPY = {
  tagline: {
    en: 'Google Developer Group on Campus · Yonsei University',
    ko: 'Google Developer Group on Campus · 연세대학교',
  },
  subtitle: {
    en: 'A community of student developers who connect, learn, and grow together — building solutions for campus and society.',
    ko: '함께 연결되고, 배우고, 성장하는 학생 개발자 커뮤니티 — 캠퍼스와 사회를 위한 솔루션을 만듭니다.',
  },
  aboutCta: { en: 'About us', ko: '소개 보기' },
  joinCta: { en: 'Join us', ko: '함께하기' },
} as const

export default function Hero({ lang }: { lang: Locale }) {
  const shouldReduce = useReducedMotion()

  return (
    <section
      className={
        'relative flex min-h-[calc(100svh-4.5rem)] w-full flex-col items-center justify-center overflow-hidden px-6 py-24'
      }
    >
      <StarfieldCanvas />
      <m.div
        variants={heroContainer}
        initial={shouldReduce ? 'visible' : 'hidden'}
        animate={'visible'}
        className={
          'flex w-full max-w-4xl flex-col items-center gap-6 text-center'
        }
      >
        <m.p
          variants={heroItem}
          className={
            'text-yonsei-blue font-mono text-xs tracking-widest uppercase md:text-sm'
          }
        >
          {HERO_COPY.tagline[lang]}
        </m.p>
        <m.h1
          variants={heroItem}
          className={
            'text-ink text-5xl font-bold tracking-tight text-balance md:text-7xl'
          }
        >
          Connect. <span className={'text-gdg-blue-300'}>Learn.</span>{' '}
          <span className={'text-yonsei-blue'}>Grow.</span>
        </m.h1>
        <m.p variants={heroItem} className={'text-ink/70 max-w-xl text-lg'}>
          {HERO_COPY.subtitle[lang]}
        </m.p>
        <m.div
          variants={heroItem}
          className={'flex flex-wrap justify-center gap-3'}
        >
          <Link
            href={`/${lang}/about`}
            className={
              'bg-yonsei-blue rounded-full px-6 py-2.5 font-semibold text-white transition-transform hover:-translate-y-0.5'
            }
          >
            {HERO_COPY.aboutCta[lang]}
          </Link>
          <Link
            href={`/${lang}/recruit`}
            className={
              'border-ink/15 bg-surface-raised text-ink rounded-full border px-6 py-2.5 font-semibold transition-transform hover:-translate-y-0.5'
            }
          >
            {HERO_COPY.joinCta[lang]}
          </Link>
        </m.div>
      </m.div>
    </section>
  )
}
