/**
 * 전체 URL(또는 없음)로 프로필 이미지를 보여 주는 미리보기 컴포넌트. 업로드 직후처럼 이미 공개 URL이 있을 때 쓴다.
 */
import Image from 'next/image'

/**
 * `src`가 없으면 기본 프로필 이미지를 보여 준다.
 *
 * @param src 이미지 URL
 * @param alt 대체 텍스트
 * @param width/height 렌더링 크기(px)
 * @param className `next/image`에 넘길 클래스
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
      src={src ? src : '/default-user-profile.png'}
      alt={alt}
      width={width}
      height={height}
      className={`${className} object-cover`}
    />
  )
}
