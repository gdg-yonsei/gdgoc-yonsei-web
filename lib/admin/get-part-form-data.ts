/**
 * @file This file contains a function to extract part data from a FormData object.
 */

/**
 * Extracts part-related data from a FormData object.
 * This includes the part's name, description, associated generation ID, and a list of members.
 *
 * @param formData - The FormData object containing the part data.
 *                   It is expected to have 'name', 'description', 'generationId', and 'membersList' (as a JSON string) fields.
 * @returns An object containing the extracted part information.
 */
export default function getPartFormData(formData: FormData): {
  name: string | null;
  description: string | null;
  generationId: number;
  membersList: string[];
} {
  const name = formData.get('name') as string | null;
  const description = formData.get('description') as string | null;
  const generationId = Number(formData.get('generationId') as string | null);
  const membersList = JSON.parse(
    formData.get('membersList') as string,
  ) as string[];

  return { name, description, generationId, membersList };
}