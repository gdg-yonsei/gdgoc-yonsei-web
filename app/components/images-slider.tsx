'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function ImagesSliders({ images }: { images: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState<number>(0)

  function imagePreviewClick(i: number) {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount = scrollRef.current.clientWidth * (index - i) // 이동 거리 (픽셀 단위)
      setIndex(i)

      current.scrollTo({
        left: current.scrollLeft - scrollAmount,
        behavior: 'smooth', // 스크롤 애니메이션 추가
      })
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef
      const scrollAmount = scrollRef.current.clientWidth // 이동 거리 (픽셀 단위)

      if (direction === 'left') {
        if (index !== 0) {
          setIndex((prev) => prev - 1)
        }
      } else {
        if (index !== images.length - 1) {
          setIndex((prev) => prev + 1)
        }
      }

      current.scrollTo({
        left:
          direction === 'left'
            ? current.scrollLeft - scrollAmount
            : current.scrollLeft + scrollAmount,
        behavior: 'smooth', // 스크롤 애니메이션 추가
      })
    }
  }

  return (
    <div className={'w-full'}>
      <div
        className={
          'flex overflow-x-scroll whitespace-nowrap snap-x bg-neutral-100 transition-all'
        }
        ref={scrollRef}
      >
        {images.map((image, i) => (
          <div key={i} className={'relative size-svw aspect-1/1 snap-center'}>
            <Image
              key={i}
              src={image}
              alt={''}
              fill={true}
              className={'object-contain'}
            />
          </div>
        ))}
      </div>
      <div className={'p-2 flex items-center justify-between'}>
        <button type={'button'} onClick={() => scroll('left')}>
          <ChevronLeftIcon className={'size-8'} />
        </button>
        <button type={'button'} onClick={() => scroll('right')}>
          <ChevronRightIcon className={'size-8'} />
        </button>
      </div>

      <div className={'flex overflow-x-scroll whitespace-nowrap gap-2 p-2'}>
        {images.map((image, i) => (
          <Image
            key={i}
            src={image}
            alt={'Preview'}
            width={100}
            height={100}
            className={`size-24 object-cover rounded-lg transition-all ${index === i && 'grayscale brightness-50'}`}
            onClick={() => imagePreviewClick(i)}
          />
        ))}
      </div>
    </div>
  )
}
