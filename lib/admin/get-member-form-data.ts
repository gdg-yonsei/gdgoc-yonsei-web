/**
 * Get member form data from form data
 * @param formData - form data
 */
export default function getMemberFormData(formData: FormData) {
  const name = formData.get('name') as string | null
  const firstName = formData.get('firstName') as string | null
  const firstNameKo = formData.get('firstNameKo') as string | null
  const lastName = formData.get('lastName') as string | null
  const lastNameKo = formData.get('lastNameKo') as string | null
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
    | 'UNVERIFIED'
    | null
  const isForeigner = formData.get('isForeigner') === 'true'
  const profileImage = formData.get('profileImage') as string | null

  return {
    name,
    firstName,
    firstNameKo,
    lastName,
    lastNameKo,
    email,
    githubId,
    instagramId,
    linkedInId,
    major,
    studentId,
    telephone,
    role,
    isForeigner,
    profileImage,
  }
}
