/**
 * 가입 승인 입력 스키마.
 *
 * 입력 검증 스키마(zod). 서비스 계층이 웹 폼과 MCP 입력을 모두 이 스키마로 검증한다.
 * 오류 문구는 관리자 화면과 MCP 응답에 그대로 보이므로 영어로 쓴다.
 */
import { z } from 'zod'

/** 가입 승인: 승인할 사용자 ID와 부여할 역할(member/core/alumni 중 하나, 소문자). */
export const acceptMemberValidation = z.object({
  userId: z
    .string({ message: 'User Id is required' })
    .trim()
    .nonempty('User Id is required'),
  role: z.enum(['member', 'core', 'alumni']),
})
