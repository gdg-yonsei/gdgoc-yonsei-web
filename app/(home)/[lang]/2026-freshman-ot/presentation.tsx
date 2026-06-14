'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Locale } from '@/i18n-config'

import CoverSlide from './components/slides/cover-slide'
import WhatIsGDGoCSlide from './components/slides/what-is-gdgoc-slide'
import GDGoCYonseiSlide from './components/slides/gdgoc-yonsei-slide'
import ActivitiesSessionProjectSlide from './components/slides/activities-session-project-slide'
import ActivitiesNetworkingHackathonSlide from './components/slides/activities-networking-hackathon-slide'
import FuturePlansSlide from './components/slides/future-plans-slide'
import RecruitmentDevSlide from './components/slides/recruitment-dev-slide'
import RecruitmentDesignSlide from './components/slides/recruitment-design-slide'
import ThankYouSlide from './components/slides/thank-you-slide'

const SLIDE_COUNT = 9

/**
 * `FreshmanOTPresentation` 컴포넌트는 전달받은 props와 현재 상태를 기반으로 화면(UI)을 구성하여 렌더링합니다.
 */
export default function FreshmanOTPresentation({ lang }: { lang: Locale }) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const isAnimating = useRef(false)

  const slides = [
    <CoverSlide key="cover" lang={lang} />,
    <WhatIsGDGoCSlide key="what" lang={lang} />,
    <GDGoCYonseiSlide key="yonsei" lang={lang} />,
    <ActivitiesSessionProjectSlide key="activities-1" lang={lang} />,
    <ActivitiesNetworkingHackathonSlide key="activities-2" lang={lang} />,
    <FuturePlansSlide key="plans" lang={lang} />,
    <RecruitmentDevSlide key="recruit-dev" lang={lang} />,
    <RecruitmentDesignSlide key="recruit-design" lang={lang} />,
    <ThankYouSlide key="thanks" lang={lang} />,
  ]

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating.current) return
      if (index < 0 || index >= SLIDE_COUNT) return
      isAnimating.current = true
      setDirection(index > current ? 1 : -1)
      setCurrent(index)
      setTimeout(() => {
        isAnimating.current = false
      }, 700)
    },
    [current]
  )

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'Enter':
          e.preventDefault()
          next()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          prev()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [next, prev])

  // Scroll navigation
  useEffect(() => {
    let lastTime = 0
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const now = Date.now()
      if (now - lastTime < 800) return
      lastTime = now
      if (e.deltaY > 0) next()
      else if (e.deltaY < 0) prev()
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [next, prev])

  // Touch swipe navigation
  useEffect(() => {
    let startX = 0
    let startY = 0
    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0]?.clientX ?? 0
      startY = e.touches[0]?.clientY ?? 0
    }
    const handleTouchEnd = (e: TouchEvent) => {
      const dx = startX - (e.changedTouches[0]?.clientX ?? 0)
      const dy = startY - (e.changedTouches[0]?.clientY ?? 0)
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx > 0) next()
        else prev()
      } else if (Math.abs(dy) > 50) {
        if (dy > 0) next()
        else prev()
      }
    }
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [next, prev])

  // Click navigation (right half → next, left half → prev)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      if (x > rect.width * 0.5) next()
      else prev()
    },
    [next, prev]
  )

  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? '80%' : '-80%',
      opacity: 0,
      scale: 0.94,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? '-40%' : '40%',
      opacity: 0,
      scale: 0.96,
    }),
  }

  return (
    <div
      className="fixed inset-0 z-50 cursor-pointer overflow-hidden bg-white select-none"
      onClick={handleClick}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.45, 0, 0.55, 1] }}
          className="absolute inset-0"
        >
          <div className="h-full overflow-y-auto">{slides[current]}</div>
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute right-0 bottom-0 left-0 z-50 flex gap-1 px-4 pb-4 md:gap-1.5 md:px-8 md:pb-6">
        {Array.from({ length: SLIDE_COUNT }).map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              goTo(i)
            }}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i === current
                ? 'bg-gdg-blue-300'
                : i < current
                  ? 'bg-gdg-blue-300/30'
                  : 'bg-neutral-300/60'
            }`}
          />
        ))}
      </div>

      {/* Slide number */}
      <div className="absolute right-4 bottom-7 z-50 font-mono text-xs tracking-widest text-neutral-400 md:right-8 md:bottom-10">
        {String(current + 1).padStart(2, '0')} /{' '}
        {String(SLIDE_COUNT).padStart(2, '0')}
      </div>
    </div>
  )
}
