import { z } from 'zod'

/**
 * Member 데이터 타입 검증 스키마
 */
export const memberValidation = z.object({
  name: z.string().nonempty('Name is required'),
  firstName: z.string().nonempty('First Name is required'),
  lastName: z.string().nonempty('Last Name is required'),
  email: z.string().email().nullable(),
  githubId: z.string().nullable(),
  instagramId: z.string().nullable(),
  linkedInId: z.string().nullable(),
  major: z.string().nullable(),
  studentId: z.string().nullable(),
  telephone: z.string().nullable(),
  role: z.enum(['MEMBER', 'CORE', 'LEAD', 'ALUMNUS', 'UNVERIFIED']).nullable(),
  isForeigner: z.boolean(),
  profileImage: z.string().nullable(),
})
