'use client'

import { m, useReducedMotion } from 'motion/react'
import type { Locale } from '@/i18n-config'
import { bentoParts } from '@/lib/contents/parts-section'

const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
} as const

export default function PartsBentoGrid({ lang }: { lang: Locale }) {
  const shouldReduce = useReducedMotion()

  return (
    <m.div
      variants={gridVariants}
      initial={shouldReduce ? 'visible' : 'hidden'}
      whileInView={'visible'}
      viewport={{ once: true, margin: '-10% 0px' }}
      className={'grid grid-cols-1 gap-4 md:grid-cols-3'}
    >
      {bentoParts.map((part) => (
        <m.article
          key={part.key}
          variants={cardVariants}
          className={`group bg-surface-raised relative rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01] ${
            part.span === 'wide' ? 'md:col-span-2' : ''
          }`}
          style={{ contain: 'layout style paint' }}
        >
          {/* box-shadow 애니메이션 금지 — 사전 렌더된 그림자 레이어의 opacity만 전환 */}
          <span
            aria-hidden
            className={
              'pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-[0_16px_40px_-16px_rgba(11,18,32,0.35)] transition-opacity duration-300 group-hover:opacity-100'
            }
          />
          <span
            aria-hidden
            className={`absolute top-6 left-0 h-8 w-1 rounded-r ${part.accentClass}`}
          />
          <h3 className={'text-ink text-xl font-semibold'}>{part.title}</h3>
          <p className={'text-ink/70 mt-2 text-sm leading-relaxed'}>
            {part.content[lang]}
          </p>
        </m.article>
      ))}
    </m.div>
  )
}
