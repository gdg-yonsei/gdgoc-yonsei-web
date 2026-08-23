'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function ImageSliderController({
  alt,
  slides,
  thumbnails,
}: {
  alt: string
  slides: ReactNode[]
  thumbnails: ReactNode[]
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue

          const index = slideRefs.current.findIndex(
            (slide) => slide === entry.target
          )
          if (index >= 0) setCurrentImageIndex(index)
        }
      },
      {
        root: scrollRef.current,
        threshold: 0.5,
      }
    )

    for (const slide of slideRefs.current) {
      if (slide) observer.observe(slide)
    }

    return () => observer.disconnect()
  }, [slides.length])

  function scrollToImage(index: number) {
    const track = scrollRef.current
    if (!track) return

    setCurrentImageIndex(index)
    track.scrollTo({
      left: track.clientWidth * index,
      behavior: 'smooth',
    })
  }

  function scrollByDirection(direction: -1 | 1) {
    const nextIndex = Math.min(
      slides.length - 1,
      Math.max(0, currentImageIndex + direction)
    )
    if (nextIndex !== currentImageIndex) scrollToImage(nextIndex)
  }

  return (
    <div className="flex w-full flex-col items-center md:flex-row md:items-start md:justify-center">
      <div
        className="flex w-full max-w-xl min-w-0 snap-x snap-mandatory overflow-x-scroll bg-neutral-100 whitespace-nowrap transition-all"
        ref={scrollRef}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            ref={(element) => {
              slideRefs.current[index] = element
            }}
            className="relative w-full flex-shrink-0 snap-center"
            style={{ paddingTop: '100%' }}
          >
            {slide}
          </div>
        ))}
      </div>
      <div className="w-full max-w-xl md:w-24">
        <div className="flex w-full items-center justify-between p-2 md:w-28">
          <button
            type="button"
            onClick={() => scrollByDirection(-1)}
            disabled={currentImageIndex === 0}
            aria-label="Previous image"
            className="rounded-full p-1 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeftIcon className="size-8" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByDirection(1)}
            disabled={currentImageIndex === slides.length - 1}
            aria-label="Next image"
            className="rounded-full p-1 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRightIcon className="size-8" aria-hidden="true" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-scroll p-2 whitespace-nowrap md:h-[528px] md:w-28 md:flex-col md:overflow-y-scroll">
          {thumbnails.map((thumbnail, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show ${alt} image ${index + 1}`}
              aria-current={currentImageIndex === index ? 'true' : undefined}
              onClick={() => scrollToImage(index)}
              className={`shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 ${
                currentImageIndex === index ? 'brightness-50 grayscale' : ''
              }`}
            >
              {thumbnail}
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          {`${alt} image ${currentImageIndex + 1} of ${slides.length}`}
        </p>
      </div>
    </div>
  )
}
