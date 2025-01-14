import Image from 'next/image'

/**
 * User profile image preview component
 * @param src - image source
 * @param alt - image alt
 * @param width - image width
 * @param height - image height
 * @param className - Image Component ClassName
 * @constructor
 */
export default function UserProfileImagePreview({
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
      src={
        src
          ? src.includes('http') || src.includes('data:image')
            ? src
            : `https://image.gdgyonsei.moveto.kr/${src}`
          : '/default-user-profile.png'
      }
      alt={alt}
      width={width}
      height={height}
      className={`${className} object-cover`}
    />
  )
}
