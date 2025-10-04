import { z } from 'zod'

/**
 * Accept Member 데이터 타입 검증 스키마
 */
export const deleteMemberValidation = z.object({
  userId: z
    .string({ message: 'User Id is required' })
    .nonempty('User Id is required'),
})
