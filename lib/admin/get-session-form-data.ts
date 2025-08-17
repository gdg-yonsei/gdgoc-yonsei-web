/**
 * @file This file contains a function to extract session data from a FormData object.
 */

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
  eventDate: string | null
  location: string | null
  locationKo: string | null
  openSession: boolean
  maxCapacity: number
  partId: string | null
  participantId: string[]
} {
  const name = formData.get('name') as string | null
  const nameKo = formData.get('nameKo') as string | null
  const description = formData.get('description') as string | null
  const descriptionKo = formData.get('descriptionKo') as string | null
  const mainImage = formData.get('mainImage') as string | null
  const location = formData.get('location') as string | null
  const locationKo = formData.get('locationKo') as string | null
  const openSession = formData.get('openSession') === 'true'
  const maxCapacity = Number(formData.get('maxCapacity'))
  const partId = formData.get('partId') as string | null
  const participantId = JSON.parse(
    formData.get('participantId') as string
  ) as string[]

  // Safely parse contentImages JSON string
  const contentImages = formData.get('contentImages') as string
  let contentImagesArray: string[] = []
  try {
    if (contentImages) {
      contentImagesArray = JSON.parse(contentImages) as string[]
    }
  } catch (error) {
    console.error('Failed to parse contentImages:', error)
    // Default to an empty array in case of an error
  }

  const generationId = formData.get('generationId') as string | null
  const eventDate = formData.get('eventDate') as string | null

  return {
    name,
    nameKo,
    description,
    descriptionKo,
    mainImage,
    contentImages: contentImagesArray,
    generationId,
    eventDate,
    location,
    locationKo,
    partId,
    participantId,
    maxCapacity,
    openSession,
  }
}
