import Image from 'next/image'

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
  return (
    <Image
      src={src ? src : '/default-user-profile.png'}
      alt={alt}
      width={width}
      height={height}
      className={`${className} object-cover`}
      placeholder={'blur'}
      blurDataURL={'/default-user-profile.png'}
    />
  )
}
