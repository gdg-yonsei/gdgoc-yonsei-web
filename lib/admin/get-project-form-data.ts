/**
 * Get project form data from form data
 * @param formData - form data
 */
export default function getProjectFormData(formData: FormData) {
  const name = formData.get('name') as string | null
  const description = formData.get('description') as string | null

  return {
    name,
    description,
  }
}
