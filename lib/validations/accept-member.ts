// 웹 폼·MCP 응답에 검증 오류가 그대로 보여 영어로 쓴다.
import { z } from 'zod'

/** 가입 승인: 승인할 사용자 ID와 부여할 역할(member/core/alumni 중 하나, 소문자). */
export const acceptMemberValidation = z.object({
  userId: z
    .string({ message: 'User Id is required' })
    .trim()
    .nonempty('User Id is required'),
  role: z.enum(['member', 'core', 'alumni']),
})
