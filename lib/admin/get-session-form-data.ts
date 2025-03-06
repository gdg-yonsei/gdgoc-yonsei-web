/**
 * Get project form data from form data
 * @param formData - form data
 */
export default function getSessionFormData(formData: FormData) {
  const name = formData.get('name') as string | null
  const description = formData.get('description') as string | null
  const mainImage = formData.get('mainImage') as string | null
  const contentImages = formData.get('contentImages') as string
  const contentImagesArray = JSON.parse(contentImages) as string[]
  const generationId = formData.get('generationId') as string | null
  const eventDate = formData.get('eventDate') as string | null

  return {
    name,
    description,
    mainImage,
    contentImages: contentImagesArray,
    generationId,
    eventDate,
  }
}
