import {
  generateSessionSocialImageMetadata,
  renderSessionSocialImage,
  type SessionSocialImageParams,
} from '@/lib/seo/social-image-routes'
import {
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from '@/lib/seo/social-image-config'

export const size = SOCIAL_IMAGE_SIZE
export const contentType = SOCIAL_IMAGE_CONTENT_TYPE

/** 언어·버전별 이미지 id와 대체 텍스트. 내용이 바뀌면 id(버전)가 바뀌어 SNS 캐시를 우회한다. */
export function generateImageMetadata({
  params,
}: {
  params: SessionSocialImageParams
}) {
  return generateSessionSocialImageMetadata(params)
}

export default function Image({
  params,
  id,
}: {
  params: Promise<SessionSocialImageParams>
  id: Promise<string | number>
}) {
  return renderSessionSocialImage(params, id)
}
