'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import ChevronLeftIcon from '@heroicons/react/24/outline/ChevronLeftIcon'
import ChevronRightIcon from '@heroicons/react/24/outline/ChevronRightIcon'
import type { Locale } from '@/i18n-config'

export default function ActivitiesCarousel({
  children,
  lang,
}: {
  children: ReactNode
  lang: Locale
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollPrevious, setCanScrollPrevious] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)

  const updateButtonState = useCallback(() => {
    const track = trackRef.current
    if (!track) return

    const maximumScrollLeft = track.scrollWidth - track.clientWidth
    setCanScrollPrevious(track.scrollLeft > 1)
    setCanScrollNext(track.scrollLeft < maximumScrollLeft - 1)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    updateButtonState()

    const resizeObserver = new ResizeObserver(updateButtonState)
    resizeObserver.observe(track)

    return () => resizeObserver.disconnect()
  }, [updateButtonState])

  function scrollByCard(direction: -1 | 1) {
    const track = trackRef.current
    if (!track) return

    const cards = track.querySelectorAll<HTMLElement>('[data-activity-card]')
    const firstCard = cards.item(0)
    const secondCard = cards.item(1)
    const scrollAmount =
      firstCard && secondCard
        ? secondCard.offsetLeft - firstCard.offsetLeft
        : (firstCard?.offsetWidth ?? track.clientWidth)

    track.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth',
    })
  }

  const labels =
    lang === 'ko'
      ? {
          carousel: '주요 활동 카드',
          previous: '이전 활동 보기',
          next: '다음 활동 보기',
        }
      : {
          carousel: 'Activity cards',
          previous: 'Show previous activity',
          next: 'Show next activity',
        }

  return (
    <div
      className="flex w-full flex-col items-center gap-4"
      role="region"
      aria-label={labels.carousel}
    >
      <div
        ref={trackRef}
        onScroll={updateButtonState}
        data-activity-track
        className="no-scrollbar flex w-full snap-x snap-mandatory gap-6 overflow-x-auto px-[max(1rem,calc(50vw-32rem))] py-8"
      >
        {children}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          disabled={!canScrollPrevious}
          aria-label={labels.previous}
          className="inline-flex size-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeftIcon className="size-6" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          disabled={!canScrollNext}
          aria-label={labels.next}
          className="inline-flex size-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRightIcon className="size-6" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
