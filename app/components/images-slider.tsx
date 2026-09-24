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
          sizes="(min-width: 1152px) 720px, calc(100vw - 2rem)"
        />
      ))}
      thumbnails={images.map((image, index) => (
        <Image
          key={`${image}:thumbnail:${index}`}
          src={image}
          alt=""
          width={80}
          height={80}
          sizes="80px"
          className="size-20 object-cover"
        />
      ))}
    />
  )
}
