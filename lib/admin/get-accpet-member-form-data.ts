/**
 * Get the accept member form data
 * @param formData - form data
 */
export default function getAccpetMemberFormData(formData: FormData) {
  const userId = formData.get('userId') as string
  const role = formData.get('role') as string

  return { userId, role }
}
