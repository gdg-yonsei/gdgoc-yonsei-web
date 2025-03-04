'use client'

import Image from 'next/image'

export default function ImagesSliders({ images }: { images: string[] }) {
  return (
    <div className={'flex overflow-x-scroll whitespace-nowrap snap-x'}>
      {images.map((image, i) => (
        <div
          key={i}
          className={
            'relative size-svw aspect-1/1 ring-2 bg-red-300 snap-center'
          }
        >
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
  )
}
