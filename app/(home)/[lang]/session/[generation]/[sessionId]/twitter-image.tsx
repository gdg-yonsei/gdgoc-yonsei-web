import {
  generateSessionSocialImageMetadata,
  renderSessionSocialImage,
  type SessionSocialImageParams,
} from '@/lib/seo/social-image-routes'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/jpeg'

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
