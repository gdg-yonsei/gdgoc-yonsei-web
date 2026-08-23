import Image from 'next/image'
import ImageSliderController from '@/app/components/images-slider-controller'

export default function ImageSliderGallery({
  images,
  alt,
}: {
  images: string[]
  alt: string
}) {
  return (
    <ImageSliderController
      key={`${images[0] ?? 'empty'}:${images.length}`}
      alt={alt}
      slides={images.map((image, index) => (
        <Image
          key={`${image}:slide:${index}`}
          src={image}
          alt={`${alt} — image ${index + 1} of ${images.length}`}
          fill
          preload={index === 0}
          sizes="(max-width: 768px) 100vw, 576px"
          className="absolute top-0 left-0 h-full w-full object-contain"
        />
      ))}
      thumbnails={images.map((image, index) => (
        <Image
          key={`${image}:thumbnail:${index}`}
          src={image}
          alt=""
          width={100}
          height={100}
          sizes="96px"
          className="aspect-square size-24 rounded-lg object-cover transition-all"
        />
      ))}
    />
  )
}
