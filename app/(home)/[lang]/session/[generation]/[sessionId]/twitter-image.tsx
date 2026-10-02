/**
 * 세션 상세의 Twitter 카드 이미지. Open Graph 이미지와 같은 그림을 쓴다.
 */
import {
  generateSessionSocialImageMetadata,
  renderSessionSocialImage,
  type SessionSocialImageParams,
} from '@/lib/seo/social-image-routes'

/**
 * 이미지 크기. `lib/seo/social-image-config.ts`의 `SOCIAL_IMAGE_SIZE`와 같은 값이어야 한다
 * (Next가 이 파일의 export를 직접 읽으므로 리터럴로 둔다).
 */
export const size = { width: 1200, height: 630 }
/** 이미지 형식(`SOCIAL_IMAGE_CONTENT_TYPE`과 같은 값). */
export const contentType = 'image/jpeg'

/** 언어·버전별 이미지 id와 대체 텍스트. 내용이 바뀌면 id(버전)가 바뀌어 SNS 캐시를 우회한다. */
export function generateImageMetadata({
  params,
}: {
  params: SessionSocialImageParams
}) {
  return generateSessionSocialImageMetadata(params)
}

/** 이미지를 생성한다. */
export default function Image({
  params,
  id,
}: {
  params: Promise<SessionSocialImageParams>
  id: Promise<string | number>
}) {
  return renderSessionSocialImage(params, id)
}
