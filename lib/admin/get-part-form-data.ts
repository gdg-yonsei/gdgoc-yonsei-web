/**
 * Get the part form data from the form data object
 * @param formData
 */
export default function getPartFormData(formData: FormData) {
  const name = formData.get('name') as string | null
  const description = formData.get('description') as string | null
  const generationId = Number(formData.get('generationId') as string | null)
  const membersList = JSON.parse(
    formData.get('membersList') as string
  ) as string[]

  return { name, description, generationId, membersList }
}
