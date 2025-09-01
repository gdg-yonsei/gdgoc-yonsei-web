import { z } from 'zod'

/**
 * Member 데이터 타입 검증 스키마
 */
export const memberValidation = z.object({
  name: z.string().nonempty('Name is required'),
  firstName: z.string().nonempty('First Name (English) is required'),
  firstNameKo: z.string().nonempty('First Name (Korean) is required'),
  lastName: z.string().nonempty('Last Name (English) is required'),
  lastNameKo: z.string().nonempty('Last Name (Korean) is required'),
  email: z.string().email(),
  githubId: z.string().nullable(),
  instagramId: z.string().nullable(),
  linkedInId: z.string().nullable(),
  major: z.string(),
  studentId: z.string(),
  telephone: z.string(),
  role: z.enum(['MEMBER', 'CORE', 'LEAD', 'ALUMNUS', 'UNVERIFIED']).nullable(),
  isForeigner: z.boolean(),
  profileImage: z.string().nullable(),
})
