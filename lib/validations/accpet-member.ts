import { z } from 'zod'

/**
 * Accept Member 데이터 타입 검증 스키마
 */
export const acceptMemberValidation = z.object({
  userId: z
    .string({ message: 'User Id is required' })
    .nonempty('User Id is required'),
  role: z.string().nonempty('Role is required'),
})
