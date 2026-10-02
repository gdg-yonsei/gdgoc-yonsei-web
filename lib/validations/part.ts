/**
 * 파트 입력 스키마.
 *
 * 입력 검증 스키마(zod). 서비스 계층이 웹 폼과 MCP 입력을 모두 이 스키마로 검증한다.
 * 오류 문구는 관리자 화면과 MCP 응답에 그대로 보이므로 영어로 쓴다.
 */
import { z } from 'zod'

/**
 * 파트 입력. 주 소속(`membersList`)과 겸임(`doubleBoardMembersList`) 목록은 각각 중복이
 * 없어야 하고, 같은 사람이 두 목록에 함께 있으면 안 된다.
 */
export const partValidation = z
  .object({
    name: z
      .string({ message: 'Name is required' })
      .trim()
      .nonempty('Name is required'),
    description: z.string().nullable(),
    displayOrder: z.number().int().min(-2147483648).max(2147483647).optional(),
    generationId: z
      .number({ message: 'Invalid Generation' })
      .gte(1, { message: 'Invalid Generation' }),
    membersList: z
      .array(z.string().trim().min(1, 'Member is required'))
      .refine((list) => new Set(list).size === list.length, {
        message: 'Duplicate members are not allowed.',
      }),
    doubleBoardMembersList: z
      .array(z.string().trim().min(1, 'Member is required'))
      .refine((list) => new Set(list).size === list.length, {
        message: 'Duplicate members are not allowed.',
      }),
  })
  .superRefine((data, ctx) => {
    const { membersList, doubleBoardMembersList } = data

    // 두 목록의 교집합 검사
    const duplicates = membersList.filter((m) =>
      doubleBoardMembersList.includes(m)
    )

    if (duplicates.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'There are duplicate members between members and double board members.',
        path: ['membersList'],
      })
    }
  })
