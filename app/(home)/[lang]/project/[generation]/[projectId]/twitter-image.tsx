import {
  generateProjectSocialImageMetadata,
  renderProjectSocialImage,
  type ProjectSocialImageParams,
} from '@/lib/seo/social-image-routes'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/jpeg'

export function generateImageMetadata({
  params,
}: {
  params: ProjectSocialImageParams
}) {
  return generateProjectSocialImageMetadata(params)
}

export default function Image({
  params,
  id,
}: {
  params: Promise<ProjectSocialImageParams>
  id: Promise<string | number>
}) {
  return renderProjectSocialImage(params, id)
}
