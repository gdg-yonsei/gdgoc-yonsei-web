export default function getMemberFormData(formData: FormData) {
  const name = formData.get('name') as string | null
  const firstName = formData.get('firstName') as string | null
  const lastName = formData.get('lastName') as string | null
  const email = formData.get('email') as string | null
  const githubId = formData.get('githubId') as string | null
  const instagramId = formData.get('instagramId') as string | null
  const linkedInId = formData.get('linkedInId') as string | null
  const major = formData.get('major') as string | null
  const studentId = formData.get('studentId') as string | null
  const telephone = formData.get('telephone') as string | null
  const role = formData.get('role') as
    | 'MEMBER'
    | 'CORE'
    | 'LEAD'
    | 'ALUMNUS'
    | null
  const isForeigner = formData.get('isForeigner') === 'true'

  return {
    name,
    firstName,
    lastName,
    email,
    githubId,
    instagramId,
    linkedInId,
    major,
    studentId,
    telephone,
    role,
    isForeigner,
  }
}
