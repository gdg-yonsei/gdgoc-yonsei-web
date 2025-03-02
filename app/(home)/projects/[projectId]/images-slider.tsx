'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function ImagesSliders({ images }: { images: string[] }) {
  const [imageIndex, setImageIndex] = useState(0)

  return (
    <div className={'w-full overflow-hidden flex flex-col p-2 gap-4'}>
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

        <Image
          src={images[imageIndex]}
          alt={''}
          width={200}
          height={200}
          className={'object-contain w-full aspect-square'}
          priority={false}
        />

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
            alt={'Project Image'}
            key={i}
            width={100}
            height={100}
            priority={false}
            className={`size-24 aspect-square object-cover ${imageIndex === i ? 'grayscale' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
