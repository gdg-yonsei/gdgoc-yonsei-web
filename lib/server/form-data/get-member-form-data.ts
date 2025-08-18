/**
 * @file This file contains a function to extract member profile data from a FormData object.
 */

/**
 * Represents the possible user roles.
 */
type Role = 'MEMBER' | 'CORE' | 'LEAD' | 'ALUMNUS' | 'UNVERIFIED' | null;

/**
 * Extracts member-related data from a FormData object.
 * This is typically used for handling form submissions for member profiles.
 *
 * @param formData - The FormData object containing the member's data.
 * @returns An object containing the extracted member information.
 */
export default function getMemberFormData(formData: FormData): {
  name: string | null;
  firstName: string | null;
  firstNameKo: string | null;
  lastName: string | null;
  lastNameKo: string | null;
  email: string | null;
  githubId: string | null;
  instagramId: string | null;
  linkedInId: string | null;
  major: string | null;
  studentId: string | null;
  telephone: string | null;
  role: Role;
  isForeigner: boolean;
  profileImage: string | null;
} {
  const name = formData.get('name') as string | null;
  const firstName = formData.get('firstName') as string | null;
  const firstNameKo = formData.get('firstNameKo') as string | null;
  const lastName = formData.get('lastName') as string | null;
  const lastNameKo = formData.get('lastNameKo') as string | null;
  const email = formData.get('email') as string | null;
  const githubId = formData.get('githubId') as string | null;
  const instagramId = formData.get('instagramId') as string | null;
  const linkedInId = formData.get('linkedInId') as string | null;
  const major = formData.get('major') as string | null;
  const studentId = formData.get('studentId') as string | null;
  const telephone = formData.get('telephone') as string | null;
  const role = formData.get('role') as Role;
  const isForeigner = formData.get('isForeigner') === 'true';
  const profileImage = formData.get('profileImage') as string | null;

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
  };
}