import Image from 'next/image'
import { toPublicImageUrl } from '@/lib/image-url'

/** 프로필 이미지가 없을 때 쓰는 기본 이미지. */
const DEFAULT_PROFILE_IMAGE = '/default-user-profile.png'

/**
 * 사용자 프로필 이미지.
 *
 * `src`는 외부 URL(GitHub·Google 아바타)이거나 R2 객체 키다. 객체 키는 공개 이미지
 * 도메인과 슬래시 하나로 이어 붙인다. 이미지가 없으면 기본 이미지를 보여 준다.
 */
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
