'use client'

/**
 * 이미지 갤러리의 스크롤·버튼·썸네일·키보드 이동(클라이언트 컴포넌트).
 *
 * 가로 스크롤 스냅 트랙을 쓰고, 현재 위치는 IntersectionObserver로 화면에 절반 이상
 * 보이는 슬라이드에서 읽는다. 그래서 손가락으로 넘겨도 버튼·카운터가 맞게 갱신된다.
 */
import type { KeyboardEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import ChevronLeftIcon from '@heroicons/react/24/outline/ChevronLeftIcon'
import ChevronRightIcon from '@heroicons/react/24/outline/ChevronRightIcon'
import type { GalleryCopy } from '@/lib/contents/gallery-copy'
import { fillTemplate } from '@/lib/format/text'

/**
 * 슬라이드와 썸네일 노드를 받아 캐러셀로 묶는다. 이미지가 한 장이면 컨트롤을 숨긴다.
 * @param alt 갤러리 이름(캐러셀 라벨)
 * @param copy 현재 언어의 갤러리 문구
 * @param slides 서버에서 렌더링한 슬라이드 이미지
 * @param thumbnails 슬라이드와 같은 순서의 썸네일 이미지
 */
export default function ImageGalleryController({
  alt,
  copy,
  slides,
  thumbnails,
}: {
  alt: string
  copy: GalleryCopy
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
      { root: scrollRef.current, threshold: 0.5 }
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
    track.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' })
  }

  function scrollByDirection(direction: -1 | 1) {
    const nextIndex = Math.min(
      slides.length - 1,
      Math.max(0, currentImageIndex + direction)
    )
    if (nextIndex !== currentImageIndex) scrollToImage(nextIndex)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    scrollByDirection(event.key === 'ArrowRight' ? 1 : -1)
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={alt}
      className="site-gallery"
    >
      <div
        ref={scrollRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="site-gallery-track"
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            ref={(element) => {
              slideRefs.current[index] = element
            }}
            className="site-gallery-slide"
          >
            {slide}
          </div>
        ))}
      </div>
      {slides.length > 1 && (
        <>
          <div className="site-gallery-bar">
            <button
              type="button"
              onClick={() => scrollByDirection(-1)}
              disabled={currentImageIndex === 0}
              aria-label={copy.previous}
              className="site-gallery-button"
            >
              <ChevronLeftIcon aria-hidden="true" className="size-5" />
            </button>
            <p aria-hidden="true" className="site-gallery-count">
              {currentImageIndex + 1} / {slides.length}
            </p>
            <button
              type="button"
              onClick={() => scrollByDirection(1)}
              disabled={currentImageIndex === slides.length - 1}
              aria-label={copy.next}
              className="site-gallery-button"
            >
              <ChevronRightIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="site-gallery-thumbs">
            {thumbnails.map((thumbnail, index) => (
              <button
                key={index}
                type="button"
                aria-label={fillTemplate(copy.thumbnail, {
                  alt,
                  index: index + 1,
                })}
                aria-current={currentImageIndex === index ? 'true' : undefined}
                onClick={() => scrollToImage(index)}
                className="site-gallery-thumb"
              >
                {thumbnail}
              </button>
            ))}
          </div>
        </>
      )}
      <p className="sr-only" aria-live="polite">
        {fillTemplate(copy.status, {
          alt,
          index: currentImageIndex + 1,
          total: slides.length,
        })}
      </p>
    </div>
  )
}
