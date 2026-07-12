/**
 * @file This file contains a function to extract project data from a FormData object.
 */

function getNullableUrl(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Extracts project-related data from a FormData object.
 * This function handles both regular fields and JSON string fields for arrays.
 *
 * @param formData - The FormData object containing the project data.
 * @returns An object containing the extracted project information.
 */
export default function getProjectFormData(formData: FormData): {
  name: string | null
  nameKo: string | null
  description: string | null
  descriptionKo: string | null
  content: string | null
  contentKo: string | null
  mainImage: string | null
  generationId: string | null
  contentImages: string[]
  participants: string[]
  repoUrl: string | null
  demoUrl: string | null
} {
  const name = formData.get('name') as string | null
  const nameKo = formData.get('nameKo') as string | null
  const description = formData.get('description') as string | null
  const descriptionKo = formData.get('descriptionKo') as string | null
  const content = formData.get('content') as string | null
  const contentKo = formData.get('contentKo') as string | null
  const mainImage = formData.get('mainImage') as string | null

  // Safely parse contentImages JSON string
  const contentImages = formData.get('contentImages') as string
  let contentImagesArray: string[] = []
  try {
    contentImagesArray = JSON.parse(contentImages) as string[]
  } catch (error) {
    console.error('Failed to parse contentImages:', error)
    // Handle error appropriately, maybe default to an empty array
  }

  // Safely parse participants JSON string
  const participants = formData.get('participants') as string
  let participantsArray: string[] = []
  try {
    participantsArray = JSON.parse(participants) as string[]
  } catch (error) {
    console.error('Failed to parse participants:', error)
    // Handle error appropriately
  }

  const generationId = formData.get('generationId') as string | null
  const repoUrl = getNullableUrl(formData, 'repoUrl')
  const demoUrl = getNullableUrl(formData, 'demoUrl')

  return {
    name,
    nameKo,
    description,
    descriptionKo,
    content,
    contentKo,
    mainImage,
    generationId,
    contentImages: contentImagesArray,
    participants: participantsArray,
    repoUrl,
    demoUrl,
  }
}
