/**
 * @file This file contains a function to extract session data from a FormData object.
 */

function parseStringArrayFromJson(value: FormDataEntryValue | null): string[] {
  if (typeof value !== 'string' || value.length === 0) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch (error) {
    console.error('Failed to parse array field:', error)
    return []
  }
}

/**
 * Extracts session-related data from a FormData object.
 * This function handles both regular fields and a JSON string for content images.
 *
 * @param formData - The FormData object containing the session data.
 * @returns An object containing the extracted session information.
 */
export default function getSessionFormData(formData: FormData): {
  name: string | null
  nameKo: string | null
  description: string | null
  descriptionKo: string | null
  mainImage: string | null
  contentImages: string[]
  generationId: string | null
  startAt: Date | null
  endAt: Date | null
  location: string | null
  locationKo: string | null
  internalOpen: boolean
  publicOpen: boolean
  maxCapacity: number
  partId: string | null
  participantId: string[]
  type: 'Part Session' | 'General Session'
  displayOnWebsite: boolean
} {
  const name = formData.get('name') as string | null
  const nameKo = formData.get('nameKo') as string | null
  const description = formData.get('description') as string | null
  const descriptionKo = formData.get('descriptionKo') as string | null
  const mainImage = formData.get('mainImage') as string | null
  const location = formData.get('location') as string | null
  const locationKo = formData.get('locationKo') as string | null
  const internalOpen = formData.get('internalOpen') === 'true'
  const publicOpen = formData.get('publicOpen') === 'true'
  const maxCapacity = Number(formData.get('maxCapacity'))
  const partId = formData.get('partId') as string | null
  const participantId = parseStringArrayFromJson(formData.get('participantId'))
  const type = formData.get('type') as string
  const displayOnWebsite = formData.get('displayOnWebsite') === 'true'

  let sessionType: 'Part Session' | 'General Session' = 'Part Session'
  if (type === 'General Session') {
    sessionType = 'General Session'
  }

  // Safely parse contentImages JSON string
  const contentImagesArray = parseStringArrayFromJson(formData.get('contentImages'))

  const generationId = formData.get('generationId') as string | null
  const startAt = new Date(formData.get('startAt') as string)
  const endAt = new Date(formData.get('endAt') as string)

  return {
    name,
    nameKo,
    description,
    descriptionKo,
    mainImage,
    contentImages: contentImagesArray,
    generationId,
    location,
    locationKo,
    partId,
    participantId,
    maxCapacity,
    internalOpen,
    publicOpen,
    startAt,
    endAt,
    type: sessionType,
    displayOnWebsite,
  }
}
