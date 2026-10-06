import Image from 'next/image'
import { toPublicImageUrl } from '@/lib/image-url'

const DEFAULT_PROFILE_IMAGE = '/default-user-profile.png'

/** src는 외부 아바타 URL 또는 R2 키이며, 키는 공개 도메인과 슬래시 하나로 연결한다. */
export default function UserProfileImage({
  src,
  alt,
  width,
  height,
  className,
}: {
  src: string | null
  alt: string
  width: number
  height: number
  className: string
}) {
  const imageUrl = !src
    ? DEFAULT_PROFILE_IMAGE
    : /^https?:\/\//.test(src)
      ? src
      : toPublicImageUrl(src)

  return (
    <Image
      src={imageUrl}
      alt={alt}
      width={width}
      height={height}
      className={`${className} object-cover`}
      placeholder={'blur'}
      blurDataURL={DEFAULT_PROFILE_IMAGE}
    />
  )
}
