'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function ImagesSliders({ images }: { images: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
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
    <div
      className={
        'flex w-full flex-col items-center md:flex-row md:items-start md:justify-center'
      }
      ref={boxRef}
    >
      {/*Images*/}
      <div
        className="flex w-full max-w-xl min-w-0 snap-x snap-mandatory overflow-x-scroll bg-neutral-100 whitespace-nowrap transition-all"
        ref={scrollRef}
      >
        {images.map((image, i) => (
          <div
            key={i}
            className="relative w-full flex-shrink-0 snap-center"
            style={{ paddingTop: '100%' }}
          >
            <Image
              src={image}
              alt=""
              fill
              className="absolute top-0 left-0 h-full w-full object-contain"
            />
          </div>
        ))}
      </div>
      <div className={'w-full max-w-xl md:w-24'}>
        {/*Image Control Button Group*/}
        <div className={'flex w-full items-center justify-between p-2 md:w-28'}>
          <button
            type={'button'}
            onClick={() => scroll('left')}
            className={
              'rounded-full p-1 transition-colors hover:bg-neutral-100'
            }
          >
            <ChevronLeftIcon className={'size-8'} />
          </button>
          <button
            type={'button'}
            onClick={() => scroll('right')}
            className={
              'rounded-full p-1 transition-colors hover:bg-neutral-100'
            }
          >
            <ChevronRightIcon className={'size-8'} />
          </button>
        </div>
        {/*Image Preview*/}
        <div
          className={
            'flex gap-2 overflow-x-scroll p-2 whitespace-nowrap md:h-[528px] md:w-28 md:flex-col md:overflow-y-scroll'
          }
        >
          {images.map((image, i) => (
            <Image
              key={i}
              src={image}
              alt={'Preview'}
              width={100}
              height={100}
              className={`aspect-square size-24 rounded-lg object-cover transition-all ${index === i && 'brightness-50 grayscale'}`}
              onClick={() => imagePreviewClick(i)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
