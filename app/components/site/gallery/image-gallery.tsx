import Image from 'next/image'
import ImageGalleryController from '@/app/components/site/gallery/image-gallery-controller'
import { galleryCopy } from '@/lib/contents/gallery-copy'
import { fillTemplate } from '@/lib/format/text'
import type { Locale } from '@/lib/i18n'

/** 이미지는 서버에서 렌더링해 노드로 넘기고, 클라이언트 컨트롤러는 스크롤·버튼·키보드 이동만 맡는다. */
export default function ImageGallery({
  images,
  alt,
  lang,
}: {
  images: string[]
  alt: string
  lang: Locale
}) {
  const copy = galleryCopy[lang]

  return (
    // 이미지 목록이 바뀌면 key가 바뀌어 컨트롤러 상태(현재 위치)가 처음으로 돌아간다.
    <ImageGalleryController
      key={`${images[0] ?? 'empty'}:${images.length}`}
      alt={alt}
      copy={copy}
      slides={images.map((image, index) => (
        <Image
          key={`${image}:slide:${index}`}
          src={image}
          alt={fillTemplate(copy.slideAlt, {
            alt,
            index: index + 1,
            total: images.length,
          })}
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
