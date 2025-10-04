/**
 * @file This file contains a function to extract member acceptance data from a FormData object.
 */

/**
 * Extracts the user ID and role from the provided form data for member acceptance.
 *
 * @param formData - The FormData object containing the member acceptance data.
 *                   It is expected to have 'userId' and 'role' fields.
 * @returns An object containing the userId and role.
 */
export default function getDeleteMemberFormData(formData: FormData): {
  userId: string
} {
  const userId = formData.get('userId') as string

  return { userId }
}
