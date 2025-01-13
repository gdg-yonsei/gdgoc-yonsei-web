export default function getGenerationFormData(formData: FormData) {
  const name = formData.get('name') as string
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string | null

  return { name, startDate, endDate }
}
