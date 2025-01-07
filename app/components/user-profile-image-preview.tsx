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
    // eslint-disable-next-line @next/next/no-img-element
    <img
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
