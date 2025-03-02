'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function ImagesSliders({ images }: { images: string[] }) {
  const [imageIndex, setImageIndex] = useState(0)

  return (
    <div className={'w-full overflow-hidden flex flex-col p-4 gap-4'}>
      <div className={'flex w-full'}>
        <button
          type={'button'}
          onClick={() => {
            if (imageIndex !== 0) {
              setImageIndex((prev) => prev - 1)
            }
          }}
        >
          <ChevronLeftIcon className={'size-8'} />
        </button>
        <div
          className={
            'flex transition-transform duration-500 ease-in-out w-[90%]'
          }
        >
          <Image
            src={images[imageIndex]}
            alt={''}
            width={200}
            height={200}
            className={'w-auto flex-shrink-0'}
            priority={false}
          />
        </div>
        <button
          type={'button'}
          onClick={() => {
            if (imageIndex !== images.length - 1) {
              setImageIndex((prev) => prev + 1)
            }
          }}
        >
          <ChevronRightIcon className={'size-8'} />
        </button>
      </div>
      <div className={'flex gap-2 overflow-x-scroll'}>
        {images.map((src, i) => (
          <Image
            src={src}
            alt={'  '}
            key={i}
            width={100}
            height={100}
            priority={false}
          />
        ))}
      </div>
    </div>
  )
}
