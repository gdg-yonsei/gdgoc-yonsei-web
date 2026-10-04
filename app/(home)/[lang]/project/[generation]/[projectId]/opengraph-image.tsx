/**
 * 프로젝트 상세의 Open Graph 이미지(1200×630, 요청 시 생성 후 캐시).
 */
import {
  generateProjectSocialImageMetadata,
  renderProjectSocialImage,
  type ProjectSocialImageParams,
} from '@/lib/seo/social-image-routes'
import {
  SOCIAL_IMAGE_CONTENT_TYPE,
  SOCIAL_IMAGE_SIZE,
} from '@/lib/seo/social-image-config'

/** 이미지 크기와 형식. 모든 소셜 이미지가 `lib/seo/social-image-config.ts`의 규격을 함께 쓴다. */
export const size = SOCIAL_IMAGE_SIZE
export const contentType = SOCIAL_IMAGE_CONTENT_TYPE

/** 언어·버전별 이미지 id와 대체 텍스트. 내용이 바뀌면 id(버전)가 바뀌어 SNS 캐시를 우회한다. */
export function generateImageMetadata({
  params,
}: {
  params: ProjectSocialImageParams
}) {
  return generateProjectSocialImageMetadata(params)
}

/** 이미지를 생성한다. */
export default function Image({
  params,
  id,
}: {
  params: Promise<ProjectSocialImageParams>
  id: Promise<string | number>
}) {
  return renderProjectSocialImage(params, id)
}
