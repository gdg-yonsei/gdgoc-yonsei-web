/**
 * @file This file contains a function to extract generation data from a FormData object.
 */

/**
 * Extracts generation-related data (name, startDate, endDate) from a FormData object.
 *
 * @param formData - The FormData object containing the generation data.
 *                   It is expected to have 'name', 'startDate', and optionally 'endDate' fields.
 * @returns An object containing the name, startDate, and endDate.
 */
export default function getGenerationFormData(formData: FormData): {
  name: string;
  startDate: string;
  endDate: string | null;
} {
  const name = formData.get('name') as string;
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string | null;

  return { name, startDate, endDate };
}