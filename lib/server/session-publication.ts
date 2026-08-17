import 'server-only'

export const SESSION_DEFAULT_IMAGE = '/session-default.png'

export const SESSION_PUBLICATION_IMAGE_ERROR =
  'A custom main image is required before publishing a session on the website.'

function getImagePath(value: string): string {
  try {
    return new URL(value, 'https://local.invalid').pathname
  } catch {
    return value
  }
}

/**
 * The database default is a useful in-page placeholder, but it is not a
 * representative event image and must not be used for newly published posts.
 */
export function hasCustomSessionMainImage(
  value: string | null | undefined
): value is string {
  const normalizedValue = value?.trim()

  return Boolean(
    normalizedValue && getImagePath(normalizedValue) !== SESSION_DEFAULT_IMAGE
  )
}

type SessionPublicationTransition = {
  nextDisplayOnWebsite: boolean
  nextMainImage: string | null | undefined
  previousDisplayOnWebsite?: boolean
  previousMainImage?: string | null
}

/**
 * Enforces representative images at the publication boundary while preserving
 * the ability to edit legacy public sessions that predate the rule.
 */
export function getSessionPublicationImageError({
  nextDisplayOnWebsite,
  nextMainImage,
  previousDisplayOnWebsite = false,
  previousMainImage,
}: SessionPublicationTransition): string | null {
  if (!nextDisplayOnWebsite) {
    return null
  }

  const effectiveMainImage = nextMainImage?.trim() || previousMainImage
  if (hasCustomSessionMainImage(effectiveMainImage)) {
    return null
  }

  const isUnchangedLegacyPublication =
    previousDisplayOnWebsite &&
    !hasCustomSessionMainImage(previousMainImage) &&
    !hasCustomSessionMainImage(effectiveMainImage)

  return isUnchangedLegacyPublication ? null : SESSION_PUBLICATION_IMAGE_ERROR
}
